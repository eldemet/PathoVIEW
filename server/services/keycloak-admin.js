'use strict';
/**
 * @module etcd
 * @category services
 */
const logger = require('utilities-node/src/utilities/logger')(module);
const _ = require('lodash');
const {loadFile} = require('utilities-node/src/utilities/fs');
const {BasicObject} = require('utilities-node/src/services/_prototypes');

/**
 * @extends BasicObject
 * @category services
 * @implements IService
 */
class KeycloakAdminService extends BasicObject {

    constructor() {
        super();
    }

    async initialize(config) {
        this.config = config;
        const KcAdminClient = (await import('@keycloak/keycloak-admin-client')).default;
        this.kcAdminClient = new KcAdminClient({
            baseUrl: config.keycloakConfig.authServerUrl.slice(0, -1),
            realmName: config.keycloakConfig.realm || 'master'
        });
        /** @type {import('@keycloak/keycloak-admin-client/lib/utils/auth').Credentials} */
        const credentials = {
            username: config.keycloakConfig.adminClientUser,
            password: config.keycloakConfig.adminClientPasswordFile ? loadFile(config.keycloakConfig.adminClientPasswordFile) : 'admin',
            grantType: 'password',
            clientId: 'admin-cli'
        };
        await this.kcAdminClient.auth(credentials);
        const refreshAccessToken = () => {
            this.interval = setTimeout(async() => {
                try {
                    await this.kcAdminClient.auth(credentials);
                    this.logger.verbose('Access token for Keycloak admin service refreshed!');
                } catch (error) {
                    this.logger.error(error.message);
                }
                refreshAccessToken();
            }, 5 * 1000 * 60);
        };
        refreshAccessToken();
        logger.info('Successfully initialized Keycloak admin service!');
    }

    async close() {
        clearTimeout(this.interval);
        logger.info('Successfully closed Keycloak admin service!');
    }

    async getUsers() {
        let users = (await this.kcAdminClient.users.find()).map(user => _.pick(user, ['id', 'username', 'firstName', 'lastName', 'email', 'enabled']));
        let client = (await this.kcAdminClient.clients.find({clientId: this.config.keycloakConfig.clientId}))[0];
        const clientSessions = await this.kcAdminClient.clients.listSessions({
            id: client.id
        });
        for (let user of users) {
            user.roles = (await this.kcAdminClient.users.listRealmRoleMappings({id: user.id})).filter(role => !role.composite).map(role => role.name);
            user.groups = (await this.kcAdminClient.users.listGroups({id: user.id})).map(group => group.name);
            user.status = clientSessions.find(session => session.userId === user.id) ? 'online' : 'offline';
        }
        return users;
    }

    async getRoles() {
        return (await this.kcAdminClient.roles.find())
            .map(role => _.pick(role, ['id', 'name']))
            .filter(role => !['manage-users', 'offline_access', 'uma_authorization'].includes(role.name) && !role.composite);
    }

    async getGroups() {
        return (await this.kcAdminClient.groups.find());
    }

}

module.exports = {KeycloakAdminService};
