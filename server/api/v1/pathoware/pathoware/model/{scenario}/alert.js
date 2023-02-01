import _ from 'lodash';
import {v1 as uuid} from 'uuid';
import Logger from 'utilities-node/src/utilities/logger.js';

export default function(config, getApiDoc) {

    const logger = new Logger(import.meta);

    let operations = {
        GET: logger.catchErrors(GET),
        POST: logger.catchErrors(POST)
    };

    operations.GET['apiDoc'] = getApiDoc(getObjects);

    operations.POST['apiDoc'] = getApiDoc(createObject);

    async function GET(req, res) {
        if (!req?.kauth?.grant?.access_token.token) {
            res.status(401).send({error: 'Unauthorized'});
        } else {
            let url = config.pathoware.northboundApi + '/pathoalert/' + req.params.scenario + '/all';
            /** @type {RequestInit} */
            let options = {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'accept': 'application/json',
                    'Content-Type': 'application/json',  //must match body
                    'x-token': req.kauth.grant.access_token.token
                },
                mode: 'cors', // no-cors, *same-origin
                method: 'GET'
            };
            let fetchResult = await fetch(url, options);
            if (!fetchResult.ok) {
                res.status(fetchResult.status).send({error: fetchResult.statusText});
            } else {
                let result = await fetchResult.json();
                for (let alert of result) {
                    alert.id = alert.entityId;
                }
                res.validateAndSend(200, result);
            }
        }
    }

    async function POST(req, res) {
        if (!req?.kauth?.grant?.access_token.token) {
            res.status(401).send({error: 'Unauthorized'});
        } else {
            let url = config.pathoware.dataConnectorApi + '/pathoview/alert';
            let alert = Object.assign({}, req.body);
            alert.id = 'Alert:' + uuid();
            /** @type {RequestInit} */
            let options = {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Accept': 'application/json',
                    'content-type': 'application/json',  //must match body
                    'scenario': req.params.scenario,
                    'x-token': req.kauth.grant.access_token.token
                },
                mode: 'cors', // no-cors, *same-origin
                method: 'POST',
                body: JSON.stringify(alert)
            };
            let fetchResult = await fetch(url, options);
            if (!fetchResult.ok) {
                res.status(fetchResult.status).send({error: fetchResult.statusText});
            } else {
                let result = await fetchResult.json();
                result = _.omitBy(result, _.isNil);
                res.validateAndSend(200, result);
            }
        }
    }

    return operations;
}

const parameterScenario = {
    in: 'path',
    name: 'scenario',
    description: 'PathoCERT scenario',
    schema: {
        type: 'string',
        enum: ['limassol', 'seoul', 'granada', 'thessaloniki', 'sofia', 'amsterdam']
    },
    required: true
};

const getObjects = {
    summary: 'Returns alerts to the caller',
    operationId: 'getAlerts',
    parameters: [
        parameterScenario
    ],
    responses: {
        200: {
            description: 'Success',
            content: {
                'application/json': {
                    schema: {
                        type: 'array',
                        items: {
                            type: 'object'
                            // $ref: '#/components/schemas/Alert'
                        }
                    }
                }
            }
        },
        default: {
            $ref: '#/components/responses/Error'
        }
    }
};

const createObject = {
    summary: 'Creates an alert',
    operationId: 'createAlert',
    parameters: [
        parameterScenario
    ],
    requestBody: {
        required: true,
        content: {
            'application/json': {
                schema: {
                    $ref: '#/components/schemas/Alert'
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Success',
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/Alert'
                    }
                }
            }
        },
        default: {
            $ref: '#/components/responses/Error'
        }
    }
};
