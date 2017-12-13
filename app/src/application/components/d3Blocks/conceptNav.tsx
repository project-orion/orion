import * as _ from 'lodash'
import * as d3 from 'd3'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import './conceptNav.less'

import * as actions from '../../actions'
import * as interceptClick from './utils/interceptClick'
import {
    action,
    conceptGraph,
    conceptLinksAttribute,
    extendedConceptNodeAttribute,
} from './../../types'

interface extendedHierarchyNode extends d3.HierarchyNode<extendedConceptNodeAttribute> {
    toggled?: boolean,
    visible?: boolean,
    index?: number,
}

interface Props {
    dimensions: {
        width: number,
        height: number,
    }
    graph: conceptGraph,
    nodes: extendedConceptNodeAttribute[],
    displayedNode: any,
    displayedSlugs: string[],
    dispatch: any,
}

interface State {
    selectedGraph: extendedHierarchyNode,
}

export class ConceptNav extends React.Component<Props, State> {
    // D3
    refs: any
    domContainer: any
    transitionDuration: number
    selectedNodeId: number

    interceptClickHandler: any

    graph: conceptGraph
    nodes: extendedHierarchyNode[]
    links: conceptLinksAttribute[]
    hierarchy: extendedHierarchyNode

    // Makes all direct children of a toggled hierachicalNode visible.
    // Does a recursive call for every child c which is toggled as well.
    hierachicalToggle(hNode: extendedHierarchyNode) {
        hNode.visible = true
        if (hNode.toggled && hNode.children) {
            hNode.children.forEach(this.hierachicalToggle.bind(this))
        }
    }

    toggle(hNode: extendedHierarchyNode) {
        if (!hNode.toggled) {
            hNode.toggled = true
            hNode.visible = true
            hNode.children ? hNode.children.forEach(this.hierachicalToggle.bind(this)) : null
        } else {
            hNode.toggled = false
            hNode.each((hNode: extendedHierarchyNode) => {
                hNode.visible = false
            })
            hNode.visible = true
        }
    }

    updateHierarchy() {
        if (this.props.displayedNode && this.props.displayedNode.data.connexComponent) {
            this.graph = this.props.graph

            let selectedNode

            if (this.selectedNodeId != this.props.displayedNode.data.id) {
                this.selectedNodeId = this.props.displayedNode.data.id
                this.hierarchy = this.graph[this.props.displayedNode.data.connexComponent]

                this.hierarchy.each((hNode: extendedHierarchyNode) => {
                    if (hNode.data.id == this.props.displayedNode.data.id) {
                        selectedNode = hNode
                    }
                })

                this.hierarchy = selectedNode
                this.toggle(this.hierarchy)
            }
        }
    }

    click(hNode: extendedHierarchyNode) {
        if (hNode.children) {
            this.hierarchy.each((node: extendedHierarchyNode) => {
                if (node.data.id == hNode.data.id) {
                    this.toggle(node)
                }
            })
            this.renderTree()
        }
    }

    rebind = interceptClick.rebind
    interceptClick = interceptClick.interceptClick

    customClick(hNode: extendedHierarchyNode) {
        if (hNode.children) {
            this.hierarchy.each((node: extendedHierarchyNode) => {
                if (node.data.id == hNode.data.id) {
                    this.toggle(node)
                }
            })
            this.renderTree()
        }
    }

    customDoubleClick(hNode: extendedHierarchyNode) {
        let index = this.props.displayedSlugs.indexOf(hNode.data.slug)

        if (index != -1) {
            // Meaning one wants to get rid of this slug on the right panel...
            this.props.dispatch(actions.removeConcept('cp1', index))
        } else {
            // Meaning that one wants to insert the concept in the right panel...
            let displayedSlugsPlusSelected: extendedHierarchyNode[] = []

            this.hierarchy.eachBefore((node: extendedHierarchyNode) => {
                if (this.props.displayedSlugs.indexOf(node.data.slug) != -1 || node.data.id == hNode.data.id) {
                    displayedSlugsPlusSelected.push(node)
                }
            })

            let indexFirstDisplayedSlugAbove = displayedSlugsPlusSelected.indexOf(hNode)

            // TODO: associate correct container instead of default cp1
            this.props.dispatch(actions.fetchConcept('concepts/' + hNode.data.slug, 'cp1', indexFirstDisplayedSlugAbove))
        }
    }

    renderTree() {
        let x = (node: extendedHierarchyNode) => 40 + 20 * node.depth
        let y = (node: extendedHierarchyNode) => 40 + 25 * node.index

        if (this.hierarchy) {
            this.nodes = []

            this.hierarchy.eachBefore((node: extendedHierarchyNode) => {
                this.nodes.push(node)
            })

            let filteredNodes = _.filter(this.nodes, (node: extendedHierarchyNode) => node.visible)

            filteredNodes.forEach((node: extendedHierarchyNode, index: number) => {
                node.index = index
            })

            let node = this.domContainer.selectAll('g.conceptNode')
                .data(filteredNodes, (node: extendedHierarchyNode) => node.data.id)

            // Transition exiting nodes to the parent's new position.
            var nodeExit = node.exit()
                .style('fill-opacity', 0)
                .remove()

            let nodeEnter = node
                .enter()
                    .append('g')
                    .attr('class', (d: extendedHierarchyNode) =>
                        'conceptNode ' +
                        (d.children ? 'toggle ' : 'notoggle ') +
                        (this.props.displayedSlugs.indexOf(d.data.slug) != -1 ? 'displayedSlug ' : ' ') +
                        (d.toggled ? 'toggled ' : ' ') +
                        (d.data.suggested ? 'suggested ' : ' ')
                    )
                    .attr('transform', (d: extendedHierarchyNode) => 'translate(' + x(d) + ',' + y(d) + ')')
                    .call(this.interceptClickHandler
                        .on('customClick', this.customClick.bind(this))
                        .on('customDoubleClick', this.customDoubleClick.bind(this))
                    )

            nodeEnter.append('circle')
                    .attr('class', 'conceptCircle')
                    .attr('r', 10e-6)

            nodeEnter.append('text')
                    .attr('x', (d: extendedHierarchyNode) => 15)
                    .attr('dy', '.35em')
                    .text((d: extendedHierarchyNode) => d.data.name)
                    .style('fill-opacity', 0)

            let nodeUpdate = nodeEnter.merge(node)
                .attr('class', (d: extendedHierarchyNode) =>
                    'conceptNode ' +
                    (d.children ? 'toggle ' : 'notoggle ') +
                    (this.props.displayedSlugs.indexOf(d.data.slug) != -1 ? 'displayedSlug ' : ' ') +
                    (d.toggled ? 'toggled ' : ' ') +
                    (d.data.suggested ? 'suggested ' : ' ')
                )
                .transition()
                .duration(this.transitionDuration)
                .attr('transform', (d: extendedHierarchyNode) => 'translate(' + x(d) + ',' + y(d) + ')')

            nodeUpdate.select('circle')
                .attr('r', 8)

            nodeUpdate.select('text')
                .style('fill-opacity', 1)
        }
    }

    // REACT LIFECYCLE
    selectGraph(props: Props) {
        let selectedGraph: any

        if (props.displayedNode && props.displayedNode.data.id) {
            let hierarchy = props.graph[props.displayedNode.data.connexComponent]

            hierarchy.each((node: extendedHierarchyNode) => {
                if (node.data.id == props.displayedNode.data.id) {
                    selectedGraph = node
                }
            })
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
                >
                    <defs>
                        <pattern id='blue_hash' width='5' height='5' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'>
                            <rect width='4' height='5' transform='translate(0,0)'></rect>
                        </pattern>
                        <pattern id='green_hash' width='5' height='5' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'>
                            <rect width='4' height='5' transform='translate(0,0)'></rect>
                        </pattern>
                        <pattern id='green_hash_hover' width='5' height='5' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'>
                            <rect width='4' height='5' transform='translate(0,0)'></rect>
                        </pattern>
                    </defs>
                </svg>
            </div>
        )
    }
}
