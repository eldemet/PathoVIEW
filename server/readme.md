# PathoVIEW server

PathoVIEW backend for serving client files, data persistence and API to access data.

## Environment variables

Adapt environment files as needed:

- **SERVER_PORT** - default value is 3002
- **SERVER_PROTOCOL** - http / https
- **SERVER_SSL_CERT_FILE** - path to SSL cert file (necessary if https)
- **SERVER_SSL_KEY_FILE** - path to SSL key file (necessary if https)
- **SERVER_LOG_LEVEL_CONSOLE** - npm logging levels: error, warn, info, http, verbose, debug, silly
- **SERVER_LOG_LEVEL_FILE**
- **SERVER_OPEN_WEATHER_MAP_API_KEY_FILE** - path to text file including OpenWeatherMap API key
- **KEYCLOAK_CONFIG_AUTH_SERVER_URL** - path to Keycloak auth server url
- **KEYCLOAK_CONFIG_ADMIN_CLIENT_USER** - admin client username to be able to receive users, roles and groups
- **KEYCLOAK_CONFIG_ADMIN_CLIENT_PASSWORD_FILE** - path to admin client password text file
- **KEYCLOAK_SCHEME_FLOW**
- **DATABASE_JSONDB_PATH** - adapt path to data
- **PATHOWARE_NORTHBOUND_API** - OPTIONAL to activate PathoWARE middleware
- **PATHOWARE_DATA_CONNECTOR_API** - OPTIONAL to activate PathoWARE middleware

## Run Node.js application

- Optional: Copy bundled client files to  `server/client`.
- Run `npm start`.
- Open API documentation https://localhost:3002/docs.
- Open client UI https://localhost:3002/ (if client files are available).

## Node Modules

Following modules are used in PathoVIEW server:

- [utilities-node](https://gitlab.cc-asp.fraunhofer.de/knecht/utilities-node.git) Node.js framework, utilities and middleware
- [keycloak-admin-client](https://github.com/keycloak/keycloak) Keycloak Admin Client

The technology stack of the utilities-node package:

- Routing and HTTP tools
    - fast, unopinionated, minimalist web framework [express](http://expressjs.com/)
    - body parsing middleware [body-parser](https://github.com/expressjs/body-parser#readme)
    - window.fetch in Node.js applications with [node-fetch](https://www.npmjs.com/package/node-fetch)
- API specification, visualization and testing
    - API description format for REST APIs [OpenAPI](https://github.com/OAI/OpenAPI-Specification)
    - unopinionated, performant and extensively tested express based OpenAPI framework [express-openapi](https://github.com/kogosoftwarellc/open-api/tree/master/packages/express-openapi#readme)
    - living documentation for APIs with [Swagger UI](https://www.npmjs.com/package/swagger-ui)
- data persistence
    - document based NoSQL database [MongoDB](https://www.mongodb.com/de) with object modelling [mongoose](https://mongoosejs.com/)
  
  ALTERNATIVELY

    - file based database jsonDB that provides similar functionality and query interfaces as mongoose (using [sift](https://github.com/crcn/sift.js))
- schema validation
    - annotate and validate JSON documents with [JSON schema](https://json-schema.org/)
    - JSON schema validator [ajv](https://github.com/epoberezkin/ajv)
    - JSON schema simplification with [json-schema-merge-allof](https://github.com/mokkabonna/json-schema-merge-allof) and [json-schema-ref-parser](https://github.com/APIDevTools/json-schema-ref-parser)
- security
    - [JsonWebTokens (JWT)](https://jwt.io/) based endpoint protection with [keycloak-connect](https://www.npmjs.com/package/keycloak-connect)
    - resource restriction with [Cross-origin resource sharing (CORS)](https://github.com/expressjs/cors#readme)
- logging
    - HTTP request logger middleware [morgan](https://github.com/expressjs/morgan#readme)
    - simple and universal logging library with support for multiple transports [winston](https://github.com/winstonjs/winston#readme)

For more information about the licences of the modules check [licenses_modules](docs/licenses_modules.md)
