import {inject} from 'aurelia-framework';
import {BasicObject} from 'library-aurelia/src/prototypes/basic-object'; // eslint-disable-line no-unused-vars
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
import {HttpService} from 'library-aurelia/src/services/http-service';
import {AureliaCookie} from 'aurelia-cookie';

@inject(HttpService)
class AuthService extends BasicService {

    /** @type {KeycloakUserInfo} */
    userInfo;
    config;
    /** @type {TokenInformation} */
    token;
    options = {uniqueProperty: 'id'};

    /**
     *
     * @param {HttpService} httpService
     * @param {ConstructorParameters<typeof BasicObject>} rest
     */
    constructor(httpService, ...rest) {
        super('auth', ...rest);
        this.httpService = httpService;
    }

    getTokenExpiresIn() {
        return Math.round(this.token.expiry - new Date().getTime() / 1000);
    }

    async setUserAttribute(httpService, attributeObject) {
        await httpService.fetch('PUT', this.config.url + 'admin/realms/' + this.config.realm + '/users/' + this.userInfo.sub, {attributes: attributeObject}, 2000);
    }

    setCookie(token) {
        AureliaCookie.set('auth_token', token.value, {expiry: token.expiry});
    }

    setLocale(locale) {
        AureliaCookie.set('lang', locale, {});
    }


    /**
     * @param {boolean} [forceReload]
     * @return {Promise<KeycloakUser[]>}
     */
    async getUsers(forceReload) {
        if (forceReload || !this.usersPromise) {
            this.usersPromise = this.httpService.fetch('GET', '/api/v1/keycloak-admin/user', null, 10000);
        }
        return await this.usersPromise;
    }

    /**
     * @param {boolean} [forceReload]
     * @return {Promise<KeycloakRole[]>}
     */
    async getRoles(forceReload) {
        if (forceReload || !this.rolesPromise) {
            this.rolesPromise = this.httpService.fetch('GET', '/api/v1/keycloak-admin/role', null, 10000);
        }
        return await this.rolesPromise;
    }


    /**
     * @param {boolean} forceReload
     * @return {Promise<KeycloakGroup[]>}
     */
    async getGroups(forceReload) {
        if (forceReload || !this.groupsPromise) {
            this.groupsPromise = this.httpService.fetch('GET', '/api/v1/keycloak-admin/group', null, 10000);
        }
        return await this.groupsPromise;
    }

    getUserId() {
        if (!this.userInfo) {
            throw new Error('Not logged in!');
        }
        return this.userInfo.sub;
    }

    /**
     * @return {Promise<KeycloakUser>}
     */
    async getUserInfo() {
        let users = await this.getUsers();
        let userId = this.getUserId();
        return users.find(u => u.id === userId);
    }

    /**
     * grant access if not roles are provided, otherwise check if user has required role
     * @param {String[]} roles
     */
    async hasAccess(roles) {
        let hasAccess = true;
        if (roles?.length) {
            hasAccess = false;
            let user = await this.getUserInfo();
            if (user && Array.isArray(user.roles) && roles.length) {
                hasAccess = user.roles.some(r => roles.includes(r));
            }
        }
        return hasAccess;
    }

    async getObjects() {
        let roles = await this.getRoles();
        return {objects: roles};
    }

}

export {AuthService};
