import * as _ from 'lodash'
import * as d3 from 'd3'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import './sunburst.less'

interface Props {
    version: any,
    dimensions: {
        width: number,
        height: number,
        toolbox_width: number,
        toolbox_height: number,
    },
    padding: {
        top: number,
        right: number,
        bottom: number,
        left: number,
    },
    colors: any,
    data: any,
}

interface State {

}

export class Sunburst extends React.Component<Props, State> {
    hierarchy: any
    d3Hierarchy: any
    selectedHierarchy: any

    // D3
    refs: any
    domSvg: any
    domContainer: any

    radius: any
    xScale: any
    xTargetScale: any
    yScale: any
    partition: any
    arc: any
    b: any
    totalSize: any
    path: any

    initAttributes() {
        this.totalSize = 0

        this.arc = d3.arc()
            .startAngle((d: any) => d.x0)
            .endAngle((d: any) => d.x1)
            .innerRadius((d: any) => Math.sqrt(d.y0))
            .outerRadius((d: any) => Math.sqrt(d.y1))
    }

    updateAttributes() {
        this.domSvg
            .attr('width', this.props.dimensions.width)
            .attr('height', this.props.dimensions.height)
        this.domContainer
            .attr('transform', 'translate(' + this.props.dimensions.width / 2 + ',' + this.props.dimensions.height / 2 + ')')
        this.domSvg.select('#info')
            .attr('transform', 'translate(' + this.props.dimensions.width / 2 + ',' + this.props.dimensions.height / 2 + ')')

        this.radius = Math.min(this.props.dimensions.width, this.props.dimensions.height) / 2
        this.partition = d3.partition()
            .size([1, 1])

        this.xScale = d3.scaleLinear()
            .range([0, 2 * Math.PI])

        this.xTargetScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, 2 * Math.PI])

        this.yScale = d3.scaleSqrt()
            .range([0, this.radius])

        this.arc = d3.arc()
            .startAngle((d: any) => Math.max(0, Math.min(2 * Math.PI, this.xScale(d.x0))))
            .endAngle((d: any) => Math.max(0, Math.min(2 * Math.PI, this.xScale(d.x1))))
            .innerRadius((d: any) => Math.max(0, this.yScale(d.y0)))
            .outerRadius((d: any) => Math.max(0, this.yScale(d.y1)))
    }

    drawSunburst() {
        let descendants = this.selectedHierarchy.descendants()
        let ancestors = this.selectedHierarchy.ancestors()

        let nodes = this.partition(this.d3Hierarchy)
            .descendants()
            .filter((d: any) => {
                return (ancestors.indexOf(d) != -1) || (descendants.indexOf(d) != -1 && (this.xTargetScale(d.x1) - this.xTargetScale(d.x0) > 0.005))
            })
            // For PLF2017, filtering allows to go from 3000 nodes to 300.

        this.path = this.domContainer
            .selectAll('path')
                .data(nodes, (d: any) => d.data.name)

        this.path.exit().remove()

        this.path
            .enter()
                .append('path')
                // .attr('display', (d: any) => d.depth ? null : 'none')
                .on('mouseover', this.handleMouseOver.bind(this))
                .on('click', this.handleClick.bind(this))
            .merge(this.path)
                .attr('d', this.arc)
                .attr('fill-rule', 'evenodd')
                .style('fill', (d: any) => {
                    if (d.data.name != 'root') {
                        return this.props.colors[d.ancestors().reverse()[1].data.index % this.props.colors.length]
                    } else {
                        return '#5C7080'
                    }
                })
                .style('opacity', 1)

        d3.select('#container').on('mouseleave', this.handleMouseleave.bind(this))

        this.totalSize = this.selectedHierarchy.value
    }

    handleClick(d: any) {
        // TODO: when clicking, hierarchy should be recomputed and include nodes which
        // are not currently displayed because they are too small
        let selectedHierarchy = null
        this.d3Hierarchy.each((node: any) => {
            if (node == d) {
                selectedHierarchy = node
            }
        })

        console.log([d.x0, d.x1])
        this.xTargetScale = d3.scaleLinear()
            .domain([d.x0, d.x1])

        this.selectedHierarchy = selectedHierarchy
        this.drawSunburst()

        this.domContainer
            .transition()
            .duration(500)
            .tween('scale', () => {
                let xdomain = d3.interpolate(this.xScale.domain(), [d.x0, d.x1])
                let ydomain = d3.interpolate(this.yScale.domain(), [d.y0, 1])
                let yrange = d3.interpolate(this.yScale.range(), [d.y0 ? 30 : 0, this.radius])

                return ((t: any) => {
                    this.xScale.domain(xdomain(t))
                    this.yScale.domain(ydomain(t)).range(yrange(t))
                })
            })
            .selectAll('path')
            .attrTween('d', (d: any) => (() => this.arc(d)))
    }

    handleMouseOver(d: any) {
        let percentage = (100 * d.value / this.totalSize).toPrecision(3) as any
        let percentageString = percentage + '%'
        if (percentage < 0.1) {
            percentageString = '< 0.1%'
        }

        d3.select('#header')
            .text(percentageString)

        d3.select('#info')
            .style('visibility', '')

        let sequenceArray = d.ancestors().reverse()
        // sequenceArray.shift()
        this.updateBreadcrumbs(sequenceArray, percentageString)

        d3.selectAll('path')
            .style('opacity', 0.3)

        this.domContainer.selectAll('path')
            .filter((node: any) => (sequenceArray.indexOf(node) >= 0))
            .style('opacity', 1)
    }

    handleMouseleave(d: any) {
        d3.select('#main #breadcrumbs')
            .style('visibility', 'hidden')

        d3.selectAll('path')
            .transition()
            .duration(150)
            .style('opacity', 1)

        d3.select('#info')
            .style('visibility', 'hidden')
    }

    updateBreadcrumbs(nodeArray: any, percentageString: any) {
        d3.select('#main #breadcrumbs').style('visibility', '')

        let breads = d3.select('#main #breadcrumbs #breadcrumb-list')
            .selectAll('li')
                .data(nodeArray, (d: any) => d.data.name + d.depth)

        breads.exit().remove()
        breads.enter()
            .append('li')
                .append('a')
                    .attr('class', 'pt-breadcrumb')
                    .html((d: any) => d.data.name)
    }

    buildHierarchy(csv: any) {
        let root = {
            'name': 'root',
            'children': [] as any,
        }

        for (let i = 0; i < csv.length; i++) {
            let sequence = csv[i][0]
            let size = (csv[i].length > 1) ? (+csv[i][1]) : 1
            if (isNaN(size)) {
                continue
            }

            let parts = sequence.split('|')
            let currentNode = root
            for (let j = 0; j < parts.length; j++) {
                let children = currentNode['children']
                let nodeName = parts[j]
                let childNode
                if (j + 1 < parts.length) {
                    let foundChild = false
                    for (let k = 0; k < children.length; k++) {
                        if (children[k]['name'] == nodeName) {
                            childNode = children[k]
                            foundChild = true
                            break
                        }
                    }
                    if (!foundChild) {
                        childNode = {
                            'name': nodeName,
                            'children': []
                        }
                        children.push(childNode)
                    }
                    currentNode = childNode
                } else {
                    childNode = {
                        'name': nodeName,
                        'size': size
                    }
                    children.push(childNode)
                }
            }
        }
        return root
    }


    // REACT LIFECYCLE
    constructor(props: Props) {
        super(props)
    }

    componentDidMount() {
        this.domSvg = d3.select(this.refs.container)
        this.domContainer = d3.select('#container')
        this.initAttributes()
        this.updateAttributes()
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        // if (nextProps.version === this.props.version) {
        //     return false
        // }
        return true
    }

    componentDidUpdate() {
        this.updateAttributes()
        let defaultData = `
            orion|sunburst|redo;120
            orion|sunburst|understand;50
            orion|sunburst|typing;10
            orion|fun;40
            mva|homework;30
        `

        let data: string = this.props.data ? this.props.data : defaultData

        let csv = d3.dsvFormat(';').parseRows(data)
        this.hierarchy = this.buildHierarchy(csv)

        this.d3Hierarchy = d3.hierarchy(this.hierarchy)
            .sum((d: any) => d.size)
            .sort((a: any, b: any) => b.value - a.value)

        let i = 0
        this.d3Hierarchy.each((node: any) => {
            if (node.depth == 1) {
                node.data.index = i
                i++
            }
        })

        this.selectedHierarchy = this.d3Hierarchy

        this.drawSunburst()
    }

    render() {
        let {width, height} = this.props.dimensions

        return (
            <div>
                <div id='main'>
                    <div id='chart'>
                        <svg
                            ref='container'
                            width={width}
                            height={height}
                            className={'sunburst'}
                        >
                            <g id='sunburst'>
                                <g id='container'></g>
                                <g id='info'>
                                    <text id='header'></text>
                                    <text id='sub'>sub</text>
                                </g>
                            </g>
                        </svg>
                    </div>
                    <div id='breadcrumbs'>
                        <ul id='breadcrumb-list' className='pt-breadcrumbs'></ul>
                    </div>
                </div>
            </div>
        )
    }
}
