import {
    action,
    concept,
} from './types'

import config from './config'
const serverUrl = config('app').serverURL

export function changeSelectedConceptNav(conceptNode: any): action {
    return {
        type: 'CHANGE_SELECTED_CONCEPT_NAV',
        value: conceptNode,
    }
}

export function toggleNavPanel(): action {
    return {
        type: 'TOGGLE_NAV_PANEL',
    }
}

export function removeConcept(container: string, index: number): action {
    return {
        type: 'REMOVE_CONCEPT',
        value: index,
        container,
    }
}

export function fetchConcept(url: string, container: string, index: number=null): action {
    return {
        type: 'FETCH_CONCEPT',
        promise: (dispatch, getState) => {
            dispatch(loading(container))

            fetch(serverUrl + url).then((res: any) => {
                return res.json()
            }).then( (json: concept) => {
                dispatch(receivedSlug(json, container, index))
            }).catch( (err: any) => {
                console.log(err);
                dispatch(fetchFailed(err, container))
            })
        },
        container: container,
    }
}

export function fetchConceptGraph(url: string, container: string): action {
    return {
        type: 'FETCH_CONCEPT_LIST',
        promise: (dispatch, getState) => {
            dispatch(loading(container))

            fetch(serverUrl + url).then((res: any) => res.json())
            .then((json: concept[]) => {
                dispatch(receivedConceptGraph(json, container));
            })
            .catch((err: any) => {
                console.log(err)
                dispatch(fetchFailed(err, container))
            })
        }
    }
}

export function fetchDataset(url: string, container: string): action {
    return {
        type: 'FETCH_DATASET',
        promise: (dispatch, getState) => {
            dispatch(loading(container))

            fetch(serverUrl + url).then((res: any) => res.json())
            .then( (json: any[]) => {
                dispatch(receivedDataset(json, container))
            })
            .catch( (err: any) => {
                console.log(err)
                dispatch(fetchFailed(err, container))
            })
        }
    }
}

export function loading(container: string): action {
    return {
        type: 'LOADING',
        container: container,
    }
}

export function receivedSlug(response: concept, container: string, index: number=null): action {
    return {
        type: 'FETCH_SLUG_SUCCESS',
        value: {
            ...response,
            index,
        },
        container: container,
    }
}

export function receivedConceptGraph(response: concept[], container: string): action {
    return {
        type: 'FETCH_CONCEPT_GRAPH_SUCCESS',
        value: response,
        container: container,
    }
}

export function receivedDataset(response: concept[], container: string): action {
    return {
        type: 'FETCH_DATASET_SUCCESS',
        value: response,
        container: container,
    }
}

export function fetchFailed(err: any, container: string): action {
    return {
        type: 'FETCH_FAILURE',
        value: err,
        container: container,
    }
}
