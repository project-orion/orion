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
        w: 45,
        h: 25,
        m: {
            t: 15,
            r: 5,
            b: 5,
            l: 5,
        }
    }

    interceptClickHandler: any
    rebind = interceptClick.rebind
    interceptClick = interceptClick.interceptClick

    domSvg: any
    domContainer: any
    domRects: any
    domLines: any

    hierarchy: any
    nodes: any
    graph: any
    fnodes: any

    selectedRoot: any
    selectedNode: any

    initAttributes() {
        this.interceptClickHandler = this.interceptClick()
    }

    updateAttributes() {
        let {width, height} = this.props.dimensions
        this.width = width
        this.height = height

        this.nodes = this.props.nodes
        this.graph = this.props.graph

        this.selectedRoot = null
        this.selectedNode = null
        this.fnodes = []

        if (this.graph.length > 0) {
            this.selectedRoot = this.graph[0]
            this.selectedNode = this.graph[0]
            this.selectedRoot.each((node: any) => {
                this.fnodes.push(node)
            })
        }

        this.domContainer
            .attr('transform', 'translate(' + this.width / 2 + ',' + this.height / 2 + ')')
    }

    selectNode(d: any) {

    }

    renderNodes() {
        this.domRects = this.domContainer.selectAll('rect')
            .data(this.fnodes)

        this.domRects.exit().remove()

        let rectsPerLevel = [1]
        let ancestors = this.selectedNode ? this.selectedNode.ancestors() : []
        let allowedNodes = _.reduce(_.map(ancestors.reverse(), (n: any) => n.children ? n.children : []),
            (acc: any, list: any) => {
                rectsPerLevel.push(list.length)
                return acc.concat(list)
            },
            [this.selectedRoot]
        )

        let depthIncrement: any = []
        for (let i = 0; i < rectsPerLevel.length; i++) {
            depthIncrement.push(0)
        }

        this.domRects
            .enter()
                .append('rect')
            .merge(this.domRects)
                .attr('transform', (d: any, index: number) => {
                    let xFactor = (this.rectDimensions.w + this.rectDimensions.m.r + this.rectDimensions.m.l)
                    let yFactor = (this.rectDimensions.h + this.rectDimensions.m.t + this.rectDimensions.m.b)
                    let xShift = 0
                    let yShift = yFactor * d.depth

                    if (d.depth < rectsPerLevel.length && allowedNodes.indexOf(d) > -1) {
                        xShift = xFactor * (depthIncrement[d.depth] - rectsPerLevel[d.depth] / 2)
                        depthIncrement[d.depth]++
                    }

                    return 'translate(' + xShift + ',' + yShift +')'
                })
                .attr('display', (d: any) => {
                    let shouldDisplay = allowedNodes.indexOf(d) > -1

                    return shouldDisplay ? null : 'none'
                })
                .attr('class', (node: any) => {
                    return 'hierarchy-rect' +
                        ((node.id == this.selectedNode.id) ? ' selected-rect' : '') +
                        ((ancestors.indexOf(node) > -1) ? ' ancestor-rect' : '')
                })
                .call(this.interceptClickHandler
                    .on('customClick', this.customClick.bind(this))
                    .on('customDoubleClick', this.customDoubleClick.bind(this))
                )
    }

    customClick(node: any) {
        this.selectedNode = node
        this.renderNodes()
    }

    customDoubleClick(d: any) {
        console.log('doubleclick')
    }

    // Unite all previous rendering functions in just one function.
    renderD3DomElements() {
        this.renderNodes()
    }

    // REACT LIFECYCLE

    constructor(props: Props) {
        super(props)
        this.state = {selected: null}

        // this.selectNode = this.selectNode.bind(this)
    }

    // This function is called right after the first render() of our component.
    // We'll define here our domContainer, the forces to use in our d3 simulation
    // as well as other attributes which will be useful to d3 and which come from
    // React props (remember we want to dissociate d3 calculations from React props).
    // After that, we call our sent of simulation and rendering functions.
    componentDidMount() {
        this.domSvg = d3.select(this.refs.container as any)
        this.domContainer = this.domSvg.select('#container')

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
                <g id='container'></g>
            </svg>
        )
    }
}
