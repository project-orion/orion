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
} from '../types'
import * as actions from '../actions'

import {NavPanel} from '../components/utils/navPanel'
import {NavBar} from '../components/utils/navBar'
import {ConceptsPresentation} from './conceptsPresentation'

import {SunburstModule} from '../components/modules/sunburst'

const colorScheme = ["#2965CC", "#29A634", "#D99E0B", "#D13913", "#8F398F", "#00B3A4", "#DB2C6F", "#9BBF30", "#96622D", "#7157D9"]

const mapReduxStateToReactProps = (state : appState): appState => {
    return state
}

function reduxify(mapReduxStateToReactProps: any, mapDispatchToProps?: any, mergeProps?: any, options?: any) {
    return (target: any) => (connect(mapReduxStateToReactProps, mapDispatchToProps, mergeProps, options)(target) as any)
}

@reduxify(mapReduxStateToReactProps)
export class Test extends React.Component<appState, any> {
    constructor(props: appState) {
        super(props)
    }

    sendFetchAction (slug?: string) {
        this.props.dispatch(actions.fetchConcept('concepts/' + slug, 'cp1'))
    }

    // When page is done loading, fetch concept graph from backend
    componentDidMount() {
        this.props.dispatch(actions.fetchConceptGraph('concepts/', 'test'))
        this.props.dispatch(actions.testFetch(['plf/PLFNomenclature.txt'], 'test', 'http://localhost:31338/'))
        this.props.dispatch(actions.toggleNavPanel())
    }

    render () {
        let {conceptGraph} = this.props
        let data = this.props.containers['test'].testData
        console.log(data)
        data = (data ? data['plf/PLFNomenclature.txt'] : data)

        let loading = false

        let spinner = loading ?
            <span className={'vertical-center'}>
                <Spinner className={'pt-small'}/>
                <span className={'pt-navbar-divider'}></span>
            </span> : null

        const navbar_button = (
            <div className={'vertical-center'}>
                {spinner}
                <Button
                    className={'pt-minimal'}
                    onClick={() => this.sendFetchAction('chomage')}
                    text={'Send Fetch Request'}
                />
            </div>
        )

        const classToggled = (this.props.toggled) ? ' toggled' : ''

        const key = 'Abracadabra'

        return (
            <div>
                <NavBar
                    left_text={'Visualisation et documentation de données socio-politiques'}
                />

                <div id={'app-container'}>
                    <div
                        id={'concept-nav-panel'}
                        className={classToggled}
                    >
                        <NavPanel
                            nodes={conceptGraph.nodes}
                            graph={conceptGraph.graph}
                            graphNodes={conceptGraph.graphNodes}
                            selectedRoot={conceptGraph.selectedRoot}
                            selectedNode={conceptGraph.selectedNode}
                            dispatch={this.props.dispatch}
                            toggled={this.props.toggled}
                            displayedNode={conceptGraph.displayedNode}
                            displayedSlugs={conceptGraph.displayedSlugs}
                        />
                    </div>
                    <div className={'left-of-panel' + classToggled}>
                        <div>
                            <div className={'block-1'}>
                                <div
                                    key={'key1'}
                                    className={'left-of-panel block-2'}
                                >
                                    <h3 className={'concept-header'}>
                                        {'conceptName'}
                                    </h3>
                                    <h5 className={'concept-loadedtime'}>
                                        {'loadedTime'}
                                    </h5>

                                    <div className={'flex-box'}>
                                        <SunburstModule
                                            key={key}
                                            data={data}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
