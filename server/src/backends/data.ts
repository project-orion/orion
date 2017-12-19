import {Router, Request, Response} from 'express'

import {
    concept_nodesAttribute,
    modulesAttribute,
    definition_valuesAttribute,
    timeseries_valuesAttribute,
    labelized_valuesAttribute,
    suggestion_valuesAttribute,
} from './../../../models/db'
import {
    ConceptNodes,
    ConceptLinks,
    Modules,
    DefinitionValues,
    TimeseriesValues,
    LabelizedValues,
    SuggestionValues,
    Datasets,
} from './../database'


export class DataBackend {
    public router: Router;

    constructor() {
        // Create public Router
        this.router = Router({mergeParams: true});

        // Init all end points of the Router


        this.router.route('/labelizedvalues/:dataset')
            .get(async (request: Request, response: Response) => {
                if (request.params.dataset) {
                    const data = await LabelizedValues.findAll({
                      where: {
                          dataset: request.params.dataset,
                      },
                      raw: true,
                    })

                    response.json(data)
                } else {
                    response.status(400)
                    response.json({
                        error: 'Dataset id absent from query.'
                    })
                }
            })

        this.router.route('/timeseries/:dataset')
            .get(async (request: Request, response: Response) => {
                if (request.params.dataset) {
                    const data = await TimeseriesValues.findAll({
                         where: {
                             dataset: request.params.dataset,
                         },
                         raw: true,
                    })

                    response.json(data)
                } else {
                    response.status(400)
                    response.json({
                        error: 'Dataset id absent from query.'
                    })
                }
            })
    }
}
