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

import {SunburstModule} from './../../components/modules/sunburst'

const colorScheme = ['#2965CC', '#29A634', '#D99E0B', '#D13913', '#8F398F', '#00B3A4', '#DB2C6F', '#9BBF30', '#96622D', '#7157D9']

const mapReduxStateToReactProps = (state : appState): appState => {
    return state
}

function reduxify(mapReduxStateToReactProps: any, mapDispatchToProps?: any, mergeProps?: any, options?: any) {
    return (target: any) => (connect(mapReduxStateToReactProps, mapDispatchToProps, mergeProps, options)(target) as any)
}

@reduxify(mapReduxStateToReactProps)
export class PLF extends React.Component<appState, any> {
    constructor(props: appState) {
        super(props)
    }

    sendFetchAction (slug?: string) {
        this.props.dispatch(actions.fetchConcept('concepts/' + slug, 'cp1'))
    }

    // When page is done loading, fetch concept graph from backend
    componentDidMount() {
        this.props.dispatch(actions.fetchConceptGraph('concepts/', 'plf'))
        this.props.dispatch(actions.testFetch({'plf/PLF.txt': {'arg':'plf/PLF.txt'}}, 'plf', 'http://localhost:3001/file/'))
        this.props.dispatch(actions.toggleNavPanel())
    }

    render () {
        let {conceptGraph} = this.props
        let data = this.props.containers['plf'].testData
        data = (data ? data['plf/PLF.txt'] : data)

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
                <div id={'app-container'}>
                    <SunburstModule
                        key={key}
                        data={data}
                        dimensions={{
                            height: window.innerHeight * 3 / 4,
                        }}
                        hideComplements={true}
                    />
                </div>
            </div>
        )
    }
}
