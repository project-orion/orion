import {
    Button,
    Spinner,
} from '@blueprintjs/core'
import * as _ from 'lodash'
import * as React from 'react'
import {Route} from 'react-router'
import {BrowserRouter} from 'react-router-dom'
import {connect} from 'react-redux'

import {
    AppState,
} from '../types'
import * as actions from '../actions'

import {ConceptBar} from '../components/utils/concept_bar'
import {ConceptNav} from '../components/utils/concept_nav'
import {NavBar} from '../components/utils/navbar'
import {ConceptsPresentation} from './concepts_presentation'

const mapReduxStateToReactProps = (state : AppState): AppState => {
    return state
}

function reduxify(mapReduxStateToReactProps: any, mapDispatchToProps?: any, mergeProps?: any, options?: any) {
    return (target: any) => (connect(mapReduxStateToReactProps, mapDispatchToProps, mergeProps, options)(target) as any)
}

@reduxify(mapReduxStateToReactProps)
export class App extends React.Component<AppState, any> {
    constructor(props: AppState) {
        super(props)
    }

    sendFetchAction (slug?: string) {
        this.props.dispatch(actions.fetchConcept('concepts/' + slug, 'cp1'))
    }

    // When page is done loading, fetch concept graph from backend
    componentDidMount() {
        this.props.dispatch(actions.fetchConceptGraph('concepts/', 'app'))
    }

    render () {
        let {conceptGraph} = this.props

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

        return (
            <div>
                <NavBar
                    right_text={navbar_button}
                />

                <ConceptNav
                    nodes={conceptGraph.nodes}
                    links={conceptGraph.links}
                />

                <BrowserRouter>
                    <Route path='/' exact={true} render={routeProps => <ConceptsPresentation containerId={'cp1'} loading={0} />} />
                </BrowserRouter>
            </div>
        )
    }
}
