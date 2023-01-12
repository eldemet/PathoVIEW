// Type definitions for pathoview-client
// Project: git+https://gitlab.cc-asp.fraunhofer.de/pathocert/pathoview.git

import 'library-aurelia/types/types';

declare global {

    export interface KeycloakUserInfo {
        name: string,
        preferred_username: string,
        email: string,
        emailVerified: boolean,
        sub: string,
        locale: string
    }

    export interface TokenInformation {
        value: string,
        expiry: number
    }

    export interface AuthServicePlugin {
        getUserInfo(): Promise<KeycloakUserInfo>;

        getToken(): Promise<TokenInformation>;

        logout()
    }

}
