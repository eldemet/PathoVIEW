'use strict';
/*******************************************************************
 *   server.js
 *******************************************************************/
global.__basedir = __dirname;
const framework = require('utilities-node/src/framework');
const fs = require('fs');

const openApi = {
    apiDoc: {
        openapi: '3.0.2',
        info: {
            version: '1.0.0',
            title: 'PathoVIEW API'
        },
        paths: {},
        servers: [
            {url: '/api/v1'}
        ]
    },
    paths: [
        './node_modules/utilities-node/src/paths/model',
        './node_modules/utilities-node/src/paths/config'
    ],
    externalSchemas: {},
    'x-express-openapi-schema-extension': './api/v1/components/x-express-openapi-schema-extension.yaml'
};

const configAppDefaults = {
    capabilities: {
        database: 'jsondb', //none, 'mongodb'
        swaggerUi: true,
        accessControlCheckerMiddleware: true,
        notifications: 'sse'
    },
    server: {
        port: '3002'
    },
    database: {
        uniqueProperty: '_id',
        jsondbPath: '../data/db',
        jsondbReadOnly: false,
        uploadDirectory: '../data/uploads'
    }
};

if (fs.existsSync('client')) {
    configAppDefaults.client = {
        directory: 'client',
        endpoint: 'client'
    };
}

const additionalDbSchemas = {
    Alert: {$ref: 'node_modules/smart-data-models-alert/Alert/model.yaml#/Alert'},
    Anomaly: {$ref: 'node_modules/smart-data-models-alert/Anomaly/model.yaml#/Anomaly'},
    Asset: {$ref: 'node_modules/smart-data-models-risk-management/Asset/model.yaml#/Asset'},
    CyberAnalysis: {$ref: 'node_modules/smart-data-models-risk-management/CyberAnalysis/model.yaml#/CyberAnalysis'},
    Exposure: {$ref: 'node_modules/smart-data-models-risk-management/Exposure/model.yaml#/Exposure'},
    GISData: {$ref: 'node_modules/smart-data-models-risk-management/GISData/model.yaml#/GISData'},
    Hazard: {$ref: 'node_modules/smart-data-models-risk-management/Hazard/model.yaml#/Hazard'},
    Measure: {$ref: 'node_modules/smart-data-models-risk-management/Measure/model.yaml#/Measure'},
    Mitigation: {$ref: 'node_modules/smart-data-models-risk-management/Mitigation/model.yaml#/Mitigation'},
    NetworkServiceAlert: {$ref: 'node_modules/smart-data-models-risk-management/NetworkServiceAlert/model.yaml#/NetworkServiceAlert'},
    Risk: {$ref: 'node_modules/smart-data-models-risk-management/Risk/model.yaml#/Risk'},
    Vulnerability: {$ref: 'node_modules/smart-data-models-risk-management/Vulnerability/model.yaml#/Vulnerability'},
    PointOfInterest: {$ref: 'node_modules/smart-data-models-point-of-interest/PointOfInterest/model.yaml#/PointOfInterest'},
    WaterQualityObserved: {$ref: 'node_modules/smart-data-models-water-quality/WaterQualityObserved/model.yaml#/WaterQualityObserved'}
    // SmartPointOfInteraction: {$ref: 'node_modules/smart-data-models-point-of-interaction/SmartPointOfInteraction/model.yaml#/SmartPointOfInteraction'},
    // SmartSpot: {$ref: 'node_modules/smart-data-models-point-of-interaction/SmartSpot/model.yaml#/SmartSpot'},
    // Blower: {$ref: 'node_modules/smart-data-models-waste-water/Blower/model.yaml#/Blower'},
    // OffGasStack: {$ref: 'node_modules/smart-data-models-waste-water/OffGasStack/model.yaml#/OffGasStack'},
    // WasteWaterJunction: {$ref: 'node_modules/smart-data-models-waste-water/WasteWaterJunction/model.yaml#/WasteWaterJunction'},
    // WasteWaterTank: {$ref: 'node_modules/smart-data-models-waste-water/WasteWaterTank/model.yaml#/WasteWaterTank'},
};

framework.initialize({openApi, configAppDefaults, additionalDbSchemas});
