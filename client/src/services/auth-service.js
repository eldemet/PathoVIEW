import {AureliaCookie} from 'aurelia-cookie';
import * as Keycloak from 'keycloak-js';

/**
 * @category services
 */
class AuthService {

    static config;
    static keycloak;
    static userInfo;
    static interval;

    static async initialize(config, testing) {
        if (!AuthService.keycloak) {
            AuthService.config = config;
            AuthService.keycloak = new Keycloak(config);
            await AuthService.keycloak.init({
                onLoad: 'login-required',
                enableLogging: testing,
                checkLoginIframe: false
            });
            AureliaCookie.set('auth_token', AuthService.keycloak.token, {});
            AuthService.userInfo = await AuthService.keycloak.loadUserInfo();
            AuthService.interval = setInterval(async() => {
                try {
                    await AuthService.keycloak.loadUserInfo();
                    await AuthService.keycloak.updateToken();
                    AureliaCookie.set('auth_token', AuthService.keycloak.token, {});
                } catch (error) {
                    AuthService.keycloak.logout({redirectUri: config.url});
                }
            }, 5000);
        }
    }

    static async close() {
        clearInterval(AuthService.interval);
        AuthService.userInfo = undefined;
        AuthService.keycloak.logout({redirectUri: AuthService.config.url});
    }

    static getTokenExpiresIn() {
        return Math.round(AuthService.keycloak.tokenParsed.exp + AuthService.keycloak.timeSkew - new Date().getTime() / 1000);
    }

    static getUserId() {
        if (!AuthService.userInfo) {
            throw new Error('Not logged in!');
        }
        return AuthService.userInfo.sub;
    }

    static async setUserAttribute(httpService, attributeObject) {
        await httpService.fetch('PUT', AuthService.config.url + 'admin/realms/' + AuthService.keycloak.realm + '/users/' + AuthService.userInfo.sub, {attributes: attributeObject}, 2000);
    }

}

export {AuthService};
