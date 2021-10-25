import {AureliaCookie} from 'aurelia-cookie';
import * as Keycloak from 'keycloak-js';

/**
 * @category services
 */
class AuthService {

    static keycloak;
    static userInfo;
    static interval;

    static async initialize() {
        let options = {
            onLoad: 'login-required',
            enableLogging: window.environment.testing,
            checkLoginIframe: false
        };
        if (!AuthService.keycloak) {
            AuthService.keycloak = new Keycloak(window.environment.keycloak);
            await AuthService.keycloak.init(options);
            AuthService.userInfo = await AuthService.keycloak.loadUserInfo();
            AureliaCookie.set('auth_token', AuthService.keycloak.token, {});
            AuthService.interval = setInterval(async() => {
                try {
                    await AuthService.keycloak.loadUserInfo();
                    await AuthService.keycloak.updateToken();
                    AureliaCookie.set('auth_token', AuthService.keycloak.token, {});
                } catch (error) {
                    AuthService.keycloak.logout({redirectUri: window.environment.keycloak.url});
                }
            }, 5000);
        }
    }

    static async close() {
        clearInterval(AuthService.interval);
        AuthService.userInfo = undefined;
        AuthService.keycloak.logout({redirectUri: window.environment.keycloak.url});
    }

    static getTokenExpiresIn() {
        return Math.round(AuthService.keycloak.tokenParsed.exp + AuthService.keycloak.timeSkew - new Date().getTime() / 1000);
    }

}

export {AuthService};
