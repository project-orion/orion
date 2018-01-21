import * as React from 'react'
import Measure from 'react-measure'
import {Route} from 'react-router'
import {BrowserRouter} from 'react-router-dom'
import {connect} from 'react-redux'

import {
    appState,
} from './../../types'
import * as actions from './../../actions'

import {JOGraph} from './../d3Blocks/joGraph'

interface Props {
    data: any,
    dispatch: any,
    tfidf: boolean,
    cid: string,
}

interface State {
    dimensions: {
        width: number,
        height: number,
    }
}

export class JOGraphModule extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            dimensions: {
                width: 0,
                height: 0,
            }
        }
    }

    render () {
        let data = this.props.data

        return (
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
                                <JOGraph
                                    data={data}
                                    dispatch={this.props.dispatch}
                                    version={this.state.dimensions.width}
                                    dimensions={{
                                        width: window.innerWidth,
                                        height: window.innerHeight,
                                    }}
                                    tfidf={this.props.tfidf}
                                    cid={this.props.cid}
                                />
                            </div>
                    }
                </Measure>
            </div>
        )
    }
}
