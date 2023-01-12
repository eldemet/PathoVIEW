import {registerPlugin} from "@capacitor/core";
import {AuthService} from "./auth-service";

class AuthServiceImplementation extends AuthService {

    async initialize(config, testing) {
        this.config = config;
        /** @returns AuthServicePlugin */
        this.authServicePlugin = registerPlugin('AuthService');
        this.userInfo = await this.authServicePlugin.getUserInfo();
        this.token = await this.authServicePlugin.getToken();
        this.setCookie(this.token.sub, this.token.exp);
        this.interval = setInterval(async () => {
            this.token = await this.authServicePlugin.getToken();
            this.setCookie(this.token.sub, this.token.exp);
        }, 5000);
    }

    async close() {
        clearInterval(this.interval);
        this.userInfo = undefined;
        await this.authServicePlugin.logout();
    }

}

export {AuthServiceImplementation};
