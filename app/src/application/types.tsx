import {
    concept_nodesAttribute,
    concept_linksAttribute,
    concept_suggested_linksAttribute,
    modulesAttribute,
    definition_valuesAttribute,
} from '../../../models/db'

export interface extendedConceptNodeAttribute extends concept_nodesAttribute {
    key: string,
    depth: number,
    connexComponent: number,
    suggested: boolean,
}

export interface conceptLinksAttribute {
    key: number,
    target: any,
    source: any,
    connexComponent: number,
}

export interface conceptGraphNodeData extends concept_nodesAttribute {
    connexComponent: number,
    suggested: boolean,
}

export interface conceptGraphNode extends d3.HierarchyNode<extendedConceptNodeAttribute> {}

export interface conceptGraph {
    [index: number]: conceptGraphNode,
}

export interface appState {
    containers?: {
        [id: string]: containerState
    },
    conceptGraph: {
        nodes: extendedConceptNodeAttribute[],
        graph?: any,
        graphNodes: any,
        selectedRoot: any,
        selectedNode: any,
        displayedNode: any,
        displayedSlugs: string[],
    }
    dispatch?: any,
    toggled: boolean,
}

export interface containerState {
    loading: number,
    dispatch?: any,
    containerId: string,

    // The following props depend on the container.
    concepts?: concept[],
    testData?: any,
}

export interface concept {
    attributes: conceptAttributes,
    loadedTime: number,
}

interface conceptAttributes extends concept_nodesAttribute {
    modules?: module[],
}

export interface module extends modulesAttribute {
    data?: any,
}

export interface action {
    type: string,
    promise?: (dispatch: any, getState: any) => any,
    value?: any,
    container?: string,
}

export type columnSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
'1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15' | '16'
