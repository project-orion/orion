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

    return {
        nodes,
        graph,
    }
}

export class ConceptHierarchy extends React.Component<Props, State> {
    // D3

    // All these parameters are simple parameters; one doesn't use
    // React props only since they imply abiding by the React lifecycle
    // whereas we want to have our simulation ran by d3.
    width: number
    height: number
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

        if (this.graph.length > 0) {
            this.selectedRoot = this.graph[0]
            this.selectedNode = this.graph[0]
        }

        this.updateHierarchyNodes()

        this.domHierarchy
            .attr('transform', 'translate(' + this.width / 2 + ',' + this.height / 2 + ')')

        this.domRoots
            .attr('transform', 'translate(' + this.width / 2 + ', 50)')

        this.domSvg.select('#tooltip_container')
            .attr('transform', 'translate(' + this.width / 2 + ',' + this.height / 2 + ')')
            .style('visibility', 'hidden')
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

    handleMouseOver(that: any, d: any) {
        // Place the tooltip in the correct container
        let domParentId = d3.select(this as any).node().parentNode.id

        if (domParentId == 'hierarchy') {
            that.domSvg.select('#tooltip_container')
                .attr('transform', 'translate(' + that.width / 2 + ',' + that.height / 2 + ')')
                .style('visibility', 'hidden')
        } else if (domParentId == 'roots') {
            that.domSvg.select('#tooltip_container')
                .attr('transform', 'translate(' + that.width / 2 + ', 50)')
                .style('visibility', 'hidden')
        }

        let tag = this as any
        let attribute = tag.transform.baseVal[0].matrix

        that.domSvg.select('#tooltip_container')
            .style('visibility', '')

        that.domSvg.select('#tooltip_content')
            .text(d.data.name)
            .call(_.partial(wrap.wrap, 120))

        that.domSvg.select('#tooltip')
            .attr('transform', () => {
                let xShift = attribute.e + that.rectDimensions.w / 2
                let yShift = attribute.f - d3.selectAll('#tooltip_content tspan').size() * that.tooltipDimensions.h - that.tooltipDimensions.p.b - that.tooltipDimensions.t.h - 4
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
            .style('visibility', 'hidden')
    }

    customClick(newRootNode: any, node: any, a: any) {
        if (newRootNode) {
            this.selectedRoot = node
            this.updateHierarchyNodes()
        }

        this.domSvg.select('#tooltip_container')
            .style('visibility', 'hidden')

        this.selectedNode = node
        this.renderAll()
    }

    customDoubleClick(d: any) {
        console.log('doubleclick')
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
            .merge(this.domRootRects)
                .call(this.interceptClickHandlerRoot
                    .on('customClick', this.customClick.bind(this, true))
                    .on('customDoubleClick', this.customDoubleClick.bind(this))
                )
                .on('mouseover', _.partial(this.handleMouseOver, this))
                .on('mouseout', _.partial(this.handleMouseOut, this))
                .transition()
                .delay(this.transitionDuration)
                .attr('transform', (d: any, index: number) => 'translate(' + this.xFactorRoot * (index - (availableRoots.length) / 2) + ',' + this.yFactorRoot + ')')
                .attr('class', (node: any) => {
                    return 'hierarchy-rect' +
                        ((node.id == this.selectedNode.id) ? ' selected-rect' : '') +
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
                        ((node.id == this.selectedNode.id) ? ' selected-rect' : '') +
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
    }

    // Unite all previous rendering functions in just one function.
    renderD3DomElements() {
        this.renderAll()
    }

    // REACT LIFECYCLE

    constructor(props: Props) {
        super(props)
        this.state = {selected: null}

        // this.selectNode = this.selectNode.bind(this)
    }

    // This function is called right after the first render() of our component.
    // We'll define here our domHierarchy, the forces to use in our d3 simulation
    // as well as other attributes which will be useful to d3 and which come from
    // React props (remember we want to dissociate d3 calculations from React props).
    // After that, we call our sent of simulation and rendering functions.
    componentDidMount() {
        this.domSvg = d3.select(this.refs.container as any)
        this.domHierarchy = this.domSvg.select('#hierarchy')
        this.domRoots = this.domSvg.select('#roots')

        this.width = this.props.dimensions.width
        this.height = this.props.dimensions.height

        this.initAttributes()
        this.updateAttributes()
        this.renderD3DomElements()
    }

    // This function is called by React every time the React state or props
    // of this component change. In general, we don't want our component to rerender:
    // indeed, all DOM elements already exist and their interactions with the DOM are
    // handled by d3.
    // The only case in which one should indeed rerender this component is when
    // new data comes in. This we check keeping track of the version of our data
    // (the version comes as a prop, given by the parent component).
    shouldComponentUpdate(nextProps: Props, nextState: State) {
        if (nextProps.version === this.props.version) {
            return false
        }

        return true
    }

    // This function is called right after the component actually rendered again. Therefore,
    // at this stage, only the container is created. One thus updates the simulation
    // and re-renders all possible DOM components which will populate the container.
    componentDidUpdate() {
        this.updateAttributes()
        this.renderD3DomElements()
    }

    render() {
        let {width, height} = this.props.dimensions

        return (
            <svg
                ref='container'
                width={width}
                height={height}
            >
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
