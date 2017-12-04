import * as _ from 'lodash'
import * as d3 from 'd3'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import './conceptHierarchy.less'

import * as actions from '../../actions'
import * as interceptClick from './utils/interceptClick'
import {
    action,
    conceptLinksAttribute,
    extendedConceptNodeAttribute,
} from './../../types'
import * as wrap from './utils/wrap'

interface d3GraphNode extends d3.SimulationNodeDatum, extendedConceptNodeAttribute {}

interface d3GraphLink extends d3.SimulationNodeDatum, conceptLinksAttribute {}

interface Props {
    version: number,
    nodes: extendedConceptNodeAttribute[],
    graph: any,
    selectedRoot: any,
    selectedNode: any,
    dimensions: {
        width: number,
        height: number,
    }
    searchedConcept: string,
    dispatch: any
}

interface State {
    selected: string,
}

export function ConceptHierarchyReducer(nodes: any): any {
    let nodeDict: any = {}
    let graph: any = []

    function searchDict(slug: any): any {
        if (slug in nodeDict) {
            let r = searchDict(nodeDict[slug])
            nodeDict[slug] = r
            return r
        } else {
            return slug
        }
    }

    let cc = 0
    nodes.forEach((node: any) => {
        if (node.parent) {
            nodeDict[node.slug] = searchDict(node.parent)
        } else {
            nodeDict[node.slug] = cc
            cc++
        }
    })

    function recursiveCC(slug: any): any {
        if (typeof nodeDict[slug] === 'number') {
            return nodeDict[slug]
        } else {
            let r = recursiveCC(nodeDict[slug])
            nodeDict[slug] = r
            return r
        }
    }

    for (let slug in nodeDict) {
        nodeDict[slug] = recursiveCC(slug)
    }

    nodes = _.map(nodes, (node: any) => {
        return {
            ...node,
            connexComponent: nodeDict[node.slug],
        }
    })

    for (let i = 0; i < cc; i++) {
        let n = _.filter(nodes, (node: any) => node.connexComponent == i)
        let h = d3.stratify()
            .id((d: any) => d.slug)
            .parentId((d: any) => d.parent)
            (n)
        graph.push(h)
    }

    let graphNodes: any = []
    graph.forEach((rootNode: any) => {
        rootNode.each((node: any) => {
            graphNodes.push(node)
        })
    })

    return {
        nodes,
        graph,
        graphNodes,
    }
}

export class ConceptHierarchy extends React.Component<Props, State> {
    // D3

    // All these parameters are simple parameters; one doesn't use
    // React props only since they imply abiding by the React lifecycle
    // whereas we want to have our simulation ran by d3.
    width: number
    height: number
    svgDimensions = {
        m: {
            t: 15,
            r: 5,
            b: 5,
            l: 5,
        }
    }
    rectDimensions = {
        w: 55,
        h: 30,
        m: {
            t: 10,
            r: 5,
            b: 10,
            l: 5,
        },
        rm: {
            t: 10,
            r: 15,
            b: 10,
            l: 15,
        }
    }
    tooltipDimensions = {
        w: 120,
        h: 15,
        p: {
            t: 10,
            r: 5,
            b: 10,
            l: 5,
        },
        t: {
            w: 12,
            h: 12,
        }
    }
    transitionDuration = 50

    rebind = interceptClick.rebind
    interceptClick = interceptClick.interceptClick
    interceptClickHandlerRoot: any
    interceptClickHandlerHierarchy: any

    domSvg: any
    domHierarchy: any
    domHierarchyRects: any
    domTopTicks: any
    domBottomTicks: any
    domLines: any
    domRoots: any
    domRootRects: any

    hierarchy: any
    nodes: any
    graph: any
    fnodes: any

    selectedRoot: any
    selectedNode: any

    rectsPerLevel: any
    indexParentPerLevel: any
    selectedNodeAncestors: any
    displayedNodes: any
    xFactor: any
    yFactor: any
    xFactorRoot: any
    yFactorRoot: any
    depthIncrement: any

    initAttributes() {
        this.interceptClickHandlerRoot = this.interceptClick()
        this.interceptClickHandlerHierarchy = this.interceptClick()
    }

    updateHierarchyNodes() {
        this.fnodes = []

        if (this.selectedRoot) {
            this.selectedRoot.each((node: any) => {
                this.fnodes.push(node)
            })
        }
    }

    updateAttributes() {
        let {width, height} = this.props.dimensions
        this.width = width
        this.height = height

        this.nodes = this.props.nodes
        this.graph = this.props.graph

        this.selectedRoot = this.props.selectedRoot
        this.selectedNode = this.props.selectedNode

        this.updateHierarchyNodes()

        this.domHierarchy
            .attr('transform', 'translate(' + this.width / 2 + ',' + this.height / 2 + ')')

        this.domRoots
            .attr('transform', 'translate(' + this.width / 2 + ', 50)')

        this.domSvg.select('#tooltip_container')
            .attr('transform', 'translate(' + this.width / 2 + ',' + this.height / 2 + ')')
            .style('opacity', 0)

        this.domSvg.select('#breadcrumbs')
            .attr('width', this.width)
            .attr('height', '30px')
            .attr('transform', 'translate(' + 0 + ',' + (this.height - 80) + ')')
    }

    updateRenderingAttributes() {
        this.rectsPerLevel = [1]
        this.indexParentPerLevel = [0]
        this.selectedNodeAncestors = this.selectedNode ? this.selectedNode.ancestors() : []

        this.displayedNodes = _.reduce(_.map(this.selectedNodeAncestors.reverse(), (n: any) => n.children ? n.children : []),
            (acc: any, list: any) => {
                if (list.length > 0 && list[0].depth < this.selectedNodeAncestors.length) {
                    list.forEach((node: any, index: number) => {
                        if (node == this.selectedNodeAncestors[node.depth]) {
                            this.indexParentPerLevel.push(index)
                        }
                    })
                }
                this.rectsPerLevel.push(list.length)
                return acc.concat(list)
            },
            [this.selectedRoot]
        )

        this.xFactor = (this.rectDimensions.w + this.rectDimensions.m.r + this.rectDimensions.m.l)
        this.yFactor = (this.rectDimensions.h + this.rectDimensions.m.t + this.rectDimensions.m.b)
        this.xFactorRoot = (this.rectDimensions.w + this.rectDimensions.rm.r + this.rectDimensions.rm.l)
        this.yFactorRoot = (this.rectDimensions.h + this.rectDimensions.rm.t + this.rectDimensions.rm.b)
    }

    restartDepthIncrement() {
        this.depthIncrement = []
        for (let i = 0; i < this.rectsPerLevel.length; i++) {
            this.depthIncrement.push(0)
        }
    }

    parseTranslateTransformation(inputText: string) {
        let r = inputText.split('(')
        if (r.length > 0) {
            r = r[1].split(',')
            return _.map(r, (t: string) => parseFloat(t))
        }

        return null
    }

    handleMouseOver(that: any, d: any) {
        // Place the tooltip in the correct container
        let domParentId = d3.select(this as any).node().parentNode.id

        if (domParentId == 'hierarchy') {
            that.domSvg.select('#tooltip_container')
                .attr('transform', 'translate(' + that.width / 2 + ',' + that.height / 2 + ')')
                .style('opacity', 0)
        } else if (domParentId == 'roots') {
            that.domSvg.select('#tooltip_container')
                .attr('transform', 'translate(' + that.width / 2 + ', 50)')
                .style('opacity', 0)
        }

        let tag = this as any
        let attribute = d3.select(tag).attr('transform')
        let translate = that.parseTranslateTransformation(attribute)

        that.domSvg.select('#tooltip_container')
            .style('opacity', 1)

        that.domSvg.select('#tooltip_content')
            .text(d.data.name)
            .call(_.partial(wrap.wrap, 120))

        that.domSvg.select('#tooltip')
            .attr('transform', () => {
                let xShift = translate[0] + that.rectDimensions.w / 2
                let yShift = translate[1] - d3.selectAll('#tooltip_content tspan').size() * that.tooltipDimensions.h - that.tooltipDimensions.p.b - that.tooltipDimensions.t.h - 4
                return 'translate(' + xShift + ',' + yShift +')'
            })

        that.domSvg.select('#tooltip_background')
            .attr('transform', 'translate(' + (- (that.tooltipDimensions.w + that.tooltipDimensions.p.r + that.tooltipDimensions.p.l) / 2) + ',' + (- that.tooltipDimensions.p.t) +')')
            .attr('width', that.tooltipDimensions.w + that.tooltipDimensions.p.r + that.tooltipDimensions.p.l)
            .attr('height', () => {
                return (d3.selectAll('#tooltip_content tspan').size() * that.tooltipDimensions.h
                    + that.tooltipDimensions.p.t + that.tooltipDimensions.p.b)
            })

        that.domSvg.select('#tooltip_pointer')
            .attr('transform', () => {
                let xShift = - that.tooltipDimensions.t.w / 2
                let yShift = d3.selectAll('#tooltip_content tspan').size() * that.tooltipDimensions.h + that.tooltipDimensions.p.b
                return 'translate(' + xShift + ',' + yShift +')'
            })
    }

    handleMouseOut(that: any, d: any) {
        that.domSvg.select('#tooltip_container')
            .style('opacity', 0)
    }

    customClick(newRootNode: any, node: any) {
        if (newRootNode) {
            this.selectedRoot = node
            this.updateHierarchyNodes()
            this.props.dispatch(actions.changeSelectedRootNav(node))
        }

        this.domSvg.select('#tooltip_container')
            .style('opacity', 0)

        this.selectedNode = node
        this.props.dispatch(actions.changeSelectedNodeNav(node))
    }

    customDoubleClick(node: any) {
        this.selectedNode = node
        this.props.dispatch(actions.changeSelectedNodeNav(node))

        this.props.dispatch(actions.changeDisplayedConceptNav(node))
        // TODO: associate correct container instead of default cp1
        this.props.dispatch(actions.fetchConcept('concepts/' + node.data.slug, 'cp1'))
        this.props.dispatch(actions.toggleNavPanel())
    }

    singleRectTranslation(d: any, index: number=null) {
        let xShift = 0
        let yShift = this.yFactor * d.depth

        if (d.depth < this.rectsPerLevel.length && this.displayedNodes.indexOf(d) > -1) {
            xShift = this.xFactor * (this.depthIncrement[d.depth] - (this.rectsPerLevel[d.depth] - 1) / 2) - this.rectDimensions.w / 2
            if (d.depth < this.indexParentPerLevel.length) {
                xShift -= this.xFactor * (this.indexParentPerLevel[d.depth] - (this.rectsPerLevel[d.depth] - 1) / 2)
            }
            this.depthIncrement[d.depth]++
        }

        return 'translate(' + xShift + ',' + yShift +')'
    }

    renderRectangles() {
        // Draws root rectangles
        let availableRoots = _.filter(this.graph, (root: any) => root != this.selectedRoot)

        this.domRootRects = this.domRoots.selectAll('rect')
            .data(availableRoots, (node: any) => node.data.id)

        this.domRootRects.exit().remove()

        this.domRootRects
            .enter()
                .append('rect')
                .attr('width', this.rectDimensions.w)
                .attr('height', this.rectDimensions.h)
                .on('mouseover', _.partial(this.handleMouseOver, this))
                .on('mouseout', _.partial(this.handleMouseOut, this))
            .merge(this.domRootRects)
                .call(this.interceptClickHandlerRoot
                    .on('customClick', this.customClick.bind(this, true))
                    .on('customDoubleClick', this.customDoubleClick.bind(this))
                )
                .transition()
                .delay(this.transitionDuration)
                .attr('transform', (d: any, index: number) =>
                    'translate(' + (this.xFactorRoot * (index - (availableRoots.length) / 2) + (this.rectDimensions.rm.r + this.rectDimensions.rm.l) / 2) +
                    ',' + this.yFactorRoot + ')'
                )
                .attr('class', (node: any) => {
                    return 'hierarchy-rect' +
                        ((this.selectedNode && node.id == this.selectedNode.id) ? ' selected-rect' : '') +
                        ((this.selectedNodeAncestors.indexOf(node) > -1) ? ' ancestor-rect' : '')
                })

        // Draws hierarchy rectangles
        this.domHierarchyRects = this.domHierarchy.selectAll('rect')
            .data(this.fnodes, (node: any) => node.data.id)

        this.domHierarchyRects.exit().remove()

        this.domHierarchyRects
            .enter()
                .append('rect')
                .attr('width', this.rectDimensions.w)
                .attr('height', this.rectDimensions.h)
            .merge(this.domHierarchyRects)
                .call(this.interceptClickHandlerHierarchy
                    .on('customClick', this.customClick.bind(this, false))
                    .on('customDoubleClick', this.customDoubleClick.bind(this))
                )
                .on('mouseover', _.partial(this.handleMouseOver, this))
                .on('mouseout', _.partial(this.handleMouseOut, this))
                .transition()
                .delay(this.transitionDuration)
                .attr('transform', (d: any) => this.singleRectTranslation(d))
                .attr('display', (d: any) => {
                    let shouldDisplay = this.displayedNodes.indexOf(d) > -1

                    return shouldDisplay ? null : 'none'
                })
                .attr('class', (node: any) => {
                    return 'hierarchy-rect' +
                        ((this.selectedNode && node.id == this.selectedNode.id) ? ' selected-rect' : '') +
                        ((this.selectedNodeAncestors.indexOf(node) > -1) ? ' ancestor-rect' : '')
                })
    }

    renderTopTicks() {
        this.domTopTicks = this.domHierarchy.selectAll('.top-tick')
            .data(this.fnodes)

        this.domTopTicks.exit().remove()

        this.domTopTicks
            .enter()
                .append('line')
            .merge(this.domTopTicks)
                .transition()
                .delay(this.transitionDuration)
                .attr('class', 'top-tick dot-line')
                .attr('display', (d: any) => {
                    let shouldDisplay = this.displayedNodes.indexOf(d) > -1 && d.depth > 0

                    return shouldDisplay ? null : 'none'
                })
                .attr('x1', (d: any, index: number) => this.rectDimensions.w / 2)
                .attr('x2', (d: any, index: number) => this.rectDimensions.w / 2)
                .attr('y1', (d: any, index: any) => -this.rectDimensions.m.t)
                .attr('y2', (d: any, index: any) => 0)
                .attr('transform', (d: any) => this.singleRectTranslation(d))
    }

    renderBottomTicks() {
        this.domBottomTicks = this.domHierarchy.selectAll('.bottom-tick')
            .data(this.fnodes)

        this.domBottomTicks.exit().remove()

        this.domBottomTicks
            .enter()
                .append('line')
            .merge(this.domBottomTicks)
                .transition()
                .delay(this.transitionDuration)
                .attr('class', 'bottom-tick dot-line')
                .attr('display', (d: any) => {
                    let shouldDisplay = this.selectedNodeAncestors.indexOf(d) > -1
                    if (d == this.selectedNode && (d.children == null || d.children.length == 0)) {
                        shouldDisplay = false
                    }

                    return shouldDisplay ? null : 'none'
                })
                .attr('x1', (d: any, index: number) => this.rectDimensions.w / 2)
                .attr('x2', (d: any, index: number) => this.rectDimensions.w / 2)
                .attr('y1', (d: any, index: any) => this.rectDimensions.h)
                .attr('y2', (d: any, index: any) => this.rectDimensions.h + this.rectDimensions.m.b)
                .attr('transform', (d: any) => this.singleRectTranslation(d))
    }

    renderHorizontalBars() {
        let dataLines = this.rectsPerLevel
        dataLines.shift()
        if (this.selectedNode && this.selectedNode.depth > 0 && (this.selectedNode.children == null || this.selectedNode.children.length == 0)) {
            dataLines.pop()
        }

        this.domLines = this.domHierarchy.selectAll('.hbar')
            .data(dataLines)

        this.domLines.exit().remove()

        this.domLines
            .enter()
                .append('line')
            .merge(this.domLines)
                .transition()
                .delay(this.transitionDuration)
                .attr('class', 'hbar dot-line')
                .attr('x1', (d: any, index: number) => {
                    let xShift = 0
                    if (index+1 < this.indexParentPerLevel.length) {
                        xShift += this.xFactor * (this.indexParentPerLevel[index+1] - (d-1) / 2)
                    }
                    return -((d-1) * this.xFactor / 2 + xShift)
                })
                .attr('x2', (d: any, index: number) => {
                    let xShift = 0
                    if (index+1 < this.indexParentPerLevel.length) {
                        xShift += this.xFactor * (this.indexParentPerLevel[index+1] - (d-1) / 2)
                    }
                    return (d-1) * this.xFactor / 2 - xShift
                })
                .attr('y1', (d: any, index: any) => (index + 1) * this.yFactor - this.rectDimensions.m.t)
                .attr('y2', (d: any, index: any) => (index + 1) * this.yFactor - this.rectDimensions.m.t)
    }

    renderBreadcrumbs() {
        const selectedNodePath = this.selectedNode ? this.selectedNode.ancestors().reverse() : []

        let breads = this.domSvg.select('#breadcrumb-list')
            .selectAll('li')
                .data(selectedNodePath, (node: any) => node.data.id)

        breads.exit().remove()
        breads.enter()
            .append('li')
                .attr('class', 'pt-breadcrumb')
                .html((d: any) => d.data.name)
    }

    renderAll() {
        this.updateRenderingAttributes()
        this.restartDepthIncrement()
        this.renderRectangles()
        this.restartDepthIncrement()
        this.renderTopTicks()
        this.restartDepthIncrement()
        this.renderBottomTicks()
        this.restartDepthIncrement()
        this.renderHorizontalBars()
        this.renderBreadcrumbs()
    }

    renderD3DomElements() {
        this.renderAll()
    }

    // REACT LIFECYCLE

    constructor(props: Props) {
        super(props)
        this.state = {selected: null}
    }

    componentDidMount() {
        this.domSvg = d3.select(this.refs.containerHierarchy as any)
        this.domHierarchy = this.domSvg.select('#hierarchy')
        this.domRoots = this.domSvg.select('#roots')

        this.width = this.props.dimensions.width
        this.height = this.props.dimensions.height

        this.initAttributes()
        this.updateAttributes()
        this.renderD3DomElements()
    }

    componentDidUpdate() {
        this.updateAttributes()
        this.renderD3DomElements()
    }

    render() {
        let {width, height} = this.props.dimensions

        return (
            <svg
                id='conceptHierarchy'
                ref='containerHierarchy'
                width={(width - this.svgDimensions.m.r - this.svgDimensions.m.l) ? (width - this.svgDimensions.m.r - this.svgDimensions.m.l) : 0}
                height={height}
                style={{
                    marginTop: this.svgDimensions.m.t,
                    marginRight: this.svgDimensions.m.r,
                    marginBottom: this.svgDimensions.m.b,
                    marginLeft: this.svgDimensions.m.l,
                }}
            >
                <foreignObject id='breadcrumbs'>
                    <div className={'breadcrumbs'}>
                        <ul id='breadcrumb-list' className='pt-breadcrumbs'>
                        </ul>
                    </div>
                </foreignObject>
                <g id='roots'></g>
                <g id='hierarchy'></g>
                <g id='tooltip_container'>
                    <g id='tooltip'>
                        <rect id='tooltip_background'/>
                        <text id='tooltip_content'></text>
                        <polygon id='tooltip_pointer' points='0,0 12,0 6,10'/>
                    </g>
                </g>
            </svg>
        )
    }
}
