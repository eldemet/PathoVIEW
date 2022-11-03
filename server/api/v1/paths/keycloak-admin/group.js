'use strict';
const logger = require('utilities-node/src/utilities/logger')(module);

/**
 * @module paths/keycloak-admin/group
 * @category paths
 */
module.exports = function(config, getApiDoc, kcAdminService) {

    let operations = {
        GET: logger.catchErrors(GET)
    };

    operations.GET['apiDoc'] = `
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
                $ref: '#/components/responses/Error'
    `;

    async function GET(req, res) {
        res.validateAndSend(200, await kcAdminService.getGroups());
    }

    return operations;
};
