import {Action, Concept} from './types'

const serverUrl = (process.env.NODE_ENV == 'production') ? 'http://09f503be.ngrok.io/' : 'http://localhost:3001/'

export function changeSelectedConceptNav(conceptId: number): Action {
    return {
        type: 'CHANGE_SELECTED_CONCEPT_NAV',
        value: conceptId,
    }
}

export function toggleNavPanel(): Action {
    return {
        type: 'TOGGLE_NAV_PANEL',
    }
}

export function fetchConcept(url: string, container: string): Action {
    return {
        type: 'FETCH_CONCEPT',
        promise: (dispatch, getState) => {
            dispatch(loading(container))

            fetch(serverUrl + url).then((res: any) => {
                return res.json()
            }).then( (json: Concept) => {
                dispatch(receivedSlug(json, container))
            }).catch( (err: any) => {
                console.log(err);
                dispatch(fetchFailed(err, container))
            })
        },
        container: container,
    }
}

export function fetchConceptGraph(url: string, container: string): Action {
    return {
        type: 'FETCH_CONCEPT_LIST',
        promise: (dispatch, getState) => {
                dispatch(loading(container))

                fetch(serverUrl + url).then((res: any) => {
                    return res.json()
                })
                .then( (json: Concept[]) => {
                    dispatch(receivedConceptGraph(json, container));
                    })
                .catch( (err: any) => {
                    console.log(err)
                    dispatch(fetchFailed(err, container))
                    })
                }
        }
}

export function fetchDataset(url: string, container: string): Action {
    return {
        type: 'FETCH_DATASET',
        promise: (dispatch, getState) => {
            dispatch(loading(container))

            fetch(serverUrl + url).then((res: any) => {
                return res.json()
            }).then( (json: any[]) => {
                dispatch(receivedDataset(json, container))
            }).catch( (err: any) => {
                console.log(err)
                dispatch(fetchFailed(err, container))
            })
        }
    }
}

export function loading(container: string): Action {
    return {
        type: 'LOADING',
        container: container,
    }
}

export function receivedSlug(response: Concept, container: string): Action {
    return {
        type: 'FETCH_SLUG_SUCCESS',
        value: response,
        container: container,
    }
}

export function receivedConceptGraph(response: Concept[], container: string): Action {
    return {
        type: 'FETCH_CONCEPT_GRAPH_SUCCESS',
        value: response,
        container: container,
    }
}

export function receivedDataset(response: Concept[], container: string): Action {
    return {
        type: 'FETCH_DATASET_SUCCESS',
        value: response,
        container: container,
    }
}

export function fetchFailed(err: any, container: string): Action {
    return {
        type: 'FETCH_FAILURE',
        value: err,
        container: container,
    }
}
