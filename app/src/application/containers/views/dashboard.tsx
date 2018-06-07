import {
    Button,
    Spinner,
} from '@blueprintjs/core'
import * as _ from 'lodash'
import * as React from 'react'
import Measure from 'react-measure'
import {Route} from 'react-router'
import {BrowserRouter} from 'react-router-dom'
import {connect} from 'react-redux'

import {
    appState,
} from './../../types'
import * as actions from './../../actions'

import {NavPanel} from './../../components/utils/navPanel'
import {NavBar} from './../../components/utils/navBar'
import {ConceptsPresentation} from './../conceptsPresentation'

import {TimeseriesChart} from './../../components/modules/timeseriesChart'
import {HistogramChart} from './../../components/modules/histogramChart'
import {SunburstModule} from './../../components/modules/sunburst'
import {Sunburst} from './../../components/d3Blocks/sunburst'

import './dashboard.less'

const colorScheme = ['#2965CC', '#29A634', '#D99E0B', '#D13913', '#8F398F', '#00B3A4', '#DB2C6F', '#9BBF30', '#96622D', '#7157D9']

const mapReduxStateToReactProps = (state : appState): appState => {
    return state
}

function reduxify(mapReduxStateToReactProps: any, mapDispatchToProps?: any, mergeProps?: any, options?: any) {
    return (target: any) => (connect(mapReduxStateToReactProps, mapDispatchToProps, mergeProps, options)(target) as any)
}

@reduxify(mapReduxStateToReactProps)
export class Dashboard extends React.Component<appState, any> {
    constructor(props: appState) {
        super(props)
    }

    sendFetchAction (slug?: string) {
        // this.props.dispatch(actions.fetchConcept('concepts/' + slug, 'cp1'))
    }

    // When page is done loading, fetch concept graph from backend
    componentDidMount() {
        this.props.dispatch(actions.fetchConceptGraph('concepts/', 'test'))
        this.props.dispatch(actions.testFetch({'plf/PLF.txt': {'arg':'plf/PLF.txt'}}, 'dashboard', 'http://localhost:3001/file/'))
        this.props.dispatch(actions.toggleNavPanel())
    }

    render () {
        let data = this.props.containers['dashboard'].testData
        let dataSunburst = (data ? data['plf/PLF.txt'] : data)

        let colors = ["#2965CC", "#29A634", "#D99E0B", "#D13913", "#8F398F", "#00B3A4", "#DB2C6F", "#9BBF30", "#96622D", "#7157D9"]

        let options = {
            colors,
        }

        let timeseriesData = {
            datasets:[
                {
                    label: '1',
                    fill: false,
                    data: [
                        {x: 1517684776, y: 12},
                        {x: 1518684776, y: 14},
                        {x: 1519684776, y: 20},
                        {x: 1520684776, y: 22},
                        {x: 1521684776, y: 19},
                        {x: 1522684776, y: 20},
                    ],
                },
                {
                    label: '2',
                    fill: false,
                    data: [
                        {x: 1517684776, y: 6},
                        {x: 1518684776, y: 9},
                        {x: 1519684776, y: 16},
                        {x: 1520684776, y: 16},
                        {x: 1521684776, y: 18},
                        {x: 1522684776, y: 24},
                    ],
                },
                {
                    label: '3',
                    fill: false,
                    data: [
                        {x: 1517684776, y: 7},
                        {x: 1518684776, y: 8},
                        {x: 1519684776, y: 9},
                        {x: 1520684776, y: 16},
                        {x: 1521684776, y: 24},
                        {x: 1522684776, y: 22},
                    ],
                },
            ]
        }

        let histogramData = {
            datasets:[
                {
                    label: '1',
                    fill: false,
                    data: [
                        {x: 1517684776, y: 12},
                        {x: 1518684776, y: 14},
                        {x: 1519684776, y: 20},
                        {x: 1520684776, y: 22},
                        {x: 1521684776, y: 19},
                    ],
                },
                {
                    label: '2',
                    fill: false,
                    data: [
                        {x: 1517684776, y: 6},
                        {x: 1518684776, y: 9},
                        {x: 1519684776, y: 16},
                        {x: 1520684776, y: 16},
                        {x: 1521684776, y: 18},
                    ],
                },
                {
                    label: '3',
                    fill: false,
                    data: [
                        {x: 1517684776, y: 7},
                        {x: 1518684776, y: 8},
                        {x: 1519684776, y: 9},
                        {x: 1520684776, y: 16},
                        {x: 1521684776, y: 24},
                    ],
                },
            ]
        }

        return (
            <div>
                <div id={'app-container'}>
                    <div className='flex-box'>
                        <div style={{ flexGrow: 5, }} >
                            <iframe
                                src='http://localhost:31338/'
                                width='100%'
                                height='100%'
                            ></iframe>
                        </div>
                        <div style={{ flexGrow: 3, }} >

                            <TimeseriesChart
                                key={'bis'}
                                chartjs_datasets={timeseriesData}
                                sources={['1', '2', '3']}
                                options={options}
                                hideComplements={true}
                            />
                        </div>
                    </div>
                    <div className='flex-box'>
                        <div style={{ flexGrow: 1, }} >
                            <HistogramChart
                                key={'lamour'}
                                chartjs_datasets={histogramData}
                                sources={['1', '2', '3']}
                                options={options}
                                hideComplements={true}
                            />
                        </div>
                        <div style={{ flexGrow: 4, }} >
                            <SunburstModule
                                key={'Abracadabra'}
                                data={dataSunburst}
                                dimensions={{
                                    height: window.innerHeight / 3,
                                }}
                                hideComplements={true}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
