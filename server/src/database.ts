// This file creates a unique Sequelize instance used by the backend.
// It also imports models and links them to this unique instance of Sequelize.
// These imports are used later on in the code where the various routers and
// end points of the API are defined (that is to say, for now, mainly in ./resources).

import * as Sequelize from 'sequelize'
import * as path from 'path'
import config from './../../config'
import { 
    concept_nodesAttribute,
    concept_linksAttribute,
    concept_suggested_linksAttribute,
    concept_nodesInstance,
    concept_linksInstance,
    concept_suggested_linksInstance

} from '../../models/db';
const DB_CONFIG = config('database')

// Start a new Sequelize instance which will be globally used
// over the backend.
export const sequelize = new Sequelize(
    DB_CONFIG.database,
    DB_CONFIG.username,
    DB_CONFIG.password,
    {
        host: DB_CONFIG.host,
        dialect: DB_CONFIG.dialect
    }
);

// Import automatically generated models.

export const ConceptNodes = sequelize.import<concept_nodesAttribute, concept_nodesInstance>(__dirname + '/../../models/concept_nodes')
export const ConceptLinks = sequelize.import<concept_linksAttribute, concept_linksInstance>(__dirname + '/../../models/concept_links')
export const ConceptSuggestedLinks = sequelize.import<concept_suggested_linksAttribute, concept_suggested_linksInstance>(__dirname + '/../../models/concept_suggested_links')
export const Modules = sequelize.import(__dirname + '/../../models/modules')
export const DefinitionValues = sequelize.import(__dirname + '/../../models/definition_values')
export const TimeseriesValues = sequelize.import(__dirname + '/../../models/timeseries_values')
export const LabelizedValues = sequelize.import(__dirname + '/../../models/labelized_values')
export const SuggestionValues = sequelize.import(__dirname + '/../../models/suggestion_values')
export const Datasets = sequelize.import(__dirname + '/../../models/datasets')
