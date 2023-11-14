import get from 'lodash/get';
import {inject} from 'aurelia-framework';
import {utilities} from 'value-converters';
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
import {HttpService} from 'library-aurelia/src/services/http-service';

@inject(HttpService)
class AuthService extends BasicService {

    /** @type{import('../types').KeycloakUser} */
    user;
    /** @type {import('../types').KeycloakUserInfo} */
    userInfo;
    config;
    /** @type {import('../types').TokenInformation} */
    token;
    options = {uniqueProperty: 'id'};

    /**
     *
     * @param {HttpService} httpService
     * @param {ConstructorParameters<typeof import('library-aurelia/src/prototypes/basic-object').BasicObject>} rest
     */
    constructor(httpService, ...rest) {
        super('auth', ...rest);
        this.httpService = httpService;
    }

    async start(config, testing) {
        this.config = config;
    }

    async initializeService() {
        this.users = await this.httpService.fetch('GET', '/api/v1/keycloak-admin/user', null, 10000);
        let roles = await this.httpService.fetch('GET', '/api/v1/keycloak-admin/role', null, 10000);
        this.roles = roles.sort((a, b) => a.name.localeCompare(b.name));
        this.groups = await this.httpService.fetch('GET', '/api/v1/keycloak-admin/group', null, 10000);
        this.user = this.users.find(u => u.id === this.getUserId());
    }

    getTokenExpiresIn() {
        return Math.round(this.token.expiry - new Date().getTime() / 1000);
    }

    setAuthToken(token) {
        localStorage.setItem('auth_token', token.value);
    }

    setLocale(locale) {
        localStorage.setItem('lang', locale);
    }

    getLocale() {
        return localStorage.getItem('lang');
    }

    setUserId(userId) {
        localStorage.setItem('userId', userId);
    }

    getUserId() {
        if (!this.userInfo) {
            throw new Error('Not logged in!');
        }
        return this.userInfo.sub;
    }

    /**
     * @return {Promise<import('../types').KeycloakUser>}
     */
    async getUserInfo() {
        await this.initialized();
        let userId = this.getUserId();
        return this.users.find(u => u.id === userId);
    }

    /**
     * grant access if rbac roles are empty or undefined for provided accessFunction, otherwise check if user has required role
     * @param {String} accessFunction
     */
    hasAccess(accessFunction) {
        if (!this.user) {
            throw new Error('AuthService not yet initialized!');
        }
        let hasAccess = true;
        let roles = get(this.config.rbac, accessFunction);
        if (roles?.length) {
            hasAccess = false;
            if (this.user && Array.isArray(this.user.roles) && roles.length) {
                hasAccess = this.user.roles.some(r => roles.includes(r));
            }
        }
        return hasAccess;
    }

    isOwner(owner) {
        let isOwner = false;
        if (Array.isArray(owner)) {
            isOwner = owner.includes(this.userInfo.sub);
        }
        return isOwner;
    }

    async getUsers(query) {
        await this.initialized();
        return await this.getObjects(this.users, query);
    }

    async getRoles(query) {
        await this.initialized();
        return await this.getObjects(this.roles, query);
    }

    async getObjects(objects, query) {
        let filteredObjects = objects;
        if (query?.filter) {
            filteredObjects = utilities.filter(filteredObjects, query.filter);
        }
        return {
            query: query,
            total: filteredObjects.length,
            collectionTotal: objects.length,
            objects: filteredObjects
        };
    }

    getRole(roleId) {
        let role;
        if (Array.isArray(this.roles)) {
            role = this.roles.find(r => r.id === roleId);
        }
        return role;
    }

    getGroup(groupId) {
        let group;
        if (Array.isArray(this.groups)) {
            group = this.groups.find(g => g.id === groupId);
        }
        return group;
    }

}

export {AuthService};
