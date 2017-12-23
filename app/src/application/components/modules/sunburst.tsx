import * as _ from 'lodash'
import * as React from 'react'
import Measure from 'react-measure'

import {Sunburst} from '../d3Blocks/sunburst'

import {
    module,
} from '../../types'

interface Props {
    options?: any,
    chartjs_datasets?: any,
    sources?: any,
    data?: any,
}

interface State {
    dimensions: {
        width: number,
        height: number,
    }
}

const colorScheme = ["#2965CC", "#29A634", "#D99E0B", "#D13913", "#8F398F", "#00B3A4", "#DB2C6F", "#9BBF30", "#96622D", "#7157D9"]

export class SunburstModule extends React.Component<Props, State> {
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
        const title = 'Projet de Loi de Finance 2017'
        const {data} = this.props

        return (
            <div
                className={'block'}
                style={{flexGrow: 2}}
            >
                <span>
                    <h4>{title}</h4>
                </span>
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
                                    <Sunburst
                                        dimensions={{
                                            width: this.state.dimensions.width,
                                            height: window.innerHeight * 3 / 4,
                                            toolbox_width: 120,
                                            toolbox_height: 30,
                                        }}
                                        padding={{
                                            top: 5,
                                            right: 5,
                                            bottom: 5,
                                            left: 5,
                                        }}
                                        version={this.state.dimensions.width}
                                        colors={colorScheme}
                                        data={data}
                                    />
                                </div>
                        }
                    </Measure>
                </div>
            </div>
        )
    }
}
