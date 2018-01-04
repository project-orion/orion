"use strict"
Object.defineProperty(exports, '__esModule', { value: true })

const ENV = process.env.NODE_ENV || 'development'
const path = require('path')
const fs = require('fs')

/**
    Accesses the proper config file.
    Check for config under /config/secret/config.json
*/
function properConfig(configFile) {
    const secretPath = path.join(__dirname, 'config/secret', configFile)
    const publicPath = path.join(__dirname, 'config', configFile)
    if(fs.existsSync(secretPath + '.json')) {
        const secretConfig = require(secretPath)
        if(secretConfig[ENV]) {
            return secretConfig[ENV]
        }
    }

    if (fs.existsSync(publicPath + '.json')) {
        const publicConfig = require(publicPath)
        if (publicConfig[ENV]) {
            return publicConfig[ENV]
        } else {
            console.log("No configuration available for specified context")
        }
    }
}

exports.default = properConfig;
