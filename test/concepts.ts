import {ConceptLinks, ConceptNodes, ConceptSuggestedLinks, sequelize} from './../server/src/database'
import {concept_nodesAttribute, 
        concept_linksAttribute, 
        concept_linksInstance, 
        concept_suggested_linksAttribute,
        concept_suggested_linksInstance} from './../models/db'

import { error } from 'util';
import { Sequelize } from 'sequelize';
import * as s from 'sequelize'

/**
 * References a node/link without the need to fetch it as it is only referred to by it's slug
 */
type abstractNode = string
type abstractLink = string
/**
 * typing for models
 */
type LinkModel = s.Model<concept_linksAttribute, concept_linksInstance> | s.Model<concept_suggested_linksAttribute, concept_suggested_linksInstance>

export class GraphExplorer {
    private exploredRootNodes: Set<abstractNode>
    private linkSet: Set<abstractLink>
    private rootNodes: abstractNode[]
    private linkModel: LinkModel


    constructor(linkModel: LinkModel) {
        this.linkSet = new Set<abstractLink>()
        this.exploredRootNodes = new Set<abstractNode>()
        this.rootNodes = new Array<abstractNode>()
        this.linkModel = linkModel
    }

    /**
     * Helper functions to get all root node's slugs.
     */
    public async getRootNodes(): Promise<abstractNode[]> {
        const nodeInstances = await ConceptNodes.findAll({ 'where': {'rootConcept': true}})
        return nodeInstances.map((nodeInstance: concept_nodesAttribute) => nodeInstance.slug)
    }   
    /**
     * Explores the entire graph taking in account the multiple entry points and the fact that they can be intertwined.
     * 
     * @param abstractNodes the array of node to explore, defaults to rootNodes from the graph
     * @param parentNode a parent node that indicate the function not to go backward while exploring
     */
    public async explore(abstractNodes: abstractNode[] = this.rootNodes, parentNode:abstractNode = null) {

        if(abstractNodes.length == 0) { return }

        for(const abstractNode of abstractNodes) {
            /// if a root node has already been explored, skip.
            if(this.exploredRootNodes.has(abstractNode)) { continue }
            /// if currently explored node is a root node, add it to the set so that it's not reexplored.
            if(this.rootNodes.indexOf(abstractNode)) { this.exploredRootNodes.add(abstractNode) }
            
            try {
                /// fetches associated links with current node
                const associatedLinks = await this.associatedLinks(abstractNode, parentNode)
                /// check if one of the links already exists whatever direction it has.
                this.checkCycle(associatedLinks)

                const nextNodes: abstractNode[] = associatedLinks.map((link) => link.slug_from == abstractNode ? link.slug_to : link.slug_from)
                await this.explore(nextNodes, abstractNode)
            } catch(error) { 
                throw error + ' <- ' + abstractNode 
            }
        }
    }
    /**
     * Returns the links associated to a @param node that are not derived from its @param parents
     * @param node the node to get links from
     * @param parentNode the parent node to avoid bi-directional depth search
     */
    private async associatedLinks(node: abstractNode, parentNode: abstractNode): Promise<concept_linksAttribute[]> {
        return await this.linkModel.findAll({
            where: {
                $or:[
                    { slug_from: node },
                    { slug_to: node }
                ],
                $and: [
                    { slug_to: { $ne: parentNode }},
                    { slug_from: { $ne: parentNode}}
                ]
            }
        })
    }

    private checkCycle(links:Array<concept_linksAttribute>) {
        for(const link of links) {
            if(this.linkSet.has(link.slug_from+link.slug_to)) {
                throw "Cycle found :  " + link.slug_to
            } else {
                this.linkSet.add(link.slug_from+link.slug_to)
                this.linkSet.add(link.slug_to+link.slug_from)
            }
        }
        return
    }
}

describe('Concept', () => {

    let linkSet: Set<abstractLink>

    before(() => {
        sequelize.options.logging = false
    })

    beforeEach(() => {
        linkSet = new Set()
    })

    it('is acyclic with related Nodes', async () => {
        let graphExplorer = new GraphExplorer(ConceptLinks)

        try { 
            await graphExplorer.explore(await graphExplorer.getRootNodes())
        }
        catch(cycle) { 
            throw cycle
        }
    })

    it('is acyclic with suggested Nodes', async () => {
        let graphExplorer = new GraphExplorer(ConceptSuggestedLinks)
        try {
            await graphExplorer.explore(await graphExplorer.getRootNodes())
        }
        catch(e) { throw e }
    })
})