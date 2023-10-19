// Type definitions for pathoview-server
// Project: git+https://gitlab.cc-asp.fraunhofer.de/pathocert/pathoview.git

import {Config} from 'utilities-node/src/types';

type ConfigAdditions = {
    server: {
        openWeatherMapApiKeyFile: string
    }
    keycloakConfig: {
        adminClientUser: string,
        adminClientPasswordFile: string
    }
}

export type ConfigWithAdditions = Config & ConfigAdditions;

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

export {GroupRepresentation as KeycloakRole} from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation'

export {GroupRepresentation as KeycloakGroup} from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation'
