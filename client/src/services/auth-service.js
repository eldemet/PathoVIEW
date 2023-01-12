import {inject} from 'aurelia-framework';
import {BasicObject} from 'library-aurelia/src/prototypes/basic-object'; // eslint-disable-line no-unused-vars
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
import {HttpService} from 'library-aurelia/src/services/http-service';
import {AureliaCookie} from "aurelia-cookie";

@inject(HttpService)
class AuthService extends BasicService {

    /** @type {KeycloakUserInfo} */
    userInfo;
    config;
    /** @type {TokenInformation} */
    token;

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
