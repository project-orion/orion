exports.node = {
    name: 'Emissions de CO2',
    modules: [
      {
          type: 'definition',
          data_identifiers: ['emission_co2'],
      }, {
          type: 'timeseries',
          data_identifiers: ['emission_co2_transport', 'emission_co2_agriculture', 'emission_co2_residentiel', 'emission_co2_dechet', 'emission_co2_energie', 'emission_co2_industrie'],
        }, {
            type: 'timeseries',
            data_identifiers: ['emission_co2_totale'],
          }
    ]
}

exports.links = [
    'pollution'
]
