exports.dataset = {
    info: {
        name: 'chomage_pole_emploi_2',
        description: 'Evolution dans le temps du nombre de chômeurs en France au sens de Pole Emploi.',
        source: 'Pole Emploi',
        link: 'http://statistiques.pole-emploi.org/stmt/selo?fa=M&lb=0&pp=-201707',
        unit: 'P',
        power: 3,
    },
    timeseries_values: [
        {
            timestamp: new Date (2015, 0, 1, 0, 0, 0),
            value: 3489.600,
        }, {
            timestamp: new Date (2015, 3, 1, 0, 0, 0),
            value: 3535.400,
        }, {
            timestamp: new Date (2015, 6, 1, 0, 0, 0),
            value: 3550.200,
        }, {
            timestamp: new Date (2015, 9, 1, 0, 0, 0),
            value: 3579.500,
        }, {
            timestamp: new Date (2016, 0, 1, 0, 0, 0),
            value: 3557.200,
        }, {
            timestamp: new Date (2016, 3, 1, 0, 0, 0),
            value: 3518.200,
        }, {
            timestamp: new Date (2016, 6, 1, 0, 0, 0),
            value: 3514.600,
        }, {
            timestamp: new Date (2016, 9, 1, 0, 0, 0),
            value: 3477.000,
        }, {
            timestamp: new Date (2017, 0, 1, 0, 0, 0),
            value: 3467.900,
        }, {
            timestamp: new Date (2017, 3, 1, 0, 0, 0),
            value: 3471.800,
        }
    ]
}
