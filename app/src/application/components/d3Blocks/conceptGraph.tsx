import * as _ from 'lodash'
import * as d3 from 'd3'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import './componentStyle.less'

interface Props {
    version: any,
    nodes: any,
    links: any,
    labels: any,
    width: number,
    height: number,
    searchedConcept: string,
}

interface State {
    selected: boolean,
}

export function ConceptGraphReducer(action: any){
    // Parcours des composantes connexes du graphe.
    // On fait l'hypothèse qu'elle on au plus un node de type 'root'.
    let childrenDict: any = {}

    _.each(action.value.links, (link: any) => {
        if (childrenDict[link.slug_to]) {
            childrenDict[link.slug_to].push(link.slug_from)
        } else {
            childrenDict[link.slug_to] = [link.slug_from]
        }
    })

    let nodesDict: any = _.mapKeys(action.value.nodes, (value: any, key: any) => value.slug)
    nodesDict = _.mapValues(nodesDict, (node: any) => {
        return {
            ...node,
            distanceToRoot: null,
            connexComponent: null,
        }
    })

    let currentConnexComponent: number = 0
    let rootList: any = _.filter(action.value.nodes, (node: any) => node.rootConcept)
    while (rootList.length > 0) {
        let nodesList: any = [{
            slug: rootList.pop().slug,
            distance: 0,
        }]
        while (nodesList.length > 0) {
            let currentNode: any = nodesList.pop()
            nodesDict[currentNode.slug].connexComponent = currentConnexComponent
            nodesDict[currentNode.slug].distanceToRoot = currentNode.distance
            _.each(childrenDict[currentNode.slug], (slug: string) => {
                nodesList.push({
                    slug,
                    distance: currentNode.distance + 1,
                })
            })
        }
        currentConnexComponent++
    }

    nodesDict = _.mapValues(nodesDict, (node: any) => {
        if (node.distanceToRoot == null) {
            node.connexComponent = currentConnexComponent
            node.distanceToRoot = 0
            currentConnexComponent++
            return node
        } else {
            return node
        }
    })

    const links = action.value.links.map((link: any) => {
        return {
            connexComponent: nodesDict[link.slug_from].connexComponent,
            source: link.slug_from,
            target: link.slug_to,
            key: link.id,
            size: 2,
        }
    })

    const nodes = _.map(_.values(nodesDict), (node: any) => {
        return {
            ...node,
            key: node.slug,
        }
    })

    return {
        nodes : nodes,
        links : links,
    }
}



export class ConceptGraph extends React.Component<Props, State> {
    // D3

    // All these parameters are simple parameters; one doesn't use
    // React props only since they imply abiding by the React lifecycle
    // whereas we want to have our simulation ran by d3.
    width: number
    height: number
    simulation: any

    nodes: any
    links: any
    labels: any
    cc: any

    refs: any
    domContainer: any

    domNodes: any
    domLabels: any
    domLinks: any

    highlightedNodes: any
    highlightedLinks: any
    highlightedLabels: any

    // This function is called whenever new data comes in through the React props
    // (React will call this function through componentDidMount and componentDidUpdate).
    // It updates our local parameters and simulates the forces we defined previously.
    updateSimulation() {
        let {nodes, links, labels, width, height, searchedConcept} = this.props

        // Internalize parameters so that they gan be fed to a d3 simulation
        // (which will eventually alter these variables, which is the reason why
        // one wants to take them away from React).
        const filterNodes = searchedConcept ? _.filter(nodes, (n: any) => n.slug.startsWith(searchedConcept)) : nodes

        this.cc = (_.map(_.uniqBy(filterNodes, 'connexComponent'), (n: any) => n.connexComponent)).sort()

        if (this.cc.length > 0) {
            this.nodes = _.filter(this.props.nodes, (n: any) => this.cc.indexOf(n.connexComponent) != -1)
            this.links = _.filter(this.props.links, (l: any) => this.cc.indexOf(l.connexComponent) != -1)
            this.labels = _.filter(this.props.nodes, (n: any) => this.cc.indexOf(n.connexComponent) != -1)
        } else if (!searchedConcept) {
            this.nodes = nodes
            this.links = links
            this.labels = labels
        } else {
            this.nodes = []
            this.links = []
            this.labels = []
        }

        this.width = width
        this.height = height

        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id((d: any) => d.key).distance(60))
            .force('charge', d3.forceManyBody().strength(-200))
            .force('y2', d3.forceY().strength((d: any) => (5 - d.distanceToRoot) / 10).y(this.height / 3))
            .force('y3', d3.forceY().strength((d: any) => d.distanceToRoot / 10).y(2 * this.height / 3))

        this.simulation.nodes(this.nodes).on('tick', ticked.bind(this))
        this.simulation.force('link').links(this.links)

        function ticked() {
            this.domLinks
                .attr('x1', (d: any) => d.source.x)
                .attr('y1', (d: any) => d.source.y)
                .attr('x2', (d: any) => d.target.x)
                .attr('y2', (d: any) => d.target.y)

            this.domNodes
                .attr('cx', (d: any) => Math.max(30 / (d.distanceToRoot + 1), Math.min(this.width - 30 / (d.distanceToRoot + 1), d.x)))
                .attr('cy', (d: any) => Math.max(30 / (d.distanceToRoot + 1), Math.min(this.width - 30 / (d.distanceToRoot + 1), d.y)))

            this.domLabels
                .attr('x', (d: any) => d.x)
                .attr('y', (d: any) => d.y)
         }
    }

    // This function draws elements (in this specific case, circles) in the
    // container. The container itself is defined at the very end of the first
    // lifecycle of our React component (and called domContainer here).
    // Before drawing new elements, it will make sure to remove from the DOM
    //  elements which may have been created previously.
    renderNodes() {
        // Create circles in the DOM with our data.
        this.domNodes = this.domContainer
            .selectAll('circle')
            .data(this.nodes, (d: any) => d.key)

        // Remove former circles of the DOM if they exist.
        this.domNodes.exit().remove()

        // Change DOM nodes' attributes and events handling.
        this.domNodes = this.domNodes
            .enter()
                .append('circle')
                .classed('node', true)
                .merge(this.domNodes)
                .attr('cx', (d: any) => d.x)
                .attr('cy', (d: any) => d.y)
                .attr('r', (d: any) => 30 / (d.distanceToRoot + 1))
                .attr('opacity',
                    (d: any) => !this.state.selected || this.highlightedNodes[d.key] ? 1 : 0.3)
                .on('click', this.selectNode)
                .call(d3.drag()
                    .on('start', dragstarted.bind(this))
                    .on('drag', dragged.bind(this))
                    .on('end', dragended.bind(this)))

        function dragstarted(d: any) {
            if (!d3.event.active) this.simulation.alphaTarget(0.2).restart()
            d.fx = d.x
            d.fy = d.y
        }

        function dragged(d: any) {
            d.fx = d3.event.x
            d.fy = d3.event.y
        }

        function dragended(d: any) {
            if (!d3.event.active) this.simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
        }
    }

    // Same use as renderNodes, this time for labels...
    renderLabels() {
        this.domLabels = this.domContainer
            .selectAll('text')
            .data(this.labels, (d: any) => d.name)

        this.domLabels.exit().remove()

        this.domLabels = this.domLabels
            .enter()
                .append('text')
                .classed('label', true)
                .merge(this.domLabels)
                .attr('x', (d: any) => d.x)
                .attr('y', (d: any) => d.y)
                .text((d: any) => { return d.name })
    }

    // ... and this time for links.
    renderLinks() {
        this.domLinks = this.domContainer
            .selectAll('line')
            .data(this.links, (d: any) => d.key)

        this.domLinks.exit().remove()

        this.domLinks = this.domLinks
            .enter()
                .insert('line', 'circle')
                .classed('link', true)
                .merge(this.domLinks)
                .attr('stroke-width', (d: any) => d.size)
                .attr('x1', (d: any) => d.source.x)
                .attr('x2', (d: any) => d.target.x)
                .attr('y1', (d: any) => d.source.y)
                .attr('y2', (d: any) => d.target.y)
                .attr('opacity',
                    (d: any) => !this.state.selected || this.highlightedLinks[d.key] ? 0.5 : 0.2)
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
    calculateHighlights(selected: any) {
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
            });
        }
    }

    selectNode(node: any) {
        if (node.key === this.state.selected) {
            this.setState({selected: null});
        } else {
            this.setState({selected: node.key});
        }
    }

    // REACT LIFECYCLE

    constructor(props: Props) {
        super(props);
        this.state = {selected: null}

        this.selectNode = this.selectNode.bind(this);
    }

    // This function is called right after the first render() of our component.
    // We'll define here our domContainer, the forces to use in our d3 simulation
    // as well as other attributes which will be useful to d3 and which come from
    // React props (remember we want to dissociate d3 calculations from React props).
    // After that, we call our sent of simulation and rendering functions.
    componentDidMount() {
        this.domContainer = d3.select(this.refs.container)

        this.width = this.props.width
        this.height = this.props.height

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
                (d: any) => !nextState.selected || this.highlightedNodes[d.key] ? 1 : 0.2)
            this.domLinks.attr('opacity',
                (d: any) => !nextState.selected || this.highlightedLinks[d.key] ? 0.5 : 0.1)
            this.domLabels.attr('opacity',
                (d: any) => !nextState.selected || this.highlightedLabels[d.key] ? 1 : 0.1)

            return false
        }
        return true
    }

    // This function is called right after the component actually rendered again. Therefore,
    // at this stage, only the container is created. One thus updates the simulation
    // and re-renders all possible DOM components which will populate the container.
    componentDidUpdate() {
        this.updateSimulation()
        this.calculateHighlights(this.state.selected)
        this.renderD3DomElements()

        // In particular, this part of the code is used to define forces which will
        // separate (untanggle) our graphs on the page.
        let totalConnexComponents: number = this.cc.length

        if (this.width > 0) {
            _.each(this.cc, (c: number, i: number) => {
                this.simulation
                    .force('x' + i, this.isolate(d3.forceX(), (d: any) => (d.connexComponent == c), i, totalConnexComponents))
            })

            this.simulation.alphaTarget(0).restart()
        }
    }

    render() {
        let {width, height} = this.props

        return (
            <svg
                ref='container'
                width={width}
                height={height}
            ></svg>
        )
    }
}
