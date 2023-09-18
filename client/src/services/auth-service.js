import {inject} from 'aurelia-framework';
import get from 'lodash/get';
import {BasicObject} from 'library-aurelia/src/prototypes/basic-object'; // eslint-disable-line no-unused-vars
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
import {HttpService} from 'library-aurelia/src/services/http-service';
import {AureliaCookie} from 'aurelia-cookie';

@inject(HttpService)
class AuthService extends BasicService {

    /** @type{KeycloakUser} */
    user;
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

    async start(config, testing) {
        this.config = config;
    }

    async initialize() {
        if (!this.initialized) {
            this.initialized = new Promise(resolve => {
                this.initializeResolve = resolve;
            });
            this.users = await this.httpService.fetch('GET', '/api/v1/keycloak-admin/user', null, 10000);
            let roles = await this.httpService.fetch('GET', '/api/v1/keycloak-admin/role', null, 10000);
            this.roles = roles.sort((a, b) => a.name.localeCompare(b.name));
            this.groups = await this.httpService.fetch('GET', '/api/v1/keycloak-admin/group', null, 10000);
            this.user = this.users.find(u => u.id === this.getUserId());
            this.initializeResolve();
        } else {
            await this.initialized;
        }
    }

    async close() {
        this.initialized = null;
    }

    getTokenExpiresIn() {
        return Math.round(this.token.expiry - new Date().getTime() / 1000);
    }

    setAuthToken(token) {
        AureliaCookie.set('auth_token', token.value, {expiry: token.expiry});
    }

    setLocale(locale) {
        AureliaCookie.set('lang', locale, {});
    }

    getLocale() {
        return AureliaCookie.get('lang');
    }

    setUserId(userId) {
        AureliaCookie.set('userId', userId, {});
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
        await this.initialized;
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

    async getUsers() {
        await this.initialized;
        return this.users;
    }

    async getObjects() {
        await this.initialized;
        return {objects: this.roles};
    }

    getRole(roleId) {
        let role;
        if (Array.isArray(this.roles)) {
            role = this.roles.find(x => x.id === roleId);
        }
        return role;
    }

}

export {AuthService};
