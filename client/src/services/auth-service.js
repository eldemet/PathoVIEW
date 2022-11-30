import {inject} from 'aurelia-framework';
import {AureliaCookie} from 'aurelia-cookie';
import Keycloak from 'keycloak-js';
import {BasicObject} from 'library-aurelia/src/prototypes/basic-object'; // eslint-disable-line no-unused-vars
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
import {HttpService} from 'library-aurelia/src/services/http-service';

@inject(HttpService)
class AuthService extends BasicService {

    /**
     * @typedef {Object} UserInfo
     * @property {string} locale
     * @property {string} name
     * @property {string} preferred_username
     * @property {string} email
     * @property {string} sub - token id
     */
    /** @type {UserInfo} */
    userInfo;

    /**
     *
     * @param {HttpService} httpService
     * @param {ConstructorParameters<typeof BasicObject>} rest
     */
    constructor(httpService, ...rest) {
        super('auth', ...rest);
        this.httpService = httpService;
    }

    async initialize(config, testing) {
        if (!this.keycloak) {
            this.config = config;
            this.keycloak = new Keycloak(config);
            await this.keycloak.init({
                onLoad: 'login-required',
                enableLogging: testing,
                checkLoginIframe: false
            });
            AureliaCookie.set('auth_token', this.keycloak.token, {});
            // @ts-ignore
            this.userInfo = await this.keycloak.loadUserInfo();
            this.interval = setInterval(async() => {
                try {
                    await this.keycloak.loadUserInfo();
                    // @ts-ignore
                    await this.keycloak.updateToken();
                    AureliaCookie.set('auth_token', this.keycloak.token, {});
                } catch (error) {
                    this.keycloak.logout({redirectUri: this.keycloak.createLoginUrl()});
                }
            }, 5000);
        }
    }

    async close() {
        clearInterval(this.interval);
        this.userInfo = undefined;
        this.keycloak.logout({redirectUri: this.keycloak.createLoginUrl()});
    }

    getTokenExpiresIn() {
        return Math.round(this.keycloak.tokenParsed.exp + this.keycloak.timeSkew - new Date().getTime() / 1000);
    }

    async setUserAttribute(httpService, attributeObject) {
        await httpService.fetch('PUT', this.config.url + 'admin/realms/' + this.keycloak.realm + '/users/' + this.userInfo.sub, {attributes: attributeObject}, 2000);
    }

    async getUsers(forceReload) {
        if (forceReload || !this.usersPromise) {
            this.usersPromise = this.httpService.fetch('GET', '/api/v1/keycloak-admin/user', null, 10000);
        }
        return await this.usersPromise;
    }

    async getRoles(forceReload) {
        if (forceReload || !this.rolesPromise) {
            this.rolesPromise = this.httpService.fetch('GET', '/api/v1/keycloak-admin/role', null, 10000);
        }
        return await this.rolesPromise;
    }

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

}

export {AuthService};
