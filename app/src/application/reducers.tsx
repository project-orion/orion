import * as csv_parse from 'csv-parse'
import * as _ from 'lodash'

import {
    module,
    action,
    appState,
    containerState,
    conceptGraph,
} from './types'

import {TimeseriesValuesReducer} from './components/modules/timeseries_chart'
import {LabelizedValuesReducer} from './components/modules/labelized_chart'
import {navPanelReducer} from './components/utils/navPanel'

const initialCp1State: containerState = {
    containerId: 'cp1',
    concepts: [],
    loading: 0,
}

const initialAppContainerState: containerState = {
    containerId: 'app',
    loading: 0,
}

const initialTestState: containerState = {
    containerId: 'test',
    loading: 0,
}

const initialAppState: appState = {
    conceptGraph: {
        nodes: [],
        links: [],
        suggestedLinks: [],
        graph: {},
        selectedConceptNode: null,
        displayedSlugs: [],
    },
    containers: {
        app: initialAppContainerState,
        cp1: initialCp1State,
        test: initialTestState,
    },
    toggled: true,
}

export function reducer(state = initialAppState, action: action): appState {
    switch (action.type) {
        case 'TOGGLE_NAV_PANEL':
            return {
                ...state,
                toggled: !state.toggled,
            }

        case 'REMOVE_CONCEPT':
            var displayedSlugs = _.cloneDeep(state.conceptGraph.displayedSlugs)
            var concepts = _.cloneDeep(state.containers[action.container].concepts)

            displayedSlugs.splice(action.value, 1)
            concepts.splice(action.value, 1)

            return {
                ...state,
                conceptGraph: {
                    ...state.conceptGraph,
                    displayedSlugs,
                },
                containers: {
                    ...state.containers,
                    [action.container]: {
                        ...state.containers[action.container],
                        concepts,
                    }
                }
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

        case 'FETCH_TEST_SUCCESS':
            let response = csv_parse(action.value.response, {
                delimiter: ';',
                columns: true,
                relax: true,
            })

            return {
                ...state,
                containers: {
                    ...state.containers,
                    [action.container]: {
                        ...state.containers[action.container],
                        loading: state.containers[action.container].loading - 1,
                        testData: {
                            ...state.containers[action.container].testData,
                            [action.value.fileName]: response,
                        },
                    }
                }
            }

        case 'FETCH_SLUG_SUCCESS':
            // Parse modules using specific reducers
            const modules = action.value.modules.map((m: module) => {
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

            var displayedSlugs = _.cloneDeep(state.conceptGraph.displayedSlugs)
            var concepts = _.cloneDeep(state.containers[action.container].concepts)
            var newConcept = {
                attributes: {
                    ...action.value,
                    modules,
                },
                loadedTime: Date.now(),
            }

            if (action.value.index && action.value.index != -1) {
                displayedSlugs.splice(action.value.index, 0, action.value.slug)
                concepts.splice(action.value.index, 0, newConcept)
            } else {
                displayedSlugs.push(action.value.slug)
                concepts.push(newConcept)
            }

            return {
                ...state,
                conceptGraph: {
                    ...state.conceptGraph,
                    displayedSlugs,
                },
                containers: {
                    ...state.containers,
                    [action.container]: {
                        ...state.containers[action.container],
                        loading: state.containers[action.container].loading - 1,
                        concepts,
                    }
                }
            }

        case 'FETCH_CONCEPT_GRAPH_SUCCESS':
            let {nodes, links, suggestedLinks, graph} = navPanelReducer(action)

            return {
                ...state,
                conceptGraph: {
                    ...state.conceptGraph,
                    nodes,
                    links,
                    suggestedLinks,
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
