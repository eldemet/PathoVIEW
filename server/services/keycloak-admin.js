/**
 * @module keycloak-admin
 * @category services
 */
import _ from 'lodash';
import {loadFile} from 'utilities-node/src/utilities/fs.js';
import {BasicObject} from 'utilities-node/src/services/_prototypes.js';

/**
 * @extends BasicObject
 * @category services
 * @implements IService
 */
class KeycloakAdminService extends BasicObject {

    users;
    roles;
    groups;

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
        let password = config.keycloakConfig.adminClientPasswordFile ? loadFile(config.keycloakConfig.adminClientPasswordFile) : 'admin';
        password = password.replace(/(\r\n|\n|\r)/gm, '')
        /** @type {import('@keycloak/keycloak-admin-client/lib/utils/auth').Credentials} */
        const credentials = {
            username: config.keycloakConfig.adminClientUser,
            password: password,
            grantType: 'password',
            clientId: 'admin-cli'
        };
        await this.kcAdminClient.auth(credentials);
        const refreshAccessToken = async() => {
            try {
                await this.kcAdminClient.auth(credentials);
                this.logger.verbose('Access token for Keycloak admin service refreshed!');
            } catch (error) {
                this.logger.error(error.message);
            }
            this.interval = setTimeout(refreshAccessToken, 5 * 1000 * 60);
        };
        await refreshAccessToken();
        const refreshUserData = async() => {
            try {
                this.users = await this.getUsers(true);
                this.roles = await this.getRoles(true);
                this.groups = await this.getGroups(true);
            } catch (error) {
                this.logger.error(error.message);
            }
            this.userInterval = setTimeout(refreshUserData, 5 * 1000 * 60);
        };
        await refreshUserData();
        this.logger.info('Successfully initialized Keycloak admin service!');
    }

    async close() {
        clearTimeout(this.interval);
        clearTimeout(this.userInterval);
        this.logger.info('Successfully closed Keycloak admin service!');
    }

    async getUsers(force) {
        let users;
        if (!this.users || force) {
            users = (await this.kcAdminClient.users.find()).map(user => _.pick(user, ['id', 'username', 'firstName', 'lastName', 'email', 'enabled']));
            let client = (await this.kcAdminClient.clients.find({clientId: this.config.keycloakConfig.clientId}))[0];
            const clientSessions = await this.kcAdminClient.clients.listSessions({
                id: client.id
            });
            for (let user of users) {
                user.roles = (await this.kcAdminClient.users.listRealmRoleMappings({id: user.id})).filter(role => !role.composite).map(role => role.name);
                user.groups = (await this.kcAdminClient.users.listGroups({id: user.id})).map(group => group.name);
                user.status = clientSessions.find(session => session.userId === user.id) ? 'online' : 'offline';
            }
            this.logger.verbose('Users in Keycloak admin service refreshed!');
        } else {
            users = this.users;
        }
        return users;
    }

    async getRoles(force) {
        let roles;
        if (!this.roles || force) {
            roles = (await this.kcAdminClient.roles.find())
                .map(role => _.pick(role, ['id', 'name']))
                .filter(role => !['manage-users', 'offline_access', 'uma_authorization'].includes(role.name) && !role.composite);
            this.logger.verbose('Roles in Keycloak admin service refreshed!');
        } else {
            roles = this.roles;
        }
        return roles;
    }

    async getGroups(force) {
        let groups;
        if (!this.groups || force) {
            groups = (await this.kcAdminClient.groups.find());
            this.logger.verbose('Groups in Keycloak admin service refreshed!');
        } else {
            groups = this.groups;
        }
        return groups;
    }

}

export {KeycloakAdminService};
