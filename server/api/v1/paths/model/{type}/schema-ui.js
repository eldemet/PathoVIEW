'use strict';
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const yamljs = require('yamljs');
const jsonSchemaHelper = require('utilities-node/src/utilities/jsonSchema');
let logger = require('utilities-node/src/utilities/logger')(module);
let uiSchemas;

async function initializeUISchemas(schemaDirectory) {
    let uiSchemas = {};
    for (let file of fs.readdirSync(schemaDirectory)) {
        //ignore files other than .yaml or .json
        if (path.extname(file) === '.yaml' || path.extname(file) === '.yml' || path.extname(file) === '.json') {
            let ext = path.extname(file);
            let filename = _.upperFirst(_.camelCase(path.basename(file, ext)));
            let schema = ext === '.yaml' || path.extname(file) === '.yml' ? yamljs.load(path.join(schemaDirectory, file)) : require(path.join(schemaDirectory, file));
            try {
                schema = await jsonSchemaHelper.dereferenceAndMergeSchema(schema, schemaDirectory);
                uiSchemas[filename] = schema;
            } catch (error) {
                logger.debug(error.message);
            }
        }
    }
    return uiSchemas;
}

/**
 * @module paths/model/type/schema
 * @category paths
 */
module.exports = function(config, apiVersion) {

    let operations = {
        GET: logger.catchErrors(GET)
    };

    operations.GET['apiDoc'] = getObjectSchema[apiVersion];

    async function GET(req, res) {
        if (!uiSchemas) {
            uiSchemas = await initializeUISchemas(path.join(global.__basedir, 'api/v1/components/schemas'));
        }
        let schema = uiSchemas[_.upperFirst(_.camelCase(req.params.type))];
        res.validateAndSend(200, schema);
    }

    return operations;
};

const getObjectSchema = {
    '2.0': {
        summary: 'Returns object schema to the caller',
        operationId: 'getObjectSchema',
        parameters: [
            {
                $ref: '#/parameters/modelType'
            }
        ],
        responses: {
            200: {
                description: 'Success',
                schema: {
                    type: 'object'
                }
            },
            default: {
                $ref: '#/responses/Error'
            }
        }
    },
    '3.0.2': {
        summary: 'Returns object schema to the caller',
        operationId: 'getObjectSchema',
        parameters: [
            {
                $ref: '#/components/parameters/modelType'
            }
        ],
        responses: {
            200: {
                description: 'Success',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object'
                        }
                    }
                }
            },
            default: {
                $ref: '#/components/responses/Error'
            }
        }
    }
};
