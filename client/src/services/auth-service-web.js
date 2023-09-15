import {AuthService} from './auth-service';
import Keycloak from 'keycloak-js';

class AuthServiceImplementation extends AuthService {

    async start(config, testing) {
        await super.start(config, testing);
        this.keycloak = new Keycloak(config);
        await this.keycloak.init({
            onLoad: 'login-required',
            enableLogging: testing,
            checkLoginIframe: false
        });
        this.token = {value: this.keycloak.token, expiry: this.keycloak.tokenParsed.exp + this.keycloak.timeSkew};
        this.setAuthToken(this.token);
        // @ts-ignore
        this.userInfo = await this.keycloak.loadUserInfo();
        if (this.userInfo.locale && config.useUserLocale) {
            this.setLocale(this.userInfo.locale);
        }
        this.setUserId(this.userInfo.sub);
        this.interval = setInterval(async() => {
            try {
                await this.keycloak.loadUserInfo();
                // @ts-ignore
                await this.keycloak.updateToken();
                this.token = {value: this.keycloak.token, expiry: this.keycloak.tokenParsed.exp + this.keycloak.timeSkew};
                this.setAuthToken(this.token);
            } catch (error) {
                this.keycloak.logout({redirectUri: this.keycloak.createLoginUrl()});
            }
        }, 1000 * 60 * 5);
    }

    async close() {
        clearInterval(this.interval);
        this.userInfo = undefined;
        this.keycloak.logout({redirectUri: this.keycloak.createLoginUrl()});
    }

}

export {AuthServiceImplementation};
