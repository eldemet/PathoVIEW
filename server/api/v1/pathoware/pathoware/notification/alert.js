import Logger from 'utilities-node/src/utilities/logger.js';

export default function(notificationService, getApiDoc) {

    const logger = new Logger(import.meta);

    let operations = {
        POST: logger.catchErrors(POST)
    };

    operations.POST.apiDoc = getApiDoc(publishNotification);

    async function POST(req, res) {
        let notification = {content: req.body.data, senderId: req.body.subscriptionId, topic: 'model', contentType: 'alert', operationType: 'create'};
        res.send(notificationService.publishNotification(notification));
    }

    return operations;
}


const publishNotification = {
    summary: 'publish a notification',
    operationId: 'publishAlertNotification',
    parameters: [],
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
                            type: 'object'
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

