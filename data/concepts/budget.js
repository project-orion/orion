exports.node = {
    name: 'Budget',
    modules: [
        {
            type: 'definition',
            data_identifiers: ['budget'],
          },{
            type: 'doughnut',
            data_identifiers: ['plf_2017'],
        }
    ]
}

exports.links = [
    'etat'
]
