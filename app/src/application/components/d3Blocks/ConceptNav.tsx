import * as _ from 'lodash'
import * as d3 from 'd3'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import './conceptNav.less'

import * as actions from '../../actions'

interface Props {
    dimensions: {
        width: number,
        height: number,
    }
    graph: any,
    nodes: any,
    links: any,
    selectedConceptNode: any,
    displayedNodes: any,
}

interface State {
    selectedGraph: any,
}

export function ConceptNavReducer(nodes: any, links: any, roots: any, childrenDict: any) {
    let graph: any = {}

    // Recursive function which nests children with their parent.
    let enrichNodeWithChildren = (slug: string): any => {
        return {
            ...nodes[slug],
            children: _.map(childrenDict[slug], enrichNodeWithChildren),
        }
    }

    // Index nodes by slug.
    nodes = _.mapKeys(nodes, (value: any, index: number) => value.slug)

    // Apply recursion to every connex component of the concept graph.
    _.each(roots, (root: any) => {
        graph[root.connexComponent] = enrichNodeWithChildren(root.slug)
    })

    return graph
}


export class ConceptNav extends React.Component<Props, State> {
    // D3
    refs: any
    domContainer: any
    domRoot: any
    transitionDuration: number

    graph: any
    nodes: any
    links: any
    hierarchy: any
    displayedNodes: number

    hierachicalToggle(node: any) {
        node.visible = true
        if (node.toggled && node.children) {
            node.children.forEach(this.hierachicalToggle.bind(this))
        }
    }

    toggle(d: any) {
        if (!d.toggled) {
            d.toggled = true
            d.visible = true
            d.children.forEach(this.hierachicalToggle.bind(this))
        } else {
            d.toggled = false
            d.each((node: any) => {
                node.visible = false
            })
            d.visible = true
        }
    }

    updateHierarchy() {
        if(this.props.selectedConceptNode && this.props.selectedConceptNode.connexComponent) {
            this.graph = this.props.graph
            this.hierarchy = d3.hierarchy(this.graph[this.props.selectedConceptNode.connexComponent])

            this.toggle(this.hierarchy)
        }
    }

    click(d: any) {
        if (d.children) {
            this.hierarchy.each((node: any) => {
                if (node.data.id == d.data.id) {
                    this.toggle(node)
                }
            })
            this.renderTree()
        }
    }

    renderTree() {
        let x = (node: any) => 40 + 20 * node.depth
        let y = (node: any) => 25 * (this.displayedNodes - node.index)

        if (this.hierarchy) {
            this.nodes = []

            this.hierarchy.eachAfter((node: any) => {
                this.nodes.push(node)
            })

            let filteredNodes = _.filter(this.nodes, (node: any) => node.visible && !node.closedAncestor)

            filteredNodes.forEach((node: any, index: number) => {
                node.index = index
            })

            this.displayedNodes = filteredNodes.length

            let node = this.domContainer.selectAll('g.conceptNode')
                .data(filteredNodes, (node: any) => node.data.id)

            let nodeEnter = node
                .enter()
                    .append('g')
                    .attr('class', (d: any) => 'conceptNode ' + (d.children ? 'toggle' : 'notoggle'))
                    .attr('transform', (d: any) => 'translate(' + x(d) + ',' + y(d) + ')')
                    .on('click', this.click.bind(this))

            nodeEnter.append('circle')
                    .attr('class', (d: any) => 'conceptCircle')
                    .attr('r', 10e-6)

            nodeEnter.append('text')
                    .attr('x', (d: any) => 15)
                    .attr('dy', '.35em')
                    .text((d: any) => d.data.name)
                    .style('fill-opacity', 0)

            let nodeUpdate = nodeEnter.merge(node).transition()
                .duration(this.transitionDuration)
                .attr('transform', (d: any) => 'translate(' + x(d) + ',' + y(d) + ')')

            nodeUpdate.select('circle')
                .attr('r', 8)

            nodeUpdate.select('text')
                .style('fill-opacity', 1)

            // Transition exiting nodes to the parent's new position.
            var nodeExit = node.exit().transition()
                .duration(this.transitionDuration)
                // .attr('transform', (d: any) => 'translate(' + x(d) + ',' + y(d) + ')')
                .style('fill-opacity', 0)
                .remove()
        }
    }

    // REACT LIFECYCLE
    selectGraph(props: Props) {
        let selectedGraph: any

        if (props.selectedConceptNode && props.selectedConceptNode.id) {
            let selectedGraphInit = props.graph[props.selectedConceptNode.connexComponent]

            let nodeList = [selectedGraphInit]
            while (true) {
                let currentNode = nodeList.pop()
                if (currentNode.id == props.selectedConceptNode.id) {
                    selectedGraph = currentNode
                    break
                } else {
                    _.each(currentNode.children, (node: any) => {nodeList.push(node)})
                }
            }
        }

        return selectedGraph
    }

    constructor(props: Props) {
        super(props)
        this.state = {
            selectedGraph: this.selectGraph(props),
        }
    }

    componentDidMount() {
        this.domContainer = d3.select(this.refs.conceptNavContainer)
        this.transitionDuration = 250

        this.nodes = this.props.nodes
        this.links = this.props.links

        this.updateHierarchy()
        this.renderTree()
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        this.setState({
            ...this.state,
            selectedGraph: this.selectGraph(nextProps),
        })

        return true
    }

    componentDidUpdate() {
        this.nodes = this.props.nodes
        this.links = this.props.links

        this.updateHierarchy()
        this.renderTree()
    }

    render() {
        const {height, width} = this.props.dimensions
        const {selectedGraph} = this.state

        return (
            <div>
                <svg
                    ref='conceptNavContainer'
                    width={width}
                    height={height}
                ></svg>
            </div>
        )
    }
}
