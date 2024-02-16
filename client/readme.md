# PathoVIEW client

## Run dev app

Run `npm start`, then open `http://localhost:8080`

To enable Webpack Bundle Analyzer, run `npm run-script analyze`.

## Build for production

Run `npm run-script build`.

## Node Modules

Following modules are used in PathoVIEW client:

* [aurelia](https://github.com/aurelia/framework) front-end JavaScript framework 
* [library-aurelia](https://gitlab.cc-asp.fraunhofer.de/knecht/library-aurelia.git) modules, services, views and components for Aurelia
* [keycloak-js](https://github.com/keycloak/keycloak) authentication, authorization, Single-Sign On
* [leaflet](https://github.com/Leaflet/Leaflet) mobile-friendly interactive maps
* [leaflet-geoman-free](https://github.com/geoman-io/leaflet-geoman) Leaflet plugin for creating and editing geometry layers
* [leaflet-geosearch](https://github.com/smeijer/leaflet-geosearch) Leaflet plugin for geosearching
* [fabric](https://github.com/fabricjs/fabric.js) easily create simple shapes like rectangles, circles, triangles and other polygons
* [turf](https://github.com/Turfjs/turf/) geospatial engine, spatial operations and helper functions
* [capacitor](https://github.com/ionic-team/capacitor) cross-platform native runtime
* [capacitor-background-fetch](https://github.com/transistorsoft/capacitor-background-fetch) Background Fetch for Capacitor
* [capacitor-background-geolocation](https://github.com/transistorsoft/capacitor-background-geolocation) Background Geolocation for Capacitor with battery-conscious motion-detection intelligence

For more information about the licences of the modules check [licenses_modules](docs/licenses_modules.md)

## Android app

- install [Android Studio](https://developer.android.com/studio)
- clone repository in same directory as PathoVIEW project `git clone https://gitlab.cc-asp.fraunhofer.de/pathocert/pathoview-android-middleware.git`
- run `npm run-script build:android` to sync bundled client files to Android project
- open project in Android Studio
- connect Android device or set up a virtual device
- build and run app
