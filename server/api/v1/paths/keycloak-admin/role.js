'use strict';
const logger = require('utilities-node/src/utilities/logger')(module);

/**
 * @module paths/keycloak-admin/role
 * @category paths
 */
module.exports = function(config, getApiDoc, kcAdminService) {

    let operations = {
        GET: logger.catchErrors(GET)
    };

    operations.GET['apiDoc'] = `
        summary: Returns users to the caller
        operationId: getRoles
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
        res.validateAndSend(200, await kcAdminService.getRoles());
    }

    return operations;
};
