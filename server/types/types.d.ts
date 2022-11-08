// Type definitions for pathoview-server
// Project: git+https://gitlab.cc-asp.fraunhofer.de/knecht/utilities-node.git

import 'utilities-node/types/types';

declare global {
    type ConfigAdditions = {
        server: {
            openWeatherMapApiKey: string
        }
        keycloakConfig: {
            adminClientPasswordFile: string
        }
    }
    type ConfigWithAdditions = Config & ConfigAdditions;
    interface KeycloakAdminService {
        initialize(),
        close(),
        getUsers(),
        getRoles(),
        getGroups()
    }
}
