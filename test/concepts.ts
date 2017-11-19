import {ConceptLinks, ConceptNodes, ConceptSuggestedLinks} from './../server/src/database'
import {concept_nodesAttribute, concept_linksAttribute, concept_linksInstance} from './../models/db'

type abstractNode = string

async function getRootNodes(): Promise<abstractNode[]> {
    const nodeInstances = await ConceptNodes.findAll({ 'where': {'rootConcept': true}})
    return nodeInstances.map((nodeInstance: concept_nodesAttribute) => nodeInstance.slug)
}

async function getLinks(node: abstractNode): Promise<concept_linksAttribute[]> {

    const links =  await ConceptLinks.findAll({'where': { 'slug_to': node }})
    return links
}

function getNode(link: concept_linksAttribute): abstractNode {
    return link.slug_from
}

async function descendNodes(nodes: abstractNode[], nodeSet: Set<abstractNode>) {
    if(nodes.filter((node) => nodeSet.has(node)).length > 0) {
        return
    }

    nodes.forEach((node) => nodeSet.add(node))

    for(const node of nodes) {
        const links = await getLinks(node)
        descendNodes(links.map((link) => getNode(link)), nodeSet)
    }
}

describe('Concept', () => {

    let nodeSet: Set<abstractNode>
    beforeEach(async () => {
        nodeSet = new Set()
    })

    it.only('is acyclic with related Nodes', async () => {
        //const suggestedLinks = await nodes[0].suggestedLinks
        const rootNodes = await getRootNodes()
        descendNodes(rootNodes, nodeSet)
        return
    })

    it('is acyclic with suggested Nodes', () => {

    })
})
