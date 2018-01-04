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
    sequelize,
    ConceptNodes,
    ConceptLinks,
    ConceptSuggestedLinks,
    Modules,
    DefinitionValues,
    TimeseriesValues,
    LabelizedValues,
    SuggestionValues,
    Datasets,
} from './../database'

const options = {
    raw: true,
    logging: false // Change this line if a verbose script is needed.
}

// TODO: Change hardcoded path to dynamic path. Maybe add a config file?
let FOLD = '/Users/alexis/orion/pipelines'

export class FileBackend {
    public router: Router

    constructor() {
        // Create public Router
        this.router = Router({mergeParams: true})

        this.router.route('/*')
            .get(async (request: Request, response: Response) => {
                let fileName = request.url
                // TODO: security (prevent filename from going backwards for instance)
                response.sendFile(FOLD + fileName)
            })
    }
}
