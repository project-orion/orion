"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ENV = process.env.NODE_ENV || "development";
const path = require("path");


const secretContext = require.context('./../../config/secret/', false, /\.json?$/)
const publicContext = require.context('./../../config/', false, /\.json?$/)

/**
    Accesses the proper config file.
    Check for config under /config/secret/config.json
*/
function properConfig(configName) {
    const secretInclude = secretContext.keys().filter((key) => key.includes(configName + '.json'))[0]
    if(secretContext(secretInclude)[ENV]) {
        return secretContext(secretInclude)[ENV]

    } else {
        const publicInclude = publicContext.keys().filter((key) => key.includes(configName + '.json'))[0]
        return publicContext(publicInclude)[ENV]
    }
}


exports.default = properConfig;
