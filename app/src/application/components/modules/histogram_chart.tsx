import * as _ from 'lodash'
import * as React from 'react'
import Measure from 'react-measure'

import {Histogram} from '../d3Blocks/histogram'

import {
    Module,
} from '../../types'

interface Props {
    options?: any,
    chartjs_datasets?: any,
    sources?: any,
}

interface State {
    dimensions: {
        width: number,
        height: number,
    }
}

const colorScheme = ["#2965CC", "#29A634", "#D99E0B", "#D13913", "#8F398F", "#00B3A4", "#DB2C6F", "#9BBF30", "#96622D", "#7157D9"]

export function TimeseriesValuesReducer(m: Module): any {
    let i = 0
    let colors: any = {}

    const sources = _.map(m.data, (dataset: any, key: number) => {
        return dataset.info
    })

    const datasets = _.map(m.data, (dataset: any, key: number) => {
        const color = colorScheme[i % colorScheme.length]
        colors[key] = color
        i++
        return {
            borderColor: color,
            label: dataset.info.name,
            fill: false,
            data: _.orderBy(_.map(dataset.values, (value: any) => {
                let d = new Date(value.timestamp)
                return {
                    x: d.getFullYear() + d.getMonth() / 12,
                    y: value.value,
                }
            }), 'x'),
        }
    })

    return {
        ...m,
        options: {
            ...m.options,
            colors,
        },
        data: {
            chartjs_datasets: {
                datasets,
            },
            sources,
        }
    }
}

export class HistogramChart extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            dimensions: {
                width:0,
                height: 0,
            }
        }
    }

    render () {
        var {chartjs_datasets, sources, options} = this.props
        const title = 'timeseries title'

        const source_list = _.map(sources, (v: any, k: any) => {
            return <li key={k}>
                <a href={v.link} style={{color: options.colors[k]}}>{v.name}</a>
            </li>
        })

        const descriptions = _.map(sources, (v: any, k: any) => {
            return <li key={k}>
                <span>
                    <h6 style={{color: options.colors[k]}}>{v.name} : </h6>
                    {v.title}
                </span>
            </li>
        })

        return (
            <div
                className={'block-3 timeseries_chart'}
                style={{flexGrow: 2}}
            >
                <span>
                    <h4>{title}</h4> - <h6>Source(s) :
                        <ul className={'inline-list'}>
                            {source_list}
                        </ul>
                    </h6>
                </span>
                {descriptions}
                <div>
                    <Measure
                        bounds
                        onResize={(contentRect: any) => {
                            this.setState({
                                dimensions: contentRect.bounds,
                            })
                        }}
                    >
                        {
                            ({ measureRef } : any) =>
                                <div
                                    ref={measureRef}
                                    style={{
                                        padding: 0
                                    }}
                                >
                                    <Histogram
                                        data={chartjs_datasets}
                                        dimensions={{
                                            width: this.state.dimensions.width,
                                            height: window.innerHeight / 2,
                                        }}
                                        padding={{
                                            top: 40,
                                            right: 40,
                                            bottom: 40,
                                            left: 60,
                                        }}
                                        version={this.state.dimensions.width}
                                        colors={colorScheme}
                                    />
                                </div>
                        }
                    </Measure>
                </div>
            </div>
        )
    }
}
