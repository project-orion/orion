exports.node = {
    name: 'Chomage',
    modules: [
        {
            type: 'definition',
            data_identifiers: ['chomage_bit'],
        }, {
            type: 'definition',
            data_identifiers: ['chomage_pole_emploi'],
        }, {
            type: 'timeseries',
            data_identifiers: ['chomage_insee_2', 'chomage_pole_emploi_2'],
            options: {
                relativisable: true,
                data_identifiers: ['population_totale']
            },
        }, {
            type: 'suggestions',
            data_identifiers: ['apprenti','categories-du-chomage'],
        }
    ]
}

exports.links = [
    'emploi'
]
