import * as _ from 'lodash'
import * as React from 'react'
import {Doughnut} from 'react-chartjs-2'

import {
    module,
} from '../../types'

interface Props {
    title?: string,
    data: any,
    options?: any,
}

const colorScheme = ["#2965CC", "#29A634", "#D99E0B", "#D13913", "#8F398F", "#00B3A4", "#DB2C6F", "#9BBF30", "#96622D", "#7157D9"]

export function LabelizedValuesReducer(m: module): any {
    let i = 0
    let colors: string[] = []
    let labels: string[] = []
    let data: number[] = []

    let datasets = _.map(m.data, (dataset: any, key: string) => {
        _.each(_.orderBy(dataset.values, ['value'], ['desc']), (value: any) => {
            i++
            labels.push(value.label)
            colors.push(colorScheme[i % colorScheme.length])
            data.push(value.value)
        })

        return {
            data: data,
            backgroundColor: colors,
            label: key,
            borderWidth: 1,
        }
    })

    return {
            concept : {
                ...m,
                options: {
                    ...m.options,
                    colors,
                    },
                },
            newDataset : {
                datasets,
                labels,
                },
    }
}

export class DoughnutChart extends React.Component<Props, any> {
    render () {
        var {title, data, options} = this.props

        return (
            <div
                className={'block-3'}
                style={{flexGrow: 1}}
            >
                <Doughnut
                    data={data}
                    options={options}
                />
            </div>
        )
    }
}
