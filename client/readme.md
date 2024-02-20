# PathoVIEW client

PathoVIEW frontend implemented as single-page web application. For Android devices, the app is enhanced using the cross-platform native runtime Capacitor, which provides access to native hardware and APIs like camera, native notifications (e.g. vibration and sound on success or error) and background location-tracking.

## Run dev app

Run `npm start`, then open `http://localhost:8080`

## Build for production

Run `npm run build`.

## Analyze bundle

To enable Webpack Bundle Analyzer, run `npm run analyze`, then open http://localhost:8888.

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
* [tact-js](https://github.com/bhaptics/tact-js) library for bHaptics Haptic Devices, bHaptics Player has to be installed (window) and running.

The modules used by library-aurelia:

* [aurelia-dialog](https://github.com/aurelia/dialog) Aurelia dialog plugin
* [aurelia-fetch-client](https://github.com/aurelia/fetch-client) Aurelia fetch client plugin
* [aurelia-i18n](https://github.com/aurelia/i18n) Aurelia internationalization plugin
* [aurelia-validation](https://github.com/aurelia/validation) Aurelia form validation plugin
* [bootstrap](https://getbootstrap.com/) frontend toolkit to build responsive sites
* [bootstrap-icons](https://icons.getbootstrap.com/) icon library
* [i18next](https://www.i18next.com/overview/getting-started) internationalization framework
* [i18next-http-backend](https://github.com/i18next/i18next-http-backend) i18next backend to load resources from a backend server using the XMLHttpRequest or the fetch API
* [lodash](https://lodash.com/) utility library
* [numeral](http://numeraljs.com/) library for formatting and manipulating numbers

For more information about the licences of the modules check [licenses_modules](docs/licenses_modules.md)

## Android app

- install [Android Studio](https://developer.android.com/studio)
- clone repository in same directory as PathoVIEW project `git clone https://gitlab.cc-asp.fraunhofer.de/pathocert/pathoview-android-middleware.git`
- run `npm run build:android` to sync bundled client files to Android project
- open project in Android Studio
- connect Android device or set up a virtual device
- build and run app
