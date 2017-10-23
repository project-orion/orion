import * as _ from 'lodash'

import {
    Module,
    Action,
    AppState,
    ContainerState,
} from './types'

import {
    TimeseriesValuesReducer,
} from './components/modules/timeseries_chart'
import {
    LabelizedValuesReducer,
} from './components/modules/labelized_chart'
import {
    ConceptGraphReducer,
} from './components/d3Blocks/conceptGraph'

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
        selectedConceptId: null,
    },
    containers: {
        app: initialAppContainerState,
        cp1: initialCp1State,
    },
}

export function reducer(state = initialAppState, action: Action): AppState {
    switch (action.type) {
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
                    selectedConceptId: action.value,
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
            let {nodes, links} = ConceptGraphReducer(action)

            return {
                ...state,
                conceptGraph: {
                    nodes,
                    links,
                    selectedConceptId: null,
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
