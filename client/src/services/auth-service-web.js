import {AuthService} from "./auth-service";
import Keycloak from "keycloak-js";
import {AureliaCookie} from "aurelia-cookie";

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
            this.token = this.keycloak.tokenParsed;
            this.setCookie(this.token.sub, this.token.exp);
            // @ts-ignore
            this.userInfo = await this.keycloak.loadUserInfo();
            this.interval = setInterval(async () => {
                try {
                    await this.keycloak.loadUserInfo();
                    // @ts-ignore
                    await this.keycloak.updateToken();
                    this.token = this.keycloak.tokenParsed;
                    this.setCookie(this.token.sub, this.token.exp);
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

}

export {AuthServiceImplementation};
