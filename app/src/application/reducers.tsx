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
import {ConceptGraphReducer} from './components/d3Blocks/conceptGraph'
import {ConceptNavReducer} from './components/d3Blocks/conceptNav'

const initialCp1State: ContainerState = {
    containerId: 'cp1',
    concepts: [],
    loading: 0,
}

const initialAppContainerState: ContainerState = {
    containerId: 'app',
    loading: 0,
}

const initialAppState: AppState = {
    conceptGraph: {
        nodes: [],
        links: [],
        graph: {},
        selectedConceptNode: null,
        displayedSlugs: [],
    },
    containers: {
        app: initialAppContainerState,
        cp1: initialCp1State,
    },
    toggled: true,
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
                    displayedSlugs: [],
                },
                containers: initialAppState.containers,
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
                conceptGraph: {
                    ...state.conceptGraph,
                    displayedSlugs: state.conceptGraph.displayedSlugs.concat([action.value.slug]),
                },
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
                    ...state.conceptGraph,
                    nodes,
                    links,
                    graph,
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
