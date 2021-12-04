'use strict';
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const jsonSchemaHelper = require('utilities-node/src/utilities/jsonSchema');
const logger = require('utilities-node/src/utilities/logger')(module);
const {loadFile} = require('utilities-node/src/utilities/fs');

let uiSchemas;

async function initializeUISchemas(schemaDirectory) {
    let uiSchemas = {};
    for (let file of fs.readdirSync(schemaDirectory)) {
        //ignore files other than .yaml or .json
        const ext = path.extname(file).toLowerCase();
        if (ext === '.yaml' || ext === '.yml' || ext === '.json') {
            let filename = _.upperFirst(_.camelCase(path.basename(file, ext)));
            let schema = loadFile([schemaDirectory, file]);
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
module.exports = function(config, getApiDoc) {

    let operations = {
        GET: logger.catchErrors(GET)
    };

    operations.GET['apiDoc'] = getApiDoc(getObjectUiSchema);

    async function GET(req, res) {
        if (!uiSchemas) {
            uiSchemas = await initializeUISchemas(path.join(global.__basedir, 'api/v1/components/schemas'));
        }
        let schema = uiSchemas[_.upperFirst(_.camelCase(req.params.type))];
        res.validateAndSend(200, schema);
    }

    return operations;
};

const getObjectUiSchema = {
    'general': {
        summary: 'Returns object ui schema to the caller',
        operationId: 'getObjectUiSchema'
    },
    '2.0': {
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
