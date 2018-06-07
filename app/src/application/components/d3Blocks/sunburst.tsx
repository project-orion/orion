import {
    Switch,
} from '@blueprintjs/core'
import * as _ from 'lodash'
import * as d3 from 'd3'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as slug from 'slug'

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
    hideComplements?: boolean,
}

interface State {
    displayValue: boolean,
    displaySearchResults: boolean,
    searchedString: string,
    selectedHierarchy: any,
}

export class Sunburst extends React.Component<Props, State> {
    d3Hierarchy: any
    selectedHierarchy: any
    nodes: any
    filteredNodes: any

    // D3
    refs: any
    domSvg: any
    domContainer: any
    size: number
    height: number
    width: number

    radius: any
    xScale: any
    xTargetScale: any
    yScale: any
    partition: any
    arc: any
    b: any
    totalSize: any
    relativeSize: any
    path: any

    updateAttributes() {
        let defaultData = `
            orion|sunburst|redo;120
            orion|sunburst|understand;50
            orion|sunburst|typing;10
            orion|fun;40
            mva|homework;30
        `

        let data: string = this.props.data ? this.props.data : defaultData

        let csv = d3.dsvFormat(';').parseRows(data)
        let hierarchy = this.buildHierarchy(csv)

        this.d3Hierarchy = d3.hierarchy(hierarchy)
            .sum((d: any) => d.size)
            .sort((a: any, b: any) => b.value - a.value)

        let i = 0
        let cIndex = 0
        this.d3Hierarchy.each((node: any) => {
            if (node.depth == 1) {
                node.data.cIndex = cIndex
                cIndex++
            }
            node.data.index = i
            i++
        })

        this.totalSize = this.d3Hierarchy.value
        this.selectedHierarchy = this.d3Hierarchy
        this.nodes = this.d3Hierarchy.descendants()

        this.height = this.props.dimensions.height
        this.width = this.props.dimensions.width
        this.size = Math.min(this.height, this.width)

        this.domSvg
            .attr('width', this.size)
            .attr('height', this.size)
        this.domContainer
            .attr('transform', 'translate(' + this.size / 2 + ',' + this.size / 2 + ')')
        this.domSvg.select('#info')
            .attr('transform', 'translate(' + this.size / 2 + ',' + this.size / 2 + ')')

        this.radius = Math.min(this.size, this.size) / 2
        this.partition = d3.partition()
            .size([1, 1])

        this.xScale = d3.scaleLinear()
            .range([0, 2 * Math.PI])

        this.xTargetScale = d3.scaleLinear()
            .range([0, 1])

        this.yScale = d3.scaleSqrt()
            .range([0, this.radius])

        this.arc = d3.arc()
            .startAngle((d: any) => Math.max(0, Math.min(2 * Math.PI, this.xScale(d.x0))))
            .endAngle((d: any) => Math.max(0, Math.min(2 * Math.PI, this.xScale(d.x1))))
            .innerRadius((d: any) => Math.max(0, this.yScale(d.y0)))
            .outerRadius((d: any) => Math.max(0, this.yScale(d.y1)))

    }

    updateFilteredNodes() {
        let descendants = this.selectedHierarchy.descendants()
        let ancestors = this.selectedHierarchy.ancestors()

        this.filteredNodes = this.partition(this.d3Hierarchy)
            .descendants()
            .filter((d: any) => {
                return (ancestors.indexOf(d) != -1) || (descendants.indexOf(d) != -1 && (this.xTargetScale(d.x1) - this.xTargetScale(d.x0) > 0.005))
            })
            // For PLF2017, filtering allows to go from 3000 nodes to 300.
    }

    drawSunburst() {
        this.path = this.domContainer
            .selectAll('path')
                .data(this.filteredNodes, (d: any) => d.data.index)

        this.path.exit().remove()

        this.path
            .enter()
                .append('path')
                // .attr('display', (d: any) => d.depth ? null : 'none')
                .on('mouseover', this.handleMouseOver.bind(this))
                .on('click', (d: any) => this.handleClick(d.data.index))
            .merge(this.path)
                .attr('d', this.arc)
                .attr('fill-rule', 'evenodd')
                .style('fill', (d: any) => {
                    if (d.depth != 0) {
                        return this.props.colors[d.ancestors().reverse()[1].data.cIndex % this.props.colors.length]
                    } else {
                        return '#5C7080'
                    }
                })
                .style('opacity', 1)

        d3.select('#container').on('mouseleave', this.handleMouseleave.bind(this))

        this.relativeSize = this.selectedHierarchy.value
    }

    handleClick(nodeIndex: string) {
        let selectedHierarchy = null
        this.d3Hierarchy.each((node: any) => {
            if (node.data.index == nodeIndex) {
                selectedHierarchy = node
            }
        })

        let selectedNode: any = null
        this.nodes.forEach((node: any) => {
            if (node.data.index == nodeIndex) {
                selectedNode = node
            }
        })

        this.xTargetScale = d3.scaleLinear()
            .domain([selectedNode.x0, selectedNode.x1])

        this.selectedHierarchy = selectedHierarchy

        this.setState({
            displaySearchResults: false,
            selectedHierarchy: selectedHierarchy,
        }, () => {
            this.domContainer
                .transition()
                .duration(500)
                .tween('scale', () => {
                    let xdomain = d3.interpolate(this.xScale.domain(), [selectedNode.x0, selectedNode.x1])
                    let ydomain = d3.interpolate(this.yScale.domain(), [selectedNode.y0, 1])
                    let yrange = d3.interpolate(this.yScale.range(), [selectedNode.y0 ? 30 : 0, this.radius])

                    return ((t: any) => {
                        this.xScale.domain(xdomain(t))
                        this.yScale.domain(ydomain(t)).range(yrange(t))
                    })
                })
                .selectAll('path')
                .attrTween('d', (d: any) => (() => this.arc(d)))
        })
    }


    numberWithCommas = (x: number) => {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    }

    handleMouseOver(d: any) {
        let totalPercentage = (100 * d.value / this.totalSize).toPrecision(3) as any
        let totalPercentageString = totalPercentage + '%'
        let relativePercentage = (100 * d.value / this.relativeSize).toPrecision(3) as any
        let relativePercentageString = relativePercentage + '%'

        if (relativePercentage < 0.1) {
            relativePercentageString = '< 0.1%'
        }

        d3.select('#total')
            .text(totalPercentageString)

        d3.select('#relative')
            .text(relativePercentageString)

        d3.select('#absoluteValue')
            .text(this.numberWithCommas(d.value))

        d3.select('#values')
            .style('visibility', '')

        let sequenceArray = d.ancestors().reverse()
        this.updateBreadcrumbs(sequenceArray)

        d3.selectAll('path')
            .style('opacity', 0.3)

        this.domContainer.selectAll('path')
            .filter((node: any) => (sequenceArray.indexOf(node) >= 0))
            .style('opacity', 1)
    }

    handleMouseleave(d: any) {
        d3.select('#main #breadcrumbs')
            .style('visibility', 'hidden')

        d3.select('#values')
            .style('visibility', 'hidden')

        d3.selectAll('path')
            .transition()
            .duration(150)
            .style('opacity', 1)
    }

    updateBreadcrumbs(nodeArray: any) {
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

    // REACT LIFECYCLE
    constructor(props: Props) {
        super(props)
        this.state = {
            displayValue: true,
            displaySearchResults: false,
            searchedString: '',
            selectedHierarchy: null,
        }
    }

    componentDidMount() {
        this.domSvg = d3.select(this.refs.container)
        this.domContainer = d3.select('#container')
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        if (this.state == nextState) {
            if (nextProps.version === this.props.version) {
                if (nextProps.data === this.props.data) {
                    return false
                }
            }
        }
        return true
    }

    buildHierarchy(csv: any) {
        let root = {
            'name': 'PLF',
            'children': [] as any,
        }

        for (let i = 0; i < csv.length; i++) {
            let sequence = csv[i][0]
            let size = (csv[i].length > 1 && this.state.displayValue) ? (+csv[i][1]) : 1
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
                            'children': [],
                        }
                        children.push(childNode)
                    }
                    currentNode = childNode
                } else {
                    childNode = {
                        'name': nodeName,
                        'size': size,
                    }
                    children.push(childNode)
                }
            }
        }
        return root
    }

    componentDidUpdate() {
        // If object is rendered for the first time since props.data
        // was updated:
        if(!this.state.selectedHierarchy) {
            this.updateAttributes()
        }

        this.updateFilteredNodes()
        this.drawSunburst()
    }

    changeDisplayValue() {
        this.setState((prevState: any, props: any) => {
            return {
                displayValue: !prevState.displayValue,
            }
        })
    }

    searchInputFocused() {
        this.setState({
            displaySearchResults: true,
        })
    }

    searchInputUpdated(event: any) {
        this.setState({
            searchedString: event.target.value,
        })
    }

    render() {
        let {width, height} = this.props.dimensions
        let selectedNodes: any = []

        if (this.state.searchedString != '') {
            this.d3Hierarchy.each((node: any) => {
                if (slug(node.data.name, {lower: true}).indexOf(this.state.searchedString) != -1) {
                    selectedNodes.push(node)
                }
            })
        }

        let selectedResultsLi = _.map(selectedNodes, (node: any) => {
            return <li
                key={node.data.index}
                onClick={() => {
                    this.handleClick.bind(this, node.data.index)()
                }}
            >
                <ul className='pt-breadcrumbs'>
                    {_.map(node.ancestors().reverse(), (ancestor: any, index: number) =>
                        <li className='pt-breadcrumb' key={index}>
                            {ancestor.data.name}
                        </li>
                    )}
                </ul>
            </li>
        })

        const {hideComplements} = this.props
        // undefined -> show
        // true -> hide
        // false -> show
        let filterDiv = <div className='block'>
            <div className='pt-input-group searchBar'>
                <span className='pt-icon pt-icon-search'></span>
                <input className='pt-input' placeholder='Recherche...'
                    onFocus={this.searchInputFocused.bind(this)}
                    onChange={this.searchInputUpdated.bind(this)}
                />
            </div>
            <div id='foundResults' className={'search-results ' + (this.state.displaySearchResults ? '' : 'hidden')}>
                <ul>
                    {selectedResultsLi}
                </ul>
            </div>
        </div>

        let switchDiv = <div id='toolbox'>
            <Switch checked={this.state.displayValue} label='Surface proportionnelle à la valeur' onChange={this.changeDisplayValue.bind(this)} />
        </div>

        if (hideComplements) {
            filterDiv = null
            switchDiv = null
        }

        return (
            <div id='main'>
                {filterDiv}
                <div className={(this.state.displaySearchResults ? 'hidden' : '')}>
                    {switchDiv}
                    <div className={'flex-box '}>
                        <div id='svgDiv'>
                            <div id='values'>
                                <div id='absoluteValue'></div>
                                <div id='percentages'>
                                    <div id='total'></div>
                                    <div id='relative'></div>
                                </div>
                            </div>
                            <div id='chart'>
                                <svg
                                    ref='container'
                                    width={Math.min(width, height)}
                                    height={Math.min(width, height)}
                                    className={'sunburst'}
                                >
                                    <g id='sunburst'>
                                        <g id='container'></g>
                                    </g>
                                </svg>
                            </div>
                        </div>
                        <div id='breadcrumbs'>
                            <ul id='breadcrumb-list' className='pt-breadcrumbs'></ul>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
