import * as _ from 'lodash'
import * as d3 from 'd3'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import * as actions from '../../actions'

interface Props {
    dimensions: {
        width: number,
        height: number,
    }
    graph: any,
    selectedConceptNode: any,
}

interface State {
    selectedGraph: any,
}

export function ConceptNavReducer(nodes: any, links: any, roots: any, childrenDict: any){
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

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        this.setState({
            selectedGraph: this.selectGraph(nextProps),
        })

        return true
    }

    renderDomNode(graph: any): any {
        console.log(graph)
        return (graph) ? (
            <li>
                {graph.slug}
                <ul>
                    {_.map(graph.children, this.renderDomNode.bind(this))}
                </ul>
            </li>
        ) : ''
    }

    render() {
        const {height, width} = this.props.dimensions
        const {selectedGraph} = this.state

        const domGraph = (
            <ul>
                {this.renderDomNode(selectedGraph)}
            </ul>
        )

        return (
            <div>
                <div>ConceptNav</div>
                <div>{domGraph}</div>
                <svg
                    ref='container'
                    width={width}
                    height={height}
                ></svg>
            </div>
        )
    }
}
