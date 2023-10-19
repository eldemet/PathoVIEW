import Logger from 'utilities-node/src/utilities/logger.js';

const logger = new Logger(import.meta);

/**
 * @module paths/keycloak-admin/group
 * @param {import('utilities-node/src/types').Config} config
 * @param {Function} getApiDoc
 * @param {import('../../../../services/keycloak-admin').KeycloakAdminService} kcAdminService
 */
export default function(config, getApiDoc, kcAdminService) {

    let operations = {
        GET: logger.catchErrors(GET)
    };

    operations.GET['apiDoc'] = getApiDoc(`
        summary: Returns groups to the caller
        operationId: getGroups
        responses:
            200:
              description: Success
              content:
               'application/json':
                schema:
                  type: array
            default:
                $ref: '#/components/responses/Error'`);

    async function GET(req, res) {
        res.validateAndSend(200, await kcAdminService.getGroups());
    }

    return operations;
}
