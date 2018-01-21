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

import {JOGraphModule} from './../../components/modules/jograph'

const colorScheme = ['#2965CC', '#29A634', '#D99E0B', '#D13913', '#8F398F', '#00B3A4', '#DB2C6F', '#9BBF30', '#96622D', '#7157D9']

const mapReduxStateToReactProps = (state : appState): appState => {
    return state
}

function reduxify(mapReduxStateToReactProps: any, mapDispatchToProps?: any, mergeProps?: any, options?: any) {
    return (target: any) => (connect(mapReduxStateToReactProps, mapDispatchToProps, mergeProps, options)(target) as any)
}

@reduxify(mapReduxStateToReactProps)
export class JOGraphView extends React.Component<appState, any> {
    constructor(props: appState) {
        super(props)
    }

    sendFetchAction (slug?: string) {
        this.props.dispatch(actions.fetchConcept('concepts/' + slug, 'cp1'))
    }

    // When page is done loading, fetch concept graph from backend
    componentDidMount() {
        this.props.dispatch(actions.testFetch({'articles': {'arg': 'article/_search/?size=1000', 'json': true}}, 'jographview', 'http://localhost:9200/'))
        this.props.dispatch(actions.toggleNavPanel())
    }

    render () {
        let data = this.props.containers['jographview'].testData
        return (
            <div>
                <NavBar
                    left_text={'Visualisation et documentation de données socio-économiques'}
                />

                <div id={'app-container'}>
                    <JOGraphModule
                        data={data}
                        dispatch={this.props.dispatch}
                        tfidf={false}
                        cid={null}
                    />
                </div>
            </div>
        )
    }
}
