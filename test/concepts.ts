import {ConceptLinks, ConceptNodes, ConceptSuggestedLinks, sequelize} from './../server/src/database'
import {concept_nodesAttribute, 
        concept_linksAttribute, 
        concept_linksInstance, 
        concept_suggested_linksAttribute} from './../models/db'

import {assert} from 'chai'

/**
 * References a node without the need to fetch it as it is only referred to by it's slug
 */
type abstractNode = string

/**
 * Helper functions to get all root node's slugs.
 */
async function getRootNodes(): Promise<abstractNode[]> {
    const nodeInstances = await ConceptNodes.findAll({ 'where': {'rootConcept': true}})
    return nodeInstances.map((nodeInstance: concept_nodesAttribute) => nodeInstance.slug)
}

/**
 * A crawler function that throws if it finds a node that is pointed to multiple time in a graph
 * 
 * @param nodes the array of nodes to craw down.
 * @param nodeSet a set of all crawled nodes up to now.
 * @param fetchLinkFunction a closure that fetches the appropriate links for each nodes (hard or suggested in this case)
 */
async function crawlNodes(nodes: abstractNode[], 
                          nodeSet: Set<abstractNode>, 
                          fetchLinkFunction: (node: abstractNode) => Promise<concept_linksAttribute[] | concept_suggested_linksAttribute[]>) {
    if(nodes.filter((node) => nodeSet.has(node)).length > 0) { throw new Error('Diagram is cyclic') }
    if(nodes.length == 0) { return }

    nodes.forEach((node) => nodeSet.add(node))

    for(const node of nodes) {
        const links = await fetchLinkFunction(node)
        try { await crawlNodes(links.map((link) => link.slug_from), nodeSet, fetchLinkFunction) }
        catch(error) { throw error }
    }
}

describe('Concept', () => {

    let nodeSet: Set<abstractNode>

    before(() => {
        sequelize.options.logging = false
    })

    beforeEach(() => {
        nodeSet = new Set()
    })

    it('is acyclic with related Nodes', async () => {
        const rootNodes = await getRootNodes()
        try { 
            await crawlNodes(rootNodes, nodeSet, async (node) => {
                return await ConceptLinks.findAll({where: {'slug_to': node}})
            })
        }
        catch(e) { throw e }
    })

    it('is acyclic with suggested Nodes', async () => {
        const rootNodes = await getRootNodes()
        try {
            await crawlNodes(rootNodes, nodeSet, async (node) => {
                return await ConceptSuggestedLinks.findAll({ where: {'slug_to': node}})
            })
        }
        catch(e) { throw e }
    })
})