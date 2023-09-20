import {v1 as uuid} from 'uuid';
import Logger from 'utilities-node/src/utilities/logger.js';
import {alertUtilities} from '../../../../../../utilities/pathoware.js';

export default function(config, getApiDoc, notificationService) {

    const logger = new Logger(import.meta);

    let operations = {
        GET: logger.catchErrors(GET),
        POST: logger.catchErrors(POST),
        DELETE: logger.catchErrors(DELETE)
    };

    operations.GET['apiDoc'] = getApiDoc({
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
    });

    async function GET(req, res) {
        if (!req?.kauth?.grant?.access_token.token) {
            res.status(401).send({error: 'Unauthorized'});
        } else {
            let url = `${config.pathoware.northboundApi}/pathoalert/${req.params.scenario}/all/`;
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
                let uncleanedAlerts = await fetchResult.json();
                let cleanedAlerts = [];
                for (let alert of uncleanedAlerts) {
                    let cleanedAlert = alertUtilities.cleanAlert(alert);
                    cleanedAlerts.push(cleanedAlert);
                }
                res.validateAndSend(200, cleanedAlerts);
            }
        }
    }

    operations.POST['apiDoc'] = getApiDoc({
        summary: 'Creates an alert',
        operationId: 'createAlert',
        parameters: [
            parameterScenario,
            {
                $ref: '#/components/parameters/userId'
            }
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
    });

    async function POST(req, res) {
        if (!req?.kauth?.grant?.access_token.token) {
            res.status(401).send({error: 'Unauthorized'});
        } else {
            let url = config.pathoware.dataConnectorApi + '/pathoview/alert/';
            let alert = Object.assign({}, req.body);
            alert.id = 'Alert:' + uuid();
            /** @type {RequestInit} */
            let options = {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',  //must match body
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
                result = alertUtilities.cleanAlert(result);
                res.validateAndSend(200, result);
                let userId = req.params.userId || req.headers['user-id'] || 'PathoVIEW';
                if (notificationService) notificationService.publishNotification({content: result, senderId: userId, topic: 'model', contentType: 'alert', operationType: 'create'});
            }
        }
    }

    operations.DELETE['apiDoc'] = getApiDoc({
        summary: 'Deletes an alert',
        operationId: 'deleteAlert',
        parameters: [
            parameterScenario,
            {
                $ref: '#/components/parameters/userId'
            }
        ],
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        // $ref: '#/components/schemas/Alert'
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
                            // $ref: '#/components/schemas/Alert'
                        }
                    }
                }
            },
            default: {
                $ref: '#/components/responses/Error'
            }
        }
    });

    async function DELETE(req, res) {
        if (!req?.kauth?.grant?.access_token.token) {
            res.status(401).send({error: 'Unauthorized'});
        } else {
            let url = `${config.pathoware.dataConnectorApi}/pathoalerta/delete-alert/${req.params.scenario}/by-id/${encodeURIComponent(req.body.id)}/`;
            /** @type {RequestInit} */
            let options = {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',  //must match body
                    'x-token': req.kauth.grant.access_token.token
                },
                mode: 'cors', // no-cors, *same-origin
                method: 'DELETE'
            };
            let fetchResult = await fetch(url, options);
            if (!fetchResult.ok) {
                res.status(fetchResult.status).send({error: fetchResult.statusText});
            } else {
                res.validateAndSend(200, req.body);
                let userId = req.params.userId || req.headers['user-id'] || 'PathoVIEW';
                if (notificationService) notificationService.publishNotification({content: req.body, senderId: userId, topic: 'model', contentType: 'alert', operationType: 'delete'});
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
