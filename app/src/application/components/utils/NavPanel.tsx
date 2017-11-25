import * as d3 from 'd3'
import * as _ from 'lodash'
import * as React from 'react'
import Measure from 'react-measure'
import {
    Button,
} from '@blueprintjs/core'

import {ConceptGraph} from '../d3Blocks/conceptGraph'
import {ConceptNav} from '../d3Blocks/conceptNav'
import * as actions from '../../actions'
import {
    concept_nodesAttribute,
    concept_linksAttribute,
    concept_suggested_linksAttribute,
} from './../../../../../models/db'
import {
    action,
    concept,
    conceptGraph,
} from '../../types'

interface Props {
    nodes: any,
    links: any,
    graph: any,
    dispatch: any,
    toggled: boolean,
    selectedConceptNode: any,
    displayedSlugs: string[],
}

interface State {
    searchedConcept?: string,
    dimensions: any,
}

export function navPanelReducer(action: action) {
    const roots = _.filter(action.value.nodes, (node: any) => node.rootConcept)

    let childrenDict: any = {}

    _.each(action.value.links, (link: concept_linksAttribute) => {
        if (childrenDict[link.slug_to]) {
            childrenDict[link.slug_to].directChildren.push(link.slug_from)
        } else {
            childrenDict[link.slug_to] = {
                directChildren: [link.slug_from]
            }
        }
    })

    _.each(action.value.suggestedLinks, (link: concept_suggested_linksAttribute) => {
        if (childrenDict[link.slug_to]) {
            if (childrenDict[link.slug_to].suggestedChildren) {
                childrenDict[link.slug_to].suggestedChildren.push(link.slug_from)
            } else {
                childrenDict[link.slug_to] = {
                    ...childrenDict[link.slug_to],
                    suggestedChildren: [link.slug_from]
                }

            }
        } else {
            childrenDict[link.slug_to] = {
                suggestedChildren: [link.slug_from]
            }
        }
    })

    let nodeMap = _.mapKeys(action.value.nodes, (value: any, index: number) => value.slug)

    let enrichNodeWithChildren = (connexComponent: number, parentsSuggestedConcepts: string[]=null, slug: string): any => {
        let c = childrenDict[slug] && childrenDict[slug].directChildren ? childrenDict[slug].directChildren : []
        let sc = childrenDict[slug] && childrenDict[slug].suggestedChildren ? childrenDict[slug].suggestedChildren : []

        return {
            ...nodeMap[slug],
            suggested: parentsSuggestedConcepts ? parentsSuggestedConcepts.indexOf(slug) != -1 : false,
            children: _.map(c.concat(sc), enrichNodeWithChildren.bind(this, connexComponent, sc)),
            connexComponent: connexComponent,
        }
    }

    let graph: conceptGraph = {}
    _.each(roots, (root: any, index: number) => {
        graph[index] = d3.hierarchy(enrichNodeWithChildren(index, null, root.slug))
    })

    _.each(graph, (d3node: any) => {
        d3node.each((node: any) => {
            nodeMap[node.data.slug].key = node.data.slug
            nodeMap[node.data.slug].depth = node.depth
            nodeMap[node.data.slug].connexComponent = node.data.connexComponent
        })
    })

    const nodes = _.map(_.values(nodeMap), (node: any) => node)

    const links = action.value.links.map((link: concept_linksAttribute) => {
        return {
            connexComponent: nodeMap[link.slug_from].connexComponent,
            source: link.slug_from,
            target: link.slug_to,
            key: link.id,
        }
    })

    const suggestedLinks = _.map(action.value.suggestedLinks, (link: concept_suggested_linksAttribute) => {
        return {
            connexComponent: nodeMap[link.slug_from].connexComponent,
            source: link.slug_from,
            target: link.slug_to,
            key: link.id,
        }
    }) as any

    return {
        nodes,
        links,
        suggestedLinks,
        graph
    }
}

export class NavPanel extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)

        this.state = {
            dimensions: {
                width: 0,
                height: 0,
            },
        }
    }

    updateState(event: any) {
        this.setState({
            ...this.state,
            searchedConcept: event.target.value,
        })
    }

    render() {
        const {nodes, links, toggled, selectedConceptNode, displayedSlugs} = this.props
        const {searchedConcept} = this.state
        const length = searchedConcept ? searchedConcept.length : 0
        const toggleButtonTextIcon = (toggled) ?
            <span className={'pt-icon-caret-left'}></span> : <span className={'pt-icon-caret-right'}></span>

        return (
            <Measure
                bounds
                onResize={(contentRect: any) => {
                    this.setState({
                        dimensions: contentRect.bounds,
                    })
                }}
            >
                {
                    ({ measureRef } : any) =>
                        <div
                            ref={measureRef}
                            style={{
                                padding: 0
                            }}
                        >
                            <Button
                                className={'pt-minimal'}
                                onClick={() => this.props.dispatch(actions.toggleNavPanel())}
                            >
                                Toggle
                                {toggleButtonTextIcon}
                            </Button>

                            <div className='pt-input-group concept_nav_bar'>
                                <span className={'pt-icon pt-icon-search'}></span>
                                <input
                                    className={'pt-input'}
                                    placeholder={'Concept (ex: Chômage)'}
                                    dir='auto'
                                    value={searchedConcept}
                                    onChange={this.updateState.bind(this)}
                                />
                            </div>

                            <div className={(toggled) ? 'hide' : ''}>
                                <ConceptNav
                                    dimensions={{
                                        width: this.state.dimensions.width,
                                        height: window.innerHeight / 2,
                                    }}
                                    graph={_.cloneDeep(this.props.graph)}
                                    nodes={_.cloneDeep(nodes)}
                                    selectedConceptNode={selectedConceptNode}
                                    displayedSlugs={displayedSlugs}
                                    dispatch={this.props.dispatch}
                                />
                            </div>

                            <div className={(!toggled) ? 'hide' : ''}>
                                <ConceptGraph
                                    version={nodes.length + this.state.dimensions.width + length}
                                    searchedConcept={searchedConcept}
                                    nodes={_.cloneDeep(nodes)}
                                    links={_.cloneDeep(links)}
                                    labels={_.cloneDeep(nodes)}
                                    dimensions={{
                                        width: this.state.dimensions.width,
                                        height: window.innerHeight / 2,
                                    }}
                                    dispatch={this.props.dispatch}
                                />
                            </div>
                        </div>
                }
            </Measure>
        )
    }
}
