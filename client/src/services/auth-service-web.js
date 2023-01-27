import {AuthService} from './auth-service';
import Keycloak from 'keycloak-js';

class AuthServiceImplementation extends AuthService {

    async initialize(config, testing) {
        if (!this.keycloak) {
            this.config = config;
            this.keycloak = new Keycloak(config);
            await this.keycloak.init({
                onLoad: 'login-required',
                enableLogging: testing,
                checkLoginIframe: false
            });
            this.token = {value: this.keycloak.token, expiry: this.keycloak.tokenParsed.exp + this.keycloak.timeSkew};
            this.setCookie(this.token);
            // @ts-ignore
            this.userInfo = await this.keycloak.loadUserInfo();
            this.interval = setInterval(async() => {
                try {
                    await this.keycloak.loadUserInfo();
                    // @ts-ignore
                    await this.keycloak.updateToken();
                    this.token = {value: this.keycloak.token, expiry: this.keycloak.tokenParsed.exp + this.keycloak.timeSkew};
                    this.setCookie(this.token);
                } catch (error) {
                    this.keycloak.logout({redirectUri: this.keycloak.createLoginUrl()});
                }
            }, 1000 * 60 * 5);
        }
    }

    async close() {
        clearInterval(this.interval);
        this.userInfo = undefined;
        this.keycloak.logout({redirectUri: this.keycloak.createLoginUrl()});
    }

}

export {AuthServiceImplementation};
