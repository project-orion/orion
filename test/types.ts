import * as assert from 'assert'
import * as request from 'supertest'

import * as database from './../server/src/database'
import * as _ from "lodash"
import {concept_nodesAttribute, concept_linksAttribute, modulesAttribute} from '../models/db.d'

let server: any

function isConceptNodeAttributes(element: any): element is concept_nodesAttribute {
    return typeof element.id == "number" && typeof element.name == "string" && typeof element.slug == "string"
}

function isConceptLinksAttributes(element: any): element is concept_linksAttribute {
    return typeof element.id == "number" && typeof element.slug_from == "string" && typeof element.slug_to == "string"
}

function isModulesAttributes(element: any): element is modulesAttribute {
    //console.log(element)
    return typeof element.id === "number" && typeof element.conceptNodeId == "number"
}
describe('API RETURN TYPES', () => {
    before(() => {
        server = require('../server/src/server')
    })

    it('End-point concepts/ should return correctly typed nodes', () => {
        return request(server)
            .get('/concepts')
            .expect((response: Response) => {
                let data = JSON.parse(JSON.stringify(response.body))
                assert(data.nodes.filter((node: any) => isConceptNodeAttributes(node)).length == data.nodes.length, "Returned JSON is of wrong type, check integrity in type guard function isConceptNodeAttributes")
            })
    })

    it('End-point concepts/ should return correctly typed links', () => {
        return request(server)
            .get('/concepts')
            .expect((response: Response) => {
                let data = JSON.parse(JSON.stringify(response.body))
                assert(data.links.filter((link: any) => isConceptLinksAttributes(link)).length == data.links.length, "Returned JSON is of wrong type, check integrity in type guard function isConceptLinksAttributes")
            })
    })

    it('Test each slug integrity', async () => {
        let r = await request(server)
            .get('/concepts')
        for(const slug of r.body.nodes) {
            let object = await request(server)
               .get('/concepts/' + slug.slug)
           assert(isConceptNodeAttributes(object.body))              
        }

    })

    it('Test each module integrity', async () => {
        let r = await request(server)
            .get('/concepts')
        let modules = []
        for(const slug of r.body.nodes) {
            let concepts = await request(server).get('/concepts/' + slug.slug)
            modules.push(concepts.body.modules)
        }
        const flattenModules = _.flatten(modules).length
        const filteredModules = _.flatten(modules).filter((module: any) => isModulesAttributes(module)).length
        assert(flattenModules === filteredModules, "Returned modules are of wrong type. Should be modulesAttribute")
    })

    after(() => {
        server.close()
        return database.sequelize.close()
    })
})
