const path = require('path')

const Sequelize = require('sequelize')
const ENV = process.env.NODE_ENV || 'development';
const DB_CONFIG = require(path.join(__dirname, '/../config/database.json'))[ENV]

const possibleModules = [
    'timeseries',
    'definition',
    'doughnut'
]

const possibleDatasets = [
    'timeseries',
    'labelized'
]

const possibleUnits = [
    'P',            //people
    'ME',           //money(euro)
    'MD',           //money(dollar)
    'TECO2'         //tonnes equivalent C02
]

const sequelize = new Sequelize(
    DB_CONFIG.database,
    DB_CONFIG.username,
    DB_CONFIG.password,
    {
        host: DB_CONFIG.host,
        dialect: DB_CONFIG.dialect
    }
)

const ConceptNodes = sequelize.define('concept_nodes', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: Sequelize.STRING,
    slug: Sequelize.STRING,
    rootConcept: Sequelize.BOOLEAN,
})

const ConceptLinks = sequelize.define('concept_links', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    slug_from: Sequelize.STRING,
    slug_to: Sequelize.STRING,
})

const ConceptSuggestedLinks = sequelize.define('concept_suggested_links', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    slug_from: Sequelize.STRING,
    slug_to: Sequelize.STRING,
})

const Module = sequelize.define('module', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    type: Sequelize.ENUM(...possibleModules),
    options: Sequelize.JSON,
    data_identifiers: Sequelize.ARRAY(Sequelize.STRING),
})

ConceptNodes.hasMany(Module)

const DefinitionValues = sequelize.define('definition_values', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    text: Sequelize.TEXT,
    source: Sequelize.STRING,
    link: Sequelize.STRING,
    slug: Sequelize.STRING,
})

const TimeseriesValues = sequelize.define('timeseries_values', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    value: Sequelize.DOUBLE,
    timestamp: Sequelize.DATE, // which is a timestamp with timezone in Postgres
    dataset: Sequelize.STRING,
})

const SuggestionValues = sequelize.define('suggestion_values', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    concepts: Sequelize.ARRAY(Sequelize.STRING),
    slug: Sequelize.STRING,
})

const LabelizedValues = sequelize.define('labelized_values', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    value: Sequelize.DOUBLE,
    label: Sequelize.STRING,
    dataset: Sequelize.STRING,
})

const Dataset = sequelize.define('datasets', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    type: Sequelize.ENUM(...possibleDatasets),
    name: Sequelize.STRING,
    source: Sequelize.STRING,
    link: Sequelize.STRING,
    unit: Sequelize.ENUM(...possibleUnits),
    power: Sequelize.INTEGER,
    description: Sequelize.STRING,
    title: Sequelize.STRING,
})

exports.sequelize = sequelize
exports.ConceptNodes = ConceptNodes
exports.ConceptLinks = ConceptLinks
exports.ConceptSuggestedLinks = ConceptSuggestedLinks
exports.Module = Module
exports.DefinitionValues = DefinitionValues
exports.TimeseriesValues = TimeseriesValues
exports.SuggestionValues = SuggestionValues
exports.LabelizedValues = LabelizedValues
exports.Dataset = Dataset
