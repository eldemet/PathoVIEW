import {registerPlugin} from '@capacitor/core';
import {AuthService} from './auth-service';

class AuthServiceImplementation extends AuthService {

    async start(config, testing) {
        await super.start(config, testing);
        /** @returns AuthServicePlugin */
        this.authServicePlugin = registerPlugin('AuthService');
        this.userInfo = await this.authServicePlugin.getUserInfo();
        this.token = await this.authServicePlugin.getToken();
        this.setAuthToken(this.token);
        this.androidSubscription = this.authServicePlugin.addListener('token-update-event', payload => {
            this.logger.info('token update received', payload);
            this.token = payload;
            this.setAuthToken(this.token);
        });
    }

    async close() {
        await super.close();
        this.androidSubscription.remove();
        this.userInfo = undefined;
        await this.authServicePlugin.logout();
    }

}

export {AuthServiceImplementation};
