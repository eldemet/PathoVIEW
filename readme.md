# PathoVIEW

## Run app using docker compose

- clone repository `git clone https://gitlab.cc-asp.fraunhofer.de/pathocert/pathoview.git`
- create directory certificates `mkdir certificates`
- upload certificate `server.crt` and key `server.key` to certificates directory
- navigate to app directory `cd pathoview`
- create .env file `cp ./server/dotenv.example .env`
- adapt .env file `nano .env`
  - comment out variables that should use default value using `#`
  - required variables are `MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD, KEYCLOAK_PASSWORD, SERVER_OPEN_WEATHER_MAP_API_KEY`
- start app `docker-compose up`
- open keycloak in browser `https://localhost:9990`
- open api documentation `https://localhost/docs`
- open client `https://localhost`
