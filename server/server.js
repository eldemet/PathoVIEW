'use strict';
/*******************************************************************
 *   server.js
 *******************************************************************/
global.__basedir = __dirname;
const framework = require('utilities-node/src/framework');
const fs = require('fs');
const idnEmail = require('ajv-formats-draft2019/formats/idn-email');
const kcAdminService = new (require('./services/keycloak-admin').KeycloakAdminService)();

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
    dependencies: {
        kcAdminService
    },
    paths: [
        './node_modules/utilities-node/src/paths/model',
        './node_modules/utilities-node/src/paths/config',
        './api/v1/paths'
    ],
    externalSchemas: {},
    customFormats: {
        'idn-email': idnEmail
    },
    'x-express-openapi-schema-extension': './api/v1/components/x-express-openapi-schema-extension.yaml'
};

const configAppDefaults = {
    capabilities: {
        database: 'jsondb', //none, 'mongodb'
        swaggerUi: true,
        accessControlCheckerMiddleware: true,
        keycloakMiddleware: true,
        notifications: 'sse'
    },
    api: {
        modelReinitializeObjects: true,
        modelDeleteObjects: true,
        securitySchemes: [
            {
                scheme: 'keycloakScheme',
                operations: ['getConfig', 'reinitializeObjects', 'deleteObjects', 'publishNotification'],
                scope: ['realm:admin']
            },
            {
                scheme: 'keycloakScheme',
                operations: ['createObject', 'updateObject', 'deleteObject', 'getObjects', 'getObject', 'subscribeNotification', 'getObjectUiSchema'],
                scope: ['realm:first_responder']
            }
        ]
    },
    server: {
        port: '3002'
    },
    database: {
        uniqueProperty: 'id',
        jsondbPath: '../data/db',
        jsondbReadOnly: false,
        schemaDirectory: 'api/v1/components/schemas',
        uploadDirectory: '../data/uploads',
        customIdGeneratorFunction: 'api/v1/ngsi-id-generator.js',
        locales: ['de', 'en']
    },
    keycloak: {
        store: 'session',
        schemeFlow: 'implicit',
        protocol: 'openid-connect'
    },
    keycloakConfig: {
        realm: 'pathocert',
        clientId: 'pathoview',
        authServerUrl: 'http://localhost:9990/auth/'
    },
    sessionMiddleware: {
        secret: 'unsafe secret'
    }
};

if (fs.existsSync('client')) {
    configAppDefaults.client = {
        directory: 'client',
        endpoint: 'client'
    };
}

const configAdditionsSchemaPath = './api/v1/components/config-additions.yaml';

const additionalDbSchemas = {
    Alert: {$ref: 'node_modules/smart-data-models-alert/Alert/model.yaml#/Alert'},
    Device: {$ref: 'node_modules/smart-data-models-device/Device/model.yaml#/Device'},
    PointOfInterest: {$ref: 'node_modules/smart-data-models-point-of-interest/PointOfInterest/model.yaml#/PointOfInterest'}
};

const initializeAddOnsCallback = async(app, configService) => {
    await kcAdminService.initialize(configService.config);
};

const shutdownAddOnsCallback = async() => {
    await kcAdminService.close();
};

framework.initialize({openApi, configAppDefaults, configAdditionsSchemaPath, additionalDbSchemas, initializeAddOnsCallback, shutdownAddOnsCallback});
