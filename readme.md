# PathoVIEW

- PathoVIEW includes a comprehensive web app for cross platform usage and an app that can be installed on any Android smartphone or tablet. The Android app can connect with a smartwatch for notifications on the wrist, as well as a haptic vest for on body vibrations as alerting system via Bluetooth. Vibrations and sounds provided by the mobile or the connected devices can communicate important information without distracting FR from the task at hand, especially in the visual field.
- PathoVIEW provides a dashboard with details about the emergency event and information like weather data that helps to better assess the current situation and plan the according actions.
- PathoVIEW allows to receive and create missions and alerts. FIWARE Smart Data Models ensure a standardised exchange system for apps that implement the same.
- PathoVIEW warns FR if they are getting close or entering a danger zone (e.g. contaminated water) leveraging the location capabilities of the smartphone.
- PathoVIEW also provides interactive instructions with texts and pictures for setting up different devices that allow the detection of microbiological contamination as well as an encyclopaedia for different pathogens.

## Documentation

* [PathoVIEW client](client/readme.md)
* [PathoVIEW server](server/readme.md)
* [UML deployment diagram](server/docs/uml/deployment.puml)
* [UML object diagram](server/docs/uml/object-diagram.puml)

## Run web app using docker compose

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
