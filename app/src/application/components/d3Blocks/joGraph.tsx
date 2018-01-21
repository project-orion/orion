import * as d3 from 'd3'
import * as _ from 'lodash'
import * as React from 'react'
import Measure from 'react-measure'

import './joGraph.less'

import * as actions from './../../actions'
import * as interceptClick from './utils/interceptClick'
import {
    action,
    conceptLinksAttribute,
    extendedConceptNodeAttribute,
    module,
} from './../../types'

interface Props {
    options?: any,
    sources?: any,
    data?: any,
    version: number,
    dimensions: {
        width: number,
        height: number,
    }
    dispatch: any,
    tfidf: boolean,
    cid: string,
}

interface State {
    selected: string,
}

const colorScheme = ['#2965CC', '#29A634', '#D99E0B', '#D13913', '#8F398F', '#00B3A4', '#DB2C6F', '#9BBF30', '#96622D', '#7157D9']

export class JOGraph extends React.Component<Props, State> {
    // D3

    // All these parameters are simple parameters; one doesn't use
    // React props only since they imply abiding by the React lifecycle
    // whereas we want to have our simulation ran by d3.
    charge = this.props.tfidf ? -10 : -2
    linkDistance = this.props.tfidf ? 50 : 15

    width: number
    height: number
    simulation: any
    nbReceivedNodes = 0

    interceptClickHandler: any

    nodes: any
    links: any
    labels: any

    refs: any
    domContainer: any

    domNodes: d3.Selection<any, any, any, any>
    domLabels: d3.Selection<any, any, any, any>
    domLinks: d3.Selection<any, any, any, any>
    domLabelsTSpan: any

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

        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id((d: any) => d.cid).distance(this.linkDistance))
            .force('charge', d3.forceManyBody().strength(this.charge))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))

        this.interceptClickHandler = this.interceptClick()
    }

    ticked() {
        if (this.domLinks && this.domNodes) {
            this.domLinks
                .attr('x1', (d: any) => d.source.x)
                .attr('y1', (d: any) => d.source.y)
                .attr('x2', (d: any) => d.target.x)
                .attr('y2', (d: any) => d.target.y)

            this.domNodes
                .attr('cx', (d: any) => Math.min(this.width, d.x))
                .attr('cy', (d: any) => Math.min(this.width, d.y))
        }
    }

    // This function is called whenever new data comes in through the React props
    // (React will call this function through componentDidMount and componentDidUpdate).
    // It updates our local parameters and simulates the forces we defined previously.
    updateSimulation() {
        let {width, height} = this.props.dimensions
        let {data} = this.props

        let articles = data ? (data.articles ? data.articles.hits.hits : []) : []
        let article = data ? (data.article ? data.article.hits.hits[0]._source : null) : null

        this.nodes = []
        this.links = []

        if (this.props.tfidf && article) {
            let nodes = articles ? _.map(articles, (n: any) => n._source) : []

            let rootCids = article.links.map((l: any) => l.cid)
            rootCids.push(article.cid)
            console.log(rootCids)

            let rootNodes: any = []
            let selectedCids: any = []
            rootCids.forEach((cid: any) => {
                selectedCids.push(cid)

                nodes.forEach((n: any) => {
                    if (n.cid == cid) {
                        rootNodes.push(n)
                        selectedCids.push(_.map(n.neighbors, (l: any) => l.cid))
                        selectedCids.push(_.map(n.links, (l: any) => l.cid))
                    }
                })
            })
            selectedCids = _.flattenDepth(selectedCids, 2)
            console.log(selectedCids)
            console.log(rootNodes)

            this.nodes = _.filter(nodes, (n: any) => {
                return selectedCids.indexOf(n.cid) != -1
            })
            console.log(this.nodes)

            this.links = _.flattenDepth(_.map(rootNodes, (n: any) => {
                return _.map(n.neighbors, (l: any) => {
                    return {
                        'source': n.cid,
                        'target': l.cid,
                    }
                })
            }), 2)

            // this.links = _.flattenDepth(_.map(rootNodes, (n: any) => {
            //     return _.concat(
            //         _.map(n.links, (l: any) => {
            //             return {
            //                 'source': n.cid,
            //                 'target': l.cid,
            //             }
            //         }),
            //         _.map(n.neighbors, (nn: any) => {
            //             return {
            //                 'source': n.cid,
            //                 'target': nn.cid,
            //             }
            //         })
            //     )
            // }), 2)
            // console.log(this.links)
        } else {
            this.nodes = articles ? _.map(articles, (n: any) => n._source) : []
            this.links = _.flattenDepth(_.map(this.nodes, (n: any) => {
                return _.map(n.links, (l: any) => {
                    return {
                        'source': n.cid,
                        'target': l.cid,
                    }
                })
            }), 2)
        }
        this.labels = this.nodes

        this.simulation.nodes(this.nodes).on('tick', this.ticked.bind(this))
        this.simulation.force('link')
            .links(this.links)
            .distance(this.linkDistance)
        this.simulation.force('charge')
            .strength(this.charge)

        d3.dragDisable(window)
    }

    customClick(d: any) {
        this.selectNode(d)
    }

    customDoubleClick(d: any) {

    }

    // This function draws elements (in this specific case, circles) in the
    // container. The container itself is defined at the very end of the first
    // lifecycle of our React component (and called domContainer here).
    // Before drawing new elements, it will make sure to remove from the DOM
    //  elements which may have been created previously.
    renderNodes() {
        console.log('rendernodes')
        // Create or update circles in the DOM with our data.
        this.domNodes = this.domContainer
            .selectAll('circle')
            .data(this.nodes, (d: any) => d.cid)

        // Remove circles that are no longer needed from the DOM.
        this.domNodes.exit().remove()

        // Change DOM nodes' attributes and events handling.
        this.domNodes = this.domNodes
            .enter()
                .append('circle')
            .merge(this.domNodes)
                .attr('cx', (d: any) => d.x)
                .attr('cy', (d: any) => d.y)
                .attr('r', (d: any) => 5)
                .attr('opacity',
                    (d: any) => !this.state.selected || this.highlightedNodes[d.key] ? 1 : 0.3
                )
                .attr('class', 'node')
                .call(this.interceptClickHandler
                    .on('customClick', this.customClick.bind(this))
                    .on('customDoubleClick', this.customDoubleClick.bind(this))
                )
    }

    wrap(texts: any) {
        let width = 100

        // TODO: investigate why function() {} and () => {}
        // don't yield the same value for `this`...
        texts.each(function() {
            let text = d3.select(this as any),
                words = text.text().split(/\s+/).reverse(),
                word,
                line: any= [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = text.attr('y'),
                x = text.attr('x'),
                dy = isNaN(parseFloat(text.attr('dy'))) ? 0.2 : parseFloat(text.attr('dy')),
                tspan = text
                    .text(null)
                        .append('tspan')
                            .attr('x', x)
                            .attr('y', y)
                            .attr('dy', dy + 'em')

            while (word = words.pop()) {
                line.push(word)
                tspan.text(line.join(' '))
                var node: any = tspan.node()
                var hasGreaterWidth = node.getComputedTextLength() > width
                if (hasGreaterWidth) {
                    line.pop()
                    tspan.text(line.join(' '))
                    line = [word]
                    tspan = text
                        .append('tspan')
                        .attr('x', x)
                        .attr('y', y)
                        .attr('dy', ++lineNumber * lineHeight + dy + 'em')
                        .text(word)
                }
            }
        })
    }

    // Same use as renderNodes, this time for labels...
    renderLabels() {
        this.domLabels = this.domContainer
            .selectAll('text')
            .data(this.labels, (d: any) => d.cid)

        this.domLabels.exit().remove()

        this.domLabels = this.domLabels
            .enter()
                .append('text')
                .classed('label', true)
            .merge(this.domLabels)
                .attr('x', (d: any) => d.x)
                .attr('y', (d: any) => d.y)
                .text((d: any) => d.cid)
                .call(this.wrap)

        this.domLabelsTSpan = this.domContainer
            .selectAll('tspan')
    }

    // ... and this time for links.
    renderLinks() {
        this.domLinks = this.domContainer
            .selectAll('line')
            .data(this.links, (d: any) => d)

        this.domLinks.exit().remove()

        this.domLinks = this.domLinks
            .enter()
                .insert('line', 'circle')
                .classed('link', true)
            .merge(this.domLinks)
                .attr('stroke-width', (d: any) => 1)
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
        // this.renderLabels()
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

    selectNode(node: any) {
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
        // if (nextProps.version === this.props.version) {
        //     this.calculateHighlights(nextState.selected)
        //
        //     this.domNodes.attr('opacity',
        //         (d: any) => !nextState.selected || this.highlightedNodes[d.key] ? 1 : 0.2)
        //     this.domLinks.attr('opacity',
        //         (d: any) => !nextState.selected || this.highlightedLinks[d.key] ? 0.5 : 0.1)
        //     this.domLabels.attr('opacity',
        //         (d: any) => !nextState.selected || this.highlightedLabels[d.key] ? 1 : 0.1)
        //
        //     return false
        // }

        return true
    }

    // This function is called right after the component actually rendered again. Therefore,
    // at this stage, only the container is created. One thus updates the simulation
    // and re-renders all possible DOM components which will populate the container.
    componentDidUpdate() {
        this.updateSimulation()
        // this.calculateHighlights(this.state.selected)
        this.renderD3DomElements()

        if (this.width > 0) {
            this.simulation.alphaTarget(0.01).restart()
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
