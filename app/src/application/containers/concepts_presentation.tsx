import {
    Button,
    Spinner,
} from '@blueprintjs/core'
import * as moment from 'moment'
import * as _ from 'lodash'
import * as React from 'react'
import {connect} from 'react-redux'

import {
    AppState,
    Module,
    Concept,
    ContainerState,
} from '../types'
import * as actions from '../actions'

import {TimeseriesChart} from '../components/modules/timeseries_chart'
import {HistogramChart} from '../components/modules/histogram_chart'
import {DoughnutChart} from '../components/modules/labelized_chart'
import {Definition} from '../components/modules/definition'
import {Suggestion} from '../components/modules/suggestion'

type Props = ContainerState

const mapReduxStateToReactProps = (state : AppState, componentProps: Props): ContainerState => {
    return {
        ...state.containers[componentProps.containerId],
    }
}

function reduxify(mapReduxStateToReactProps: any, mapDispatchToProps?: any, mergeProps?: any, options?: any) {
    return (target: any) => (connect(mapReduxStateToReactProps, mapDispatchToProps, mergeProps, options)(target) as any)
}

@reduxify(mapReduxStateToReactProps)
export class ConceptsPresentation extends React.Component<Props, any> {
    constructor(props: any) {
        super(props)
        this.state = {
            dimensions: {
                width: 0,
                height: 0,
            },
        }
    }

    sendFetchAction (slug?: string) {
        const end_point = 'concepts/' + slug
        this.props.dispatch(actions.fetchConcept(end_point, this.props.containerId))
    }

    associatedReactModule (m: Module, index: number, loadedTime: number) : any {
        const key = loadedTime.toString() + '-' + index.toString()
        switch (m.type) {
            case 'definition':
                return <Definition
                        key={key}
                        text={m.data.text}
                        source={m.data.source}
                        link={m.data.link}
                    />
            case 'timeseries':
                return <HistogramChart
                        key={key}
                        chartjs_datasets={m.data.chartjs_datasets}
                        sources={m.data.sources}
                        options={m.options}
                    />
            case 'suggestions':
                return <Suggestion
                        key={key}
                        concepts={m.data_identifiers}
                        dispatch={this.props.dispatch}
                        actionToDispatch={actions.fetchConcept}
                        sendFetchAction={(slug: string) => {
                            this.props.dispatch(actions.fetchConcept('concepts/' + slug, this.props.containerId))
                        }}
                    />
            case 'doughnut':
                return <DoughnutChart
                        key={key}
                        data={m.data}
                    />
            default:
                return <div key={key}>{m.type}</div>
        }
    }

    render () {
        let {concepts, loading} = this.props

        const conceptWithModuleList = concepts.map((concept: Concept) =>
            <div
                key={concept.loadedTime}
                className={'block-2'}
            >
                <h3 className={'concept-header'}>
                    {concept.attributes.name}
                </h3>
                <h5 className={'concept-loadedtime'}>
                    {moment.unix(concept.loadedTime / 1000).format('MM/DD/YYYY HH:mm:ss')}
                </h5>

                <div className={'flex-box'}>
                    {
                        concept.attributes.modules.map((m: Module, index: number) =>
                            this.associatedReactModule(m, index, concept.loadedTime)
                        )
                    }
                </div>
            </div>
        )

        return (
            <div>
                <div className={'block-1'}>
                    {conceptWithModuleList}
                </div>
            </div>
        )
    }
}
