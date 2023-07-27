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

    export type KeycloakUser = {
        id: string;
        username: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        enabled: boolean;
        roles: string[];
        groups: string[];
        status: 'online' | 'offline';
    }

    export type KeycloakRole = {
        id: string;
        name: string;
    }

    export type KeycloakGroup = {
        id: string;
        name: string;
        path: string;
        subGroups: string[];
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

        initialize(): Promise<void>;

        close(): Promise<void>;

        getDeviceList(): Promise<BhapticsDeviceList>;

        pingAll(): Promise<void>;

        register(tactFile: BhapticsTactFile): Promise<void>

        submitRegistered(callRegistered: BhapticsCallRegistered): Promise<void>;

    }

}
