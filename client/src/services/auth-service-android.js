import {registerPlugin} from '@capacitor/core';
import {AuthService} from './auth-service';

class AuthServiceImplementation extends AuthService {

    async start(config, testing) {
        await super.start(config, testing);
        /** @returns AuthServicePlugin */
        this.authServicePlugin = registerPlugin('AuthService');
        this.userInfo = await this.authServicePlugin.getUserInfo();
        if (!this.getLocale()) {
            let locale = 'en';
            try {
                if (this.userInfo.locale && config.useUserLocale) {
                    locale = this.userInfo.locale;
                } else {
                    locale = navigator.language.slice(0, 2);
                }
            } catch (e) {
                //handle silently
            }
            this.setLocale(locale);
        }
        this.setUserId(this.userInfo.sub);
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
