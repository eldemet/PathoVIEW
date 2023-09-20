import Logger from 'utilities-node/src/utilities/logger.js';
import {alertUtilities} from '../../../../../../utilities/pathoware.js';

/**
 * @param {import('utilities-node/src/services/notificationSSE').NotificationServiceSSE} notificationService
 * @param {Function} getApiDoc
 */
export default function(notificationService, getApiDoc) {

    const logger = new Logger(import.meta);

    let operations = {
        POST: logger.catchErrors(POST)
    };

    operations.POST.apiDoc = getApiDoc(publishNotification);

    async function POST(req, res) {
        /** @type import('utilities-node/types/types').NotificationPublished */
        let result;
        let senderId = req.body.subscriptionId;
        for (let alert of req.body.data) {
            let harmonizedAlert = alertUtilities.harmonizeAlert(alert);
            let notification = {content: harmonizedAlert, senderId: senderId, topic: 'model', contentType: 'alert', operationType: 'create'};
            //TODO should only send for alerts not coming from PathoVIEW
            if (!harmonizedAlert.id || !harmonizedAlert.type) {
                res.result({errors: 1, notification: harmonizedAlert});
            } else {
                result = notificationService.publishNotification(notification);
                res.send(result);
            }
        }
    }

    return operations;
}


const publishNotification = {
    summary: 'publish a notification',
    operationId: 'publishAlertNotification',
    parameters: [
        {
            in: 'path',
            name: 'scenario',
            description: 'PathoCERT scenario',
            schema: {
                type: 'string',
                enum: ['limassol', 'seoul', 'granada', 'thessaloniki', 'sofia', 'amsterdam']
            },
            required: true
        }
    ],
    requestBody: {
        required: true,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        subscriptionId: {
                            type: 'string'
                        },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object'
                                // $ref: '#/components/schemas/Alert'
                            }
                        }
                    }
                }
            }
        }
    },
    responses: {
        200: {
            $ref: '#/components/responses/NotificationPublished'
        },
        default: {
            $ref: '#/components/responses/Error'
        }
    }
};

