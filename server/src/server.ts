import * as express from 'express'
import * as bodyParser from 'body-parser'

// Import the various backends of the application, each of which
// has a router that defines various end points.
import {ConceptBackend} from './backends/concepts/backend'
import {DataBackend} from './backends/data/backend'

const PORT = 3001

const allowCrossDomains = (req: express.Request, res: express.Response, next: () => void) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Content-Type', 'application/json')
    next()
}

// Create our backend server
const backend = express()
backend.use(bodyParser.json())
backend.use(allowCrossDomains)

// Link various routers
const conceptBackend = new ConceptBackend()
backend.use('/concepts', conceptBackend.router)

// Link various routers
const dataBackend = new DataBackend()
backend.use('/data', dataBackend.router)

// Start the backend
const server = backend.listen(PORT, () => {
    console.log('Orion server now listening on port ' + PORT + '.')
})

module.exports = server
