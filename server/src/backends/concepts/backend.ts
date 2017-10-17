import {Router, Request, Response} from 'express'

import {
    concept_nodesAttribute,
    modulesAttribute,
    definition_valuesAttribute,
    timeseries_valuesAttribute,
    labelized_valuesAttribute,
    suggestion_valuesAttribute,
} from '../../../../models/db'
import {
    ConceptNodes,
    ConceptLinks,
    Modules,
    DefinitionValues,
    TimeseriesValues,
    LabelizedValues,
    SuggestionValues,
    Datasets,
} from '../../database'


export class ConceptBackend {
    public router: Router;

    constructor() {
        // Create public Router
        this.router = Router({mergeParams: true});

        // Init all end points of the Router
        this.router.route('/')
            .get(async (request: Request, response: Response) => {
                // Get flat results (Sequelize normally returns complex Instance objects
                // which are later parsed by express when calling response.json()
                const nodes = await ConceptNodes.findAll({raw: true});
                const links = await ConceptLinks.findAll({raw: true});

                // Promise.all() turns an array of Promises into actual values.
                // const enrichedConcepts = await Promise.all(
                //     // TODO: En fait je ne comprends même pas pourquoi il faut bind ici :D
                //     concepts.map(this.enrichConcept.bind(this))
                // )

                response.json({
                    nodes,
                    links,
                });
            })

        this.router.route('/:slug')
            .get(async (request: Request, response: Response) => {
                if (request.params.slug) {
                    const concept = await this.fetch(request.params.slug)

                    const enrichedConcept = concept ? await this.enrichConcept(concept) : concept

                    response.json(enrichedConcept)
                } else {
                    response.status(400)
                    response.json({
                        error: 'Concept slug parameter absent from query.'
                    })
                }
            })

        this.router.route('/bulk')
            .post(async (request: Request, response: Response) => {
                const results = []
                for (let slug in request.body.slugs) {
                    results.push(await this.fetch(slug))
                }

                response.json(results)
            })
    }

    private async fetch(slug: string): Promise<any> {
        return await ConceptNodes.findOne({
            where: {
                slug: slug,
            },
            raw: true,
        });
    }

    private async enrichConcept(concept: concept_nodesAttribute): Promise<any> {
        concept = await this.getModules(concept)

        return concept
    }

    private async getModules(concept: concept_nodesAttribute): Promise<any> {
        let modules = await Modules.findAll({
            where: {
                conceptNodeId: concept.id
            },
            raw: true,
        })

        modules = await Promise.all(
            modules.map(this.enrichModule.bind(this))
        )

        return {
            ...concept,
            modules,
        }
    }

    private async enrichModule(m: modulesAttribute): Promise<any> {
        let data: any = []

        for (let data_identifier of m.data_identifiers) {
            switch (m.type) {
                case 'definition':
                    data.push(await DefinitionValues.findOne({
                        where: {
                            slug: data_identifier
                        },
                        raw: true,
                    }))
                    break
                case 'timeseries':
                    var info = await Datasets.findOne({
                        where: {
                            name: data_identifier
                        },
                        raw: true,
                    })

                    var values = await TimeseriesValues.findAll({
                        where: {
                            dataset: data_identifier
                        },
                        raw: true,
                    })

                    data.push({
                        info,
                        values,
                    })
                    break
                case 'doughnut':
                    var info = await Datasets.findOne({
                        where: {
                            name: data_identifier
                        },
                        raw: true,
                    })

                    var values = await LabelizedValues.findAll({
                        where: {
                            dataset: data_identifier
                        },
                        raw: true,
                    })

                    data.push({
                        info,
                        values,
                    })
                    break
                default:
                    break
            }
        }

        return {
            ...m,
            data,
        }
    }
}
