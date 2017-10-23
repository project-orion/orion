exports.dataset = {
    info: {
        name: 'chomage_insee_2',
        description: 'Evolution dans le temps du nombre de chômeurs en France au sens du BIT.',
        source: 'INSEE',
        link: 'https://www.insee.fr/fr/statistiques/fichier/2966612/Chomage-T2%202017.zip',
        unit: 'P',
        power: 3,
    },
    timeseries_values: [
        {
            timestamp: new Date(2015, 0, 1, 0, 0, 0),
            value: 3034,
        }, {
            timestamp: new Date(2015, 3, 1, 0, 0, 0),
            value: 3088,
        }, {
            timestamp: new Date(2015, 6, 1, 0, 0, 0),
            value: 3079,
        }, {
            timestamp: new Date(2015, 9, 1, 0, 0, 0),
            value: 3007,
        }, {
            timestamp: new Date(2016, 0, 1, 0, 0, 0),
            value: 3016,
        }, {
            timestamp: new Date(2016, 3, 1, 0, 0, 0),
            value: 2951,
        }, {
            timestamp: new Date(2016, 6, 1, 0, 0, 0),
            value: 2959,
        }, {
            timestamp: new Date(2016, 9, 1, 0, 0, 0),
            value: 2951,
        }, {
            timestamp: new Date(2017, 0, 1, 0, 0, 0),
            value: 2832,
        }, {
            timestamp: new Date(2017, 3, 1, 0, 0, 0),
            value: 2812,
        }
    ]
}
