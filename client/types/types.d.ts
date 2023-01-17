// Type definitions for pathoview-client
// Project: git+https://gitlab.cc-asp.fraunhofer.de/pathocert/pathoview.git

import 'library-aurelia/types/types';

declare global {

    export interface KeycloakUserInfo {
        name: string;
        preferred_username: string;
        email: string;
        emailVerified: boolean;
        sub: string;
        locale: string;
    }

    export interface TokenInformation {
        value: string;
        expiry: number;
    }

    export interface BhapticsDevice {
        deviceName: string;
        address: string;
        position: string;
        isConnected: boolean;
        isPaired: boolean;
    }

    export interface BhapticsTactFile {
        fileName: string;
        content: string;
    }

    export interface BhapticsCallRegistered {
        name: string;
        fallback: string;
        intensity: number;
        duration: number;
        offsetAngleX: number;
        offsetY: number;
    }

    export interface BhapticsDeviceList {
        devices: Array<BhapticsDevice>;
    }

    export interface AuthServicePlugin {
        getUserInfo(): Promise<KeycloakUserInfo>;

        getToken(): Promise<TokenInformation>;

        logout(): Promise<void>;
    }

    export interface BhapticsServicePlugin {

        close(): Promise<void>;

        getDeviceList(): Promise<BhapticsDeviceList>;

        pingAll(): Promise<void>;

        register(tactFile: BhapticsTactFile): Promise<void>

        submitRegistered(callRegistered: BhapticsCallRegistered): Promise<void>;

    }

}
