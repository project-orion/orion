import * as _ from 'lodash'
import * as d3 from 'd3'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import './conceptNav.less'

import * as actions from '../../actions'
import * as interceptClick from './utils/interceptClick'

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
    displayedSlugs: string[],
    dispatch: any,
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
    selectedNodeId: number

    interceptClickHandler: any

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

            this.hierarchy.each((node: any) => {
                if (node.data.id == d.data.id) {
                    node.toggled = true
                }
            })
        } else {
            d.toggled = false
            d.each((node: any) => {
                node.visible = false
            })
            d.visible = true

            this.hierarchy.each((node: any) => {
                if (node.data.id == d.data.id) {
                    node.toggled = false
                }
            })
        }
    }

    updateHierarchy() {
        if(this.props.selectedConceptNode && this.props.selectedConceptNode.connexComponent) {
            this.graph = this.props.graph

            //TODO: kinda dirty node selection, can improve
            //The present if allows to not untoggle all nodes when changing the displayed nodes
            //(for instance when one double-clicks on a node to have it displayed).
            let selectedNode
            if (this.selectedNodeId != this.props.selectedConceptNode.id) {
                this.selectedNodeId = this.props.selectedConceptNode.id
                this.hierarchy = d3.hierarchy(this.graph[this.props.selectedConceptNode.connexComponent])
                this.hierarchy.each((node: any) => {
                    if (node.data.id == this.props.selectedConceptNode.id) {
                        selectedNode = node
                    }
                })

                this.hierarchy = selectedNode
                this.toggle(this.hierarchy)
            }

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

    rebind = interceptClick.rebind
    interceptClick = interceptClick.interceptClick

    customClick(d: any) {
        if (d.children) {
            this.hierarchy.each((node: any) => {
                if (node.data.id == d.data.id) {
                    this.toggle(node)
                }
            })
            this.renderTree()
        }
    }

    customDoubleClick(d: any) {
        let index = this.props.displayedSlugs.indexOf(d.data.slug)

        if (index != -1) {
            // Meaning one wants to get rid of this slug on the right panel...
            this.props.dispatch(actions.removeConcept('cp1', index))
        } else {
            // Meaning that one wants to insert the concept in the right panel...
            let displayedSlugsPlusSelected: any = []

            this.hierarchy.eachBefore((node: any) => {
                if (this.props.displayedSlugs.indexOf(node.data.slug) != -1 || node.data.id == d.data.id) {
                    displayedSlugsPlusSelected.push(node)
                }
            })

            let indexFirstDisplayedSlugAbove = displayedSlugsPlusSelected.indexOf(d)

            // TODO: associate correct container instead of default cp1
            this.props.dispatch(actions.fetchConcept('concepts/' + d.data.slug, 'cp1', indexFirstDisplayedSlugAbove))
        }
    }

    renderTree() {
        let x = (node: any) => 40 + 20 * node.depth
        let y = (node: any) => 40 + 25 * node.index

        if (this.hierarchy) {
            this.nodes = []

            this.hierarchy.eachBefore((node: any) => {
                this.nodes.push(node)
            })

            let filteredNodes = _.filter(this.nodes, (node: any) => node.visible && !node.closedAncestor)

            filteredNodes.forEach((node: any, index: number) => {
                node.index = index
            })

            this.displayedNodes = filteredNodes.length

            let node = this.domContainer.selectAll('g.conceptNode')
                .data(filteredNodes, (node: any) => node.data.id)

            // Transition exiting nodes to the parent's new position.
            var nodeExit = node.exit()
                .style('fill-opacity', 0)
                .remove()

            let nodeEnter = node
                .enter()
                    .append('g')
                    .attr('class', (d: any) =>
                        'conceptNode ' +
                        (d.children ? 'toggle ' : 'notoggle ') +
                        (this.props.displayedSlugs.indexOf(d.data.slug) != -1 ? 'displayedSlug ' : ' ') +
                        (d.toggled ? 'toggled ' : ' ')
                    )
                    .attr('transform', (d: any) => 'translate(' + x(d) + ',' + y(d) + ')')
                    .call(this.interceptClickHandler
                        .on('customClick', this.customClick.bind(this))
                        .on('customDoubleClick', this.customDoubleClick.bind(this))
                    )

            nodeEnter.append('circle')
                    .attr('class', (d: any) => 'conceptCircle')
                    .attr('r', 10e-6)

            nodeEnter.append('text')
                    .attr('x', (d: any) => 15)
                    .attr('dy', '.35em')
                    .text((d: any) => d.data.name)
                    .style('fill-opacity', 0)

            let nodeUpdate = nodeEnter.merge(node)
                .attr('class', (d: any) =>
                    'conceptNode ' +
                    (d.children ? 'toggle ' : 'notoggle ') +
                    (this.props.displayedSlugs.indexOf(d.data.slug) != -1 ? 'displayedSlug ' : ' ') +
                    (d.toggled ? 'toggled ' : ' ')
                )
                .transition()
                .duration(this.transitionDuration)
                .attr('transform', (d: any) => 'translate(' + x(d) + ',' + y(d) + ')')

            nodeUpdate.select('circle')
                .attr('r', 8)

            nodeUpdate.select('text')
                .style('fill-opacity', 1)
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
        this.interceptClickHandler = this.interceptClick()

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
