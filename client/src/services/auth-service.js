import {AureliaCookie} from 'aurelia-cookie';
import Keycloak from 'keycloak-js';
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';

class AuthService extends BasicService {

    constructor(...rest) {
        super('auth', ...rest);
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
            this.userInfo = await this.keycloak.loadUserInfo();
            this.interval = setInterval(async() => {
                try {
                    await this.keycloak.loadUserInfo();
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

    getUserId() {
        if (!this.userInfo) {
            throw new Error('Not logged in!');
        }
        return this.userInfo.sub;
    }

}

export {AuthService};
