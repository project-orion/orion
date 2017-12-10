import {assert} from 'chai'

import * as schema from './../data/schema'
import {concept_nodesAttribute} from './../models/db'

describe('SEQUELIZE SETUP', () => {
    it('Connection should exist', () => {
        return schema.sequelize.authenticate()
    })

    it('Model creation should work', () => {
        return schema.ConceptNodes.create({
            name: 'testName',
            slug: 'testname',
            rootConcept: false,
        }).then((concept: concept_nodesAttribute) => {
            assert(concept.name === 'testName', 'Name should equal \'testName\'')
        })
    })

    it('Model should fetch and update', () => {
        return schema.ConceptNodes.findOne({
            where: {
                name: {
                    $eq: 'testName'
                },
            }
        }).then((concept: concept_nodesAttribute) => {
            assert(concept.name === 'testName', 'Name should equal \'testName\'')
        })
    })

    it('Model should delete', () => {
        return schema.ConceptNodes.destroy({
            where: {
                name: {
                    $eq: 'testName'
                },
            }
        }).then((res: any) => {
            assert(res == 1, 'Response from db should be positive')
        })
    })

    it('Connection should exit', () => {
        return schema.sequelize.close()
    })
})
