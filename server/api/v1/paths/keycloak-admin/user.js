import Logger from 'utilities-node/src/utilities/logger.js';

const logger = new Logger(import.meta);

/**
 * @module paths/keycloak-admin/user
 * @category paths
 * @param {Config} config
 * @param {Function} getApiDoc
 * @param {KeycloakAdminService} kcAdminService
 */
export default function(config, getApiDoc, kcAdminService) {

    let operations = {
        GET: logger.catchErrors(GET)
    };

    operations.GET['apiDoc'] = getApiDoc(`
        summary: Returns users to the caller
        operationId: getUsers
        responses:
            200:
              description: Success
              content:
               'application/json':
                schema:
                  type: array
                  items:
                    type: object
                    required:
                      - id
                      - username
                      - enabled
                    properties:
                      id:
                        type: string
                      username:
                        type: string
                      firstName:
                        type: string
                      lastName:
                        type: string
                      email:
                        type: string
                      enabled:
                        type: boolean
                      roles:
                        type: array
                        items:
                          type: string
                      groups:
                        type: array
                        items:
                          type: string
                      status:
                        type: string
                        enum:
                          - online
                          - offline
                    additionalProperties: false
            default:
                $ref: '#/components/responses/Error'`);

    async function GET(req, res) {
        res.validateAndSend(200, await kcAdminService.getUsers());
    }

    return operations;
}
