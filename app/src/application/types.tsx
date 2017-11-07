import {
    concept_nodesAttribute,
    concept_linksAttribute,
    modulesAttribute,
    definition_valuesAttribute,
} from '../../../models/db'

export interface ConceptGraphNode extends ConceptAttributes {
    children: ConceptGraphNode[],
}

export interface ConceptGraph {
    [index: number]: ConceptGraphNode,
}

export interface AppState {
    containers?: {
        [id: string]: ContainerState
    },
    conceptGraph: {
        nodes: concept_nodesAttribute[],
        links: concept_linksAttribute[],
        graph: ConceptGraph,
        selectedConceptNode: any,
        displayedSlugs: string[],
    }
    dispatch?: any,
    toggled: boolean,
}

export interface ContainerState {
    loading: number,
    dispatch?: any,
    containerId: string,

    // The following props depend on the container.
    concepts?: Concept[],
}

export interface Concept {
    attributes: ConceptAttributes,
    loadedTime: number,
}

interface ConceptAttributes extends concept_nodesAttribute {
    modules?: Module[],
}

export interface Module extends modulesAttribute {
    data?: any,
}

export interface Action {
    type: string,
    promise?: (dispatch: any, getState: any) => any,
    value?: any,
    container?: string,
}

export type ColumnSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
'1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15' | '16'
