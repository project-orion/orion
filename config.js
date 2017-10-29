"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ENV = process.env.NODE_ENV || "development";
const path = require("path");

/**
    Accesses the proper config file.
    Check for config under /config/secret/config.json
*/
function properConfig(configFile) {
    console.log(path.join(__dirname + "/secret/" + configFile + '.json'))
    const secretConfig = require(path.join(__dirname + "/config/secret/" + configFile + '.json'))[ENV];
    if (!secretConfig) {
        const simpleConfig = require(path.join(__dirname + "/config/" + configFile + '.json'))[ENV];
        return simpleConfig;
    }
    else {
        return secretConfig;
    }
}
exports.default = properConfig;
