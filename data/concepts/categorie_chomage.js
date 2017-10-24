exports.node = {
    name: 'Catégories du chômage',
    modules: [
        {
            type: 'definition',
            data_identifiers: ['categorie_chomage'],
        }, {
            type: 'timeseries',
            data_identifiers: ['chomage_catA2', 'chomage_catB2', 'chomage_catC2','chomage_catD2', 'chomage_catE2'],
            options: {
                relativisable: true,
                data_identifiers: ['population_totale']
            },
        },
    ]
}

exports.links = [
    'chomage'
]
