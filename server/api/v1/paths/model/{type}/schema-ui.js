import fs from 'node:fs';
import path from 'node:path';
import _ from 'lodash';
import {dereferenceAndMergeSchema} from 'utilities-node/src/utilities/jsonSchema.js';
import {loadFile} from 'utilities-node/src/utilities/fs.js';
import Logger from 'utilities-node/src/utilities/logger.js';

const logger = new Logger(import.meta);

let uiSchemas;

/**
 * @param {String} schemaDirectory
 * @returns {Promise<{}>}
 */
async function initializeUISchemas(schemaDirectory) {
    let uiSchemas = {};
    for (let file of fs.readdirSync(schemaDirectory)) {
        //ignore files other than .yaml or .json
        const ext = path.extname(file).toLowerCase();
        if (ext === '.yaml' || ext === '.yml' || ext === '.json') {
            let filename = _.upperFirst(_.camelCase(path.basename(file, ext)));
            let schema = loadFile([schemaDirectory, file]);
            try {
                schema = await dereferenceAndMergeSchema(schema, schemaDirectory);
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
 * @param {import('utilities-node/src/types').Config} config
 * @param {Function} getApiDoc
 */
export default function(config, getApiDoc) {

    let operations = {
        GET: logger.catchErrors(GET)
    };

    operations.GET['apiDoc'] = getApiDoc(`
        summary: Returns object ui schema to the caller
        operationId: getObjectUiSchema
        parameters:
          - $ref: '#/components/parameters/modelType'
        responses:
            200:
                description: Success
                content:
                    application/json:
                        schema:
                            type: object
            default:
                $ref: '#/components/responses/Error'`);

    async function GET(req, res) {
        if (!uiSchemas) {
            uiSchemas = await initializeUISchemas('api/v1/components/ui-schemas');
        }
        let schema = uiSchemas[_.upperFirst(_.camelCase(req.params.type))];
        res.validateAndSend(200, schema);
    }

    return operations;
}
