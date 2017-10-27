import * as _ from 'lodash'

import {
    Module,
    Action,
    AppState,
    ContainerState,
    ConceptGraph,
} from './types'

import {TimeseriesValuesReducer} from './components/modules/timeseries_chart'
import {LabelizedValuesReducer} from './components/modules/labelized_chart'
import {ConceptGraphReducer} from './components/d3Blocks/ConceptGraph'
import {ConceptNavReducer} from './components/d3Blocks/ConceptNav'

const initialCp1State: ContainerState = {
    containerId: 'cp1',
    concepts: [],
    loading: 0,
}

const initialAppContainerState: ContainerState = {
    containerId: 'app',
    loading: 0,
}

// const selectedGraphNodeTest: any = {
//     connexComponent: 4,
//     createdAt: "2017-10-18T09:05:35.492Z",
//     distanceToRoot: 1,
//     id: 8,
//     index: 7,
//     key: "chomage",
//     name: "Chomage",
//     rootConcept: null,
//     slug: "chomage",
//     updatedAt: "2017-10-18T09:05:35.492Z",
//     vx: 0.00003803722385971042,
//     vy: 0.00002060345658589924,
//     x: 315.3480145453016,
//     y: 201.07288720990252
// }

const selectedGraphNodeTest: any = {
    connexComponent: 4,
    createdAt: "2017-10-18T09:05:35.525Z",
    distanceToRoot: 0,
    id: 15,
    index: 14,
    key: "emploi",
    name: "Emploi",
    rootConcept: true,
    slug: "emploi",
    updatedAt: "2017-10-18T09:05:35.525Z",
    vx: 0.000011318360215728518,
    vy: -0.0000020253524838587112,
    x: 841.3230662574604,
    y: 132.77765830847156
}

const initialAppState: AppState = {
    conceptGraph: {
        nodes: [],
        links: [],
        graph: {},
        selectedConceptNode: null,
    },
    containers: {
        app: initialAppContainerState,
        cp1: initialCp1State,
    },
    toggled: false,
}

export function reducer(state = initialAppState, action: Action): AppState {
    switch (action.type) {
        case 'TOGGLE_NAV_PANEL':
            return {
                ...state,
                toggled: !state.toggled,
            }

        case 'LOADING':
            return {
                ...state,
                containers: {
                    ...state.containers,
                    [action.container]: {
                        ...state.containers[action.container],
                        loading: state.containers[action.container].loading + 1,
                    }
                }
            }

        case 'CHANGE_SELECTED_CONCEPT_NAV':
            return {
                ...state,
                conceptGraph: {
                    ...state.conceptGraph,
                    selectedConceptNode: action.value,
                }
            }

        case 'FETCH_SLUG_SUCCESS':
            // Parse modules using specific reducers
            const modules = action.value.modules.map((m: Module) => {
                switch (m.type) {
                    case 'definition':
                        return {
                            ...m,
                            data: (m.data.length > 0) ? m.data[0] : []
                        }
                    case 'suggestions':
                        return {
                            ...m,
                            data: (m.data.length > 0) ? m.data[0] : []
                        }
                    case 'timeseries':
                        return TimeseriesValuesReducer(m)
                    case 'labelizedvalues':
                        return LabelizedValuesReducer(m)
                    default:
                        return m
                }
            })

            return {
                ...state,
                containers: {
                    ...state.containers,
                    [action.container]: {
                        ...state.containers[action.container],
                        loading: state.containers[action.container].loading - 1,
                        concepts: [
                            ...state.containers[action.container].concepts,
                            {
                                attributes: {
                                    ...action.value,
                                    modules,
                                },
                                loadedTime: Date.now(),
                            }
                        ]
                    }
                }
            }

        case 'FETCH_CONCEPT_GRAPH_SUCCESS':
            let {nodes, links, roots, childrenDict} = ConceptGraphReducer(action)
            let graph: ConceptGraph = ConceptNavReducer(nodes, links, roots, childrenDict)

            return {
                ...state,
                conceptGraph: {
                    nodes,
                    links,
                    graph,
                    selectedConceptNode: selectedGraphNodeTest,
                },
                containers: {
                    ...state.containers,
                    [action.container]: {
                        ...state.containers[action.container],
                        loading: state.containers[action.container].loading - 1,
                    }
                }
            }

        case 'FETCH_DATASET_SUCCESS':
            return {
                ...state,
                containers: {
                    ...state.containers,
                    [action.container]: {
                        ...state.containers[action.container],
                        loading : state.containers[action.container].loading - 1,
                    }
                }
            }

        case 'FETCH_FAILURE':
            return {
                ...state,
                containers: {
                    ...state.containers,
                    [action.container]: {
                        ...state.containers[action.container],
                        loading: state.containers[action.container].loading - 1,
                    }
                }
            }

        default:
            return state
    }
}
