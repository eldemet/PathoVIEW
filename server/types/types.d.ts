// Type definitions for pathoview-server
// Project: git+https://gitlab.cc-asp.fraunhofer.de/pathocert/pathoview.git

import 'utilities-node/types/types';

declare global {
    type ConfigAdditions = {
        server: {
            openWeatherMapApiKeyFile: string
        }
        keycloakConfig: {
            adminClientUser: string,
            adminClientPasswordFile: string
        }
    }
    type ConfigWithAdditions = Config & ConfigAdditions;

    interface KeycloakAdminService extends IService {
        getUsers(),

        getRoles(),

        getGroups()
    }
}
