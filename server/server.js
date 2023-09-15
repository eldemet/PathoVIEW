/*******************************************************************
 *   server.js
 *******************************************************************/
import 'utilities-node/src/utilities/dotenv.js';
import idnEmail from 'ajv-formats-draft2019/formats/idn-email.js';
import {initialize} from 'utilities-node/src/framework.js';
import {isDirectory} from 'utilities-node/src/utilities/fs.js';
import {KeycloakAdminService} from './services/keycloak-admin.js';

const kcAdminService = new KeycloakAdminService();

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
        modelDiscriminator: {
            propertyName: 'type'
        },
        securedOperations: [
            {
                scheme: 'basicAdminPasswordScheme',
                operations: ['getConfig', 'reinitializeObjects', 'deleteObjects']
            },
            {
                scheme: 'keycloakScheme',
                operations: ['createObject', 'updateObject', 'deleteObject', 'getObjects', 'getObject', 'getObjectUiSchema', 'getCurrentWeather', 'getUsers', 'getRoles', 'getGroups']
            }
        ]
    },
    server: {
        port: 3002
    },
    database: {
        uniqueProperty: 'id',
        jsondbPath: '../data/db',
        jsondbReadOnly: false,
        schemaDirectory: 'api/v1/components/schemas',
        uploadDirectory: '../data/uploads',
        allowedUploadFileExtensions: ['jpg', 'jpeg', 'png', 'svg', 'wav', 'mp3'],
        customIdGeneratorFunction: 'api/v1/ngsi-id-generator.js',
        locales: ['de', 'en', 'bg', 'el', 'es']
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
    },
    security: {
        adminPasswordFile: '../../credentials/adminPassword.txt'
    }
};

if (isDirectory('client')) {
    configAppDefaults.client = {
        directory: 'client',
        endpoint: ''
    };
}

if (process.env.PATHOWARE_NORTHBOUND_API && process.env.PATHOWARE_DATA_CONNECTOR_API) {
    openApi.paths.push('./api/v1/pathoware');
}

const configAdditionsSchemaPath = './api/v1/components/config-additions.yaml';

const additionalDbSchemas = {
    Alert: {$ref: 'node_modules/smart-data-models-alert/Alert/model.yaml#/Alert'},
    Device: {$ref: 'node_modules/smart-data-models-device/Device/model.yaml#/Device'},
    PointOfInterest: {$ref: 'node_modules/smart-data-models-point-of-interest/PointOfInterest/model.yaml#/PointOfInterest'}
};

const initializeAddOnsCallback = async(config) => {
    await kcAdminService.initialize(config);
};

const shutdownAddOnsCallback = async() => {
    await kcAdminService.close();
};

initialize({openApi, configAppDefaults, configAdditionsSchemaPath, additionalDbSchemas, initializeAddOnsCallback, shutdownAddOnsCallback});
