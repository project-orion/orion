import * as _ from 'lodash'
import * as React from 'react'
import {Scatter} from 'react-chartjs-2'

import {
    Module,
} from '../../types'

interface Props {
    options?: any,
    chartjs_datasets?: any,
    sources?: any,
}

const colorScheme = ["#FFE39F", "#ABC4A2", "#6B9FA1", "#3E769E", "#1F4B99"]

export function TimeseriesValuesReducer(m: Module): any {
    let i = 0
    let colors: any = {}

    const sources = _.map(m.data, (dataset: any, key: number) => {
        return dataset.info
    })

    const datasets = _.map(m.data, (dataset: any, key: number) => {
        i++
        const color = colorScheme[i % colorScheme.length]
        colors[key] = color

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

export class TimeseriesChart extends React.Component<Props, any> {
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
                    <Scatter
                        data={chartjs_datasets}
                        // options={}
                    />
                </div>
            </div>
        )
    }
}
