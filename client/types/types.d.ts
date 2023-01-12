// Type definitions for pathoview-client
// Project: git+https://gitlab.cc-asp.fraunhofer.de/pathocert/pathoview.git

import 'library-aurelia/types/types';
import {KeycloakTokenParsed} from 'keycloak-js/dist/keycloak.d.ts';

declare global {

    export {KeycloakTokenParsed} from 'keycloak-js/dist/keycloak.d.ts'

    export interface KeycloakUserInfo {
        name: string,
        preferred_username: string,
        email: string,
        emailVerified: boolean,
        sub: string,
        locale: string
    }

    export interface AuthServicePlugin {
        getUserInfo(): Promise<KeycloakUserInfo>;

        getToken(): Promise<KeycloakTokenParsed>;

        logout()
    }

}
