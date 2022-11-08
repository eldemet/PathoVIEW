'use strict';
/**
 * @module etcd
 * @category services
 */
const logger = require('utilities-node/src/utilities/logger')(module);
const _ = require('lodash');
const {loadFile} = require('utilities-node/src/utilities/fs');
const {Service} = require('utilities-node/src/services/_service');

/**
 * @extends Service
 * @category services
 */
class KeycloakAdminService extends Service {

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
            username: 'admin',
            password: config.keycloakConfig.adminClientPasswordFile ? loadFile(config.keycloakConfig.adminClientPasswordFile) : 'admin',
            grantType: 'password',
            clientId: 'admin-cli'
        };
        await this.kcAdminClient.auth(credentials);
        this.interval = setInterval(() => this.kcAdminClient.auth(credentials), 5 * 1000 * 60);
        logger.info('Successfully initialized Keycloak admin service!');
    }

    async close() {
        clearInterval(this.interval);
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
            user.status = clientSessions.find(session => session.userId  === user.id) ? 'online' : 'offline';
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
