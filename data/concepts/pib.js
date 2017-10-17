exports.node = {
    name: 'PIB (produit intérieur brut)',
    modules: [
      {
        type: 'doughnut',
        data_identifiers: ['pib_world_2016'],
      }
    ]
}

exports.links = [
    'indicateurs-economiques'
]
