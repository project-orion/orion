import * as _ from 'lodash'
import * as d3 from 'd3'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import './conceptGraph.less'

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
    links: conceptLinksAttribute[],
    labels: extendedConceptNodeAttribute[],
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

export class ConceptGraph extends React.Component<Props, State> {
    // D3

    // All these parameters are simple parameters; one doesn't use
    // React props only since they imply abiding by the React lifecycle
    // whereas we want to have our simulation ran by d3.
    width: number
    height: number
    simulation: any
    nbReceivedNodes = 0

    interceptClickHandler: any

    data: {
        nodes: d3GraphNode[],
        links: d3GraphLink[],
        labels: d3GraphNode[],
    }
    nodes: d3GraphNode[]
    links: d3GraphLink[]
    labels: d3GraphNode[]
    cc: number[]

    refs: any
    domContainer: any

    domNodes: d3.Selection<any, d3GraphNode, any, any>
    domLabels: d3.Selection<any, d3GraphNode, any, any>
    domLinks: d3.Selection<any, d3GraphLink, any, any>

    highlightedNodes: {
        [key: string]: number
    }
    highlightedLinks: {
        [key: number]: number
    }
    highlightedLabels: {
        [key: string]: number
    }

    // Generic function for binding methods to already existing functions.
    // For instance, it can be used to bind the 'on' of a dispatcher
    // to an already existing event listener (see in interceptClick).
    rebind = interceptClick.rebind
    interceptClick = interceptClick.interceptClick

    initSimulation() {
        let {width, height} = this.props.dimensions

        this.width = width
        this.height = height

        this.data = {
            nodes: [],
            links: [],
            labels: [],
        }

        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id((d: d3GraphNode) => d.key).distance(70))
            .force('charge', d3.forceManyBody().strength(-200))
            .force('y2', d3.forceY().strength((d: d3GraphNode) => (5 - d.depth) / 10).y(this.height / 3))
            .force('y3', d3.forceY().strength((d: d3GraphNode) => d.depth / 10).y(this.height))

        this.interceptClickHandler = this.interceptClick()
    }

    ticked() {
        if (this.domLinks && this.domNodes && this.domLabels) {
            this.domLinks
                .attr('x1', (d: d3GraphLink) => d.source.x)
                .attr('y1', (d: d3GraphLink) => d.source.y)
                .attr('x2', (d: d3GraphLink) => d.target.x)
                .attr('y2', (d: d3GraphLink) => d.target.y)

            this.domNodes
                .attr('cx', (d: d3GraphNode) => Math.max(30 / (d.depth + 1), Math.min(this.width - 30 / (d.depth + 1), d.x)))
                .attr('cy', (d: d3GraphNode) => Math.max(30 / (d.depth + 1), Math.min(this.width - 30 / (d.depth + 1), d.y)))

            this.domLabels
                .attr('x', (d: d3GraphNode) => d.x)
                .attr('y', (d: d3GraphNode) => d.y)
        }
    }

    // This function is called whenever new data comes in through the React props
    // (React will call this function through componentDidMount and componentDidUpdate).
    // It updates our local parameters and simulates the forces we defined previously.
    updateSimulation() {
        let {width, height} = this.props.dimensions
        let {nodes, links, labels, searchedConcept} = this.props

        this.width = width
        this.height = height

        if (!this.nodes || this.nbReceivedNodes != nodes.length) {
            // Here, one deduces there is a change in the data when the length actually changes.
            // This can be problematic in the future.
            this.nbReceivedNodes = nodes.length

            this.data.nodes = nodes
            this.data.links = links
            this.data.labels = labels
        } else {
            // Update simulation data in order to keep track of the coordinates of our objects.
            let nodeMap = _.mapKeys(this.nodes, (value: d3GraphNode) => value.slug)
            let linkMap = _.mapKeys(this.links, (value: d3GraphLink) => value.key)
            let labelMap = _.mapKeys(this.labels, (value: d3GraphNode) => value.key)

            this.data.nodes = _.map(this.data.nodes, (n: d3GraphNode) => nodeMap[n.slug] ? nodeMap[n.slug] : n)
            this.data.links = _.map(this.data.links, (l: d3GraphLink) => linkMap[l.key] ? linkMap[l.key] : l)
            this.data.labels = _.map(this.data.labels, (l: d3GraphNode) => labelMap[l.key] ? labelMap[l.key] : l)
        }

        // Internalize parameters so that they gan be fed to a d3 simulation
        // (which will eventually alter these variables, which is the reason why
        // one wants to take them away from React).
        const filterNodes = searchedConcept ? _.filter(this.data.nodes, (n: d3GraphNode) => n.slug.startsWith(searchedConcept)) : this.data.nodes

        this.cc = (_.map(_.uniqBy(filterNodes, 'connexComponent'), (n: d3GraphNode) => n.connexComponent)).sort()

        this.nodes = _.filter(this.data.nodes, (n: d3GraphNode) => this.cc.indexOf(n.connexComponent) != -1)
        this.links = _.filter(this.data.links, (l: d3GraphLink) => this.cc.indexOf(l.connexComponent) != -1)
        this.labels = _.filter(this.data.nodes, (n: d3GraphNode) => this.cc.indexOf(n.connexComponent) != -1)

        this.simulation.nodes(this.nodes).on('tick', this.ticked.bind(this))
        this.simulation.force('link')
            .links(this.links)
            .distance(60 + (this.cc.length > 0 ? (50 / this.cc.length ) : 0))
        this.simulation.force('charge')
            .strength(-200 - (this.cc.length > 0 ? (100 / this.cc.length ) : 0))

        d3.dragDisable(window)
    }

    customClick(d: d3GraphNode) {
        this.selectNode(d)
    }

    customDoubleClick(d: d3GraphNode) {
        // It is important that this action is dispatched first as it erases
        // the list of displayed slugs from the Redux state.
        this.props.dispatch(actions.changeDisplayedConceptNav(d))
        // TODO: associate correct container instead of default cp1
        this.props.dispatch(actions.fetchConcept('concepts/' + d.slug, 'cp1'))
        this.props.dispatch(actions.toggleNavPanel())
    }

    // This function draws elements (in this specific case, circles) in the
    // container. The container itself is defined at the very end of the first
    // lifecycle of our React component (and called domContainer here).
    // Before drawing new elements, it will make sure to remove from the DOM
    //  elements which may have been created previously.
    renderNodes() {
        // Create or update circles in the DOM with our data.
        this.domNodes = this.domContainer
            .selectAll('circle')
            .data(this.nodes, (d: d3GraphNode) => d.id)

        // Remove circles that are no longer needed from the DOM.
        this.domNodes.exit().remove()

        // Change DOM nodes' attributes and events handling.
        this.domNodes = this.domNodes
            .enter()
                .append('circle')
            .merge(this.domNodes)
                .attr('cx', (d: d3GraphNode) => d.x)
                .attr('cy', (d: d3GraphNode) => d.y)
                .attr('r', (d: d3GraphNode) => 30 / (d.depth + 1))
                .attr('opacity',
                    (d: d3GraphNode) => !this.state.selected || this.highlightedNodes[d.key] ? 1 : 0.3
                )
                .attr('class', (d: d3GraphNode) =>
                    'node ' +
                    ((this.props.searchedConcept && d.slug.startsWith(this.props.searchedConcept)) ? 'searchedNode' : '')
                )
                .call(this.interceptClickHandler
                    .on('customClick', this.customClick.bind(this))
                    .on('customDoubleClick', this.customDoubleClick.bind(this))
                )
    }

    // Same use as renderNodes, this time for labels...
    renderLabels() {
        this.domLabels = this.domContainer
            .selectAll('text')
            .data(this.labels, (d: d3GraphNode) => d.id)

        this.domLabels.exit().remove()

        this.domLabels = this.domLabels
            .enter()
                .append('text')
                .classed('label', true)
            .merge(this.domLabels)
                .attr('x', (d: d3GraphNode) => d.x)
                .attr('y', (d: d3GraphNode) => d.y)
                .text((d: d3GraphNode) => d.name)
    }

    // ... and this time for links.
    renderLinks() {
        this.domLinks = this.domContainer
            .selectAll('line')
            .data(this.links, (d: d3GraphLink) => d.key)

        this.domLinks.exit().remove()

        this.domLinks = this.domLinks
            .enter()
                .insert('line', 'circle')
                .classed('link', true)
            .merge(this.domLinks)
                .attr('stroke-width', (d: d3GraphLink) => 2)
                .attr('x1', (d: d3GraphLink) => d.source.x)
                .attr('x2', (d: d3GraphLink) => d.target.x)
                .attr('y1', (d: d3GraphLink) => d.source.y)
                .attr('y2', (d: d3GraphLink) => d.target.y)
                .attr('opacity',
                    (d: d3GraphLink) => !this.state.selected || this.highlightedLinks[d.key] ? 0.5 : 0.2)
    }

    // Unite all previous rendering functions in just one function.
    renderD3DomElements() {
        this.renderLinks()
        this.renderNodes()
        this.renderLabels()
    }

    // This function is used as a util function so as to unitialize x-forces
    // which will help untanggle the different connex components of our graph.
    isolate(force: any, filter: any, step: number, totalSteps: number) {
        var initialize = force.initialize
        force.initialize = () => { initialize.call(force, this.nodes.filter(filter)) }
        force.x(this.width * (step + 1) / (totalSteps + 1)).strength(.15)
        return force
    }

    // This function is used to update three dictionaries which
    // describe which objects should be 'highlighted' in the DOM.
    calculateHighlights(selected: string) {
        this.highlightedNodes = {}
        this.highlightedLinks = {}
        this.highlightedLabels = {}

        if (selected) {
            this.highlightedNodes[selected] = 1
            this.highlightedLabels[selected] = 1

            _.each(this.links, link => {
                if (link.source.key === selected) {
                    this.highlightedNodes[link.target.key] = 1
                    this.highlightedLinks[link.key] = 1
                    this.highlightedLabels[link.target.key] = 1
                }

                if (link.target.key === selected) {
                    this.highlightedNodes[link.source.key] = 1
                    this.highlightedLinks[link.key] = 1
                    this.highlightedLabels[link.source.key] = 1
                }
            })
        }
    }

    selectNode(node: d3GraphNode) {
        if (node.key === this.state.selected) {
            this.setState({selected: null})
        } else {
            this.setState({selected: node.key})
        }
    }

    // REACT LIFECYCLE

    constructor(props: Props) {
        super(props)
        this.state = {selected: null}

        this.selectNode = this.selectNode.bind(this)
    }

    // This function is called right after the first render() of our component.
    // We'll define here our domContainer, the forces to use in our d3 simulation
    // as well as other attributes which will be useful to d3 and which come from
    // React props (remember we want to dissociate d3 calculations from React props).
    // After that, we call our sent of simulation and rendering functions.
    componentDidMount() {
        this.domContainer = d3.select(this.refs.container)

        this.width = this.props.dimensions.width
        this.height = this.props.dimensions.height

        this.initSimulation()
        this.updateSimulation()
        this.calculateHighlights(this.state.selected)
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
            this.calculateHighlights(nextState.selected)

            this.domNodes.attr('opacity',
                (d: d3GraphNode) => !nextState.selected || this.highlightedNodes[d.key] ? 1 : 0.2)
            this.domLinks.attr('opacity',
                (d: d3GraphLink) => !nextState.selected || this.highlightedLinks[d.key] ? 0.5 : 0.1)
            this.domLabels.attr('opacity',
                (d: d3GraphNode) => !nextState.selected || this.highlightedLabels[d.key] ? 1 : 0.1)

            return false
        }

        return true
    }

    // This function is called right after the component actually rendered again. Therefore,
    // at this stage, only the container is created. One thus updates the simulation
    // and re-renders all possible DOM components which will populate the container.
    componentDidUpdate() {
        const previousCC = this.cc

        this.updateSimulation()
        // this.calculateHighlights(this.state.selected)
        this.renderD3DomElements()

        // In particular, this part of the code is used to define forces which will
        // separate (untanggle) our graphs on the page.
        const totalConnexComponents: number = this.cc.length

        if (this.width > 0) {
            _.each(previousCC, (c: number, i: number) => {
                this.simulation.force('x' + i, null)
            })

            _.each(this.cc, (c: number, i: number) => {
                this.simulation
                    .force('x' + i, this.isolate(d3.forceX(), (d: d3GraphNode) => (d.connexComponent == c), i, totalConnexComponents))
            })

            this.simulation.alphaTarget(0.2).restart()
        }
    }

    render() {
        let {width, height} = this.props.dimensions

        return (
            <svg
                ref='container'
                width={width}
                height={height}
            ></svg>
        )
    }
}
