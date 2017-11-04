import * as _ from 'lodash'
import * as React from 'react'
import Measure from 'react-measure'
import {
    Button,
} from '@blueprintjs/core'

import {ConceptGraph} from '../d3Blocks/conceptGraph'
import {ConceptNav} from '../d3Blocks/conceptNav'
import * as actions from '../../actions'
import {Concept} from '../../types'

interface Props {
    nodes: any,
    links: any,
    graph: any,
    dispatch: any,
    toggled: boolean,
    selectedConceptNode: any,
}

interface State {
    searchedConcept?: string,
    dimensions: any,
}

export class NavPanel extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)


        
        this.state = {
            dimensions: {
                width: 0,
                height: 0,
            },
        }
    }

    updateState(event: any) {
        this.setState({
            ...this.state,
            searchedConcept: event.target.value,
        })
    }

    render() {
        const {nodes, links, toggled, selectedConceptNode} = this.props
        const {searchedConcept} = this.state
        const length = searchedConcept ? searchedConcept.length : 0

        return (
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
                            <Button
                                className={'pt-minimal'}
                                onClick={() => this.props.dispatch(actions.toggleNavPanel())}
                                text={'Toggle'}
                            />

                            <div className='pt-input-group concept_nav_bar'>
                                <span className={'pt-icon pt-icon-search'}></span>
                                <input
                                    className={'pt-input'}
                                    placeholder={'Concept (ex: Chômage)'}
                                    dir='auto'
                                    value={searchedConcept}
                                    onChange={this.updateState.bind(this)}
                                />
                            </div>

                            <div className={(toggled) ? 'hide' : ''}>
                                <ConceptNav
                                    dimensions={{
                                        width: this.state.dimensions.width,
                                        height: window.innerHeight / 2,
                                    }}
                                    graph={_.cloneDeep(this.props.graph)}
                                    nodes={_.cloneDeep(nodes)}
                                    links={_.cloneDeep(links)}
                                    selectedConceptNode={selectedConceptNode}
                                    displayedNodes={[selectedConceptNode]}
                                />
                            </div>

                            <div className={(!toggled) ? 'hide' : ''}>
                                <ConceptGraph
                                    version={nodes.length + this.state.dimensions.width + length}
                                    searchedConcept={searchedConcept}
                                    nodes={_.cloneDeep(nodes)}
                                    links={_.cloneDeep(links)}
                                    labels={_.cloneDeep(nodes)}
                                    dimensions={{
                                        width: this.state.dimensions.width,
                                        height: window.innerHeight / 2,
                                    }}
                                />
                            </div>
                        </div>
                }
            </Measure>
        )
    }
}
