import {
    Button,
    Spinner,
} from '@blueprintjs/core'
import * as React from 'react'
import {Route} from 'react-router'
import {BrowserRouter,Switch} from 'react-router-dom'

import {App} from './containers/app'
import {Test} from './containers/test'
import {PLF} from './containers/views/plf'
import {JO} from './containers/views/jo'
import {JOGraphView} from './containers/views/jograph'
import {JOTFIDFView} from './containers/views/jotfidf'
import {Dashboard} from './containers/views/dashboard'

const Routes = () => (
    <BrowserRouter>
        <Switch>
            <Route exact path='/' component={App}/>
            <Route path='/test' component={Test}/>
            <Route path='/plf' component={PLF}/>
            <Route path='/jo' component={JO}/>
            <Route path='/jograph' component={JOGraphView}/>
            <Route path='/jotfidf' component={JOTFIDFView}/>
            <Route path='/dashboard' component={Dashboard}/>
        </Switch>
    </BrowserRouter>
)

export default Routes
