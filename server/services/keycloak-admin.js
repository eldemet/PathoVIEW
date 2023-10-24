import _ from 'lodash';
import {loadFile} from 'utilities-node/src/utilities/fs.js';
import {BasicObject} from 'utilities-node/src/services/_prototypes.js';

/**
 * @extends BasicObject
 */
class KeycloakAdminService extends BasicObject {

    /**
     * @type {import('../types').KeycloakUser[]}
     */
    users = [];
    /**
     * @type {import('../types').KeycloakRole[]}
     */
    roles = [];
    /**
     * @type {import('../types').KeycloakGroup[]}
     */
    groups = [];

    constructor() {
        super();
        //TODO check why typescript does not recognize logger defined in BasicObject
        /**
         * @type {import('utilities-node/src/utilities/logger').default}
         */
        this.logger;
    }

    async initialize(config) {
        this.config = config;
        const KcAdminClient = (await import('@keycloak/keycloak-admin-client')).default;
        this.kcAdminClient = new KcAdminClient({
            baseUrl: config.keycloakConfig.authServerUrl.slice(0, -1),
            realmName: config.keycloakConfig.realm || 'master'
        });
        let password = config.keycloakConfig.adminClientPasswordFile ? loadFile(config.keycloakConfig.adminClientPasswordFile) : 'admin';
        password = password.replace(/(\r\n|\n|\r)/gm, '');
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

    /**
     * @param {boolean} [force]
     * @returns Promise<import('../types').KeycloakUser[]>
     */
    async getUsers(force) {
        let users;
        if (!this.users || force) {
            users = (await this.kcAdminClient.users.find()).map(user => _.pick(user, ['id', 'username', 'firstName', 'lastName', 'email', 'enabled']));
            let client = (await this.kcAdminClient.clients.find({clientId: this.config.keycloakConfig.clientId}))[0];
            const clientSessions = await this.kcAdminClient.clients.listSessions({
                id: client.id
            });
            for (let user of users) {
                user.roles = (await this.kcAdminClient.users.listRealmRoleMappings({id: user.id})).filter(role => !role.composite).map(role => role.id);
                user.groups = (await this.kcAdminClient.users.listGroups({id: user.id})).map(group => group.id);
                user.status = clientSessions.find(session => session.userId === user.id) ? 'online' : 'offline';
            }
            this.logger.verbose('Users in Keycloak admin service refreshed!');
        } else {
            users = this.users;
        }
        return users;
    }

    /**
     * @param {boolean} [force]
     * @returns Promise<import('../types').KeycloakRole[]>
     */
    async getRoles(force) {
        let roles;
        if (!this.roles || force) {
            roles = (await this.kcAdminClient.roles.find())
                .map(role => _.pick(role, ['id', 'name']))
                .filter(role => !['manage-users', 'offline_access', 'uma_authorization', '_DEV', '_ADMIN', '_USER', 'default-roles-pathocert'].includes(role.name) && !role.composite);
            this.logger.verbose('Roles in Keycloak admin service refreshed!');
        } else {
            roles = this.roles;
        }
        return roles;
    }

    /**
     * @param {boolean} [force]
     * @returns Promise<import('../types').KeycloakGroup[]>
     */
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
