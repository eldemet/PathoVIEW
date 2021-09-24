import {BasicComponent} from 'library-aurelia/src/prototypes/basic-component';
import {bindable} from 'aurelia-framework';
import Leaflet from 'leaflet';
import 'leaflet/dist/images/layers.png';
import 'leaflet/dist/images/layers-2x.png';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-icon-2x.png';
import 'leaflet/dist/images/marker-shadow.png';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

export class LeafletCustomElement extends BasicComponent {

    @bindable layers;
    @bindable mapEvents;
    @bindable mapOptions;
    @bindable withLayerControl;
    @bindable withScaleControl;
    @bindable withEditControl;
    @bindable center;

    defaultMapOptions = {zoomLevel: 12};

    defaultLayers = {
        base: [
            {
                id: 'OSM Tiles',
                type: 'tile',
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                options: {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }
            }
        ],
        overlay: []
    };

    attachedLayers = {
        base: {},
        overlay: {}
    };

    constructor(...rest) {
        super(...rest);
        this.L = Leaflet;
        Leaflet.Icon.Default.imagePath = 'assets/';
        this.layerFactory = new LayerFactory(this.L);
        this.mapInit = new Promise((resolve, reject) => {
            this.mapInitResolve = resolve;
            this.mapInitReject = reject;
        });
        this.eventsBound = new Promise((resolve, reject) => {
            this.eventsBoundResolve = resolve;
            this.eventsBoundReject = reject;
        });
        this.layers = this.defaultLayers;
    }

    async attached() {
        let mapOptions = this.defaultMapOptions;
        if (this.mapOptions) {
            mapOptions = this._.merge({}, this.defaultMapOptions, this.mapOptions);
        }
        let center = {lat: 48.783333, lng: 9.183333};
        if (!this.center) {
            if (navigator.geolocation) {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                center = {lng: pos.coords.longitude, lat: pos.coords.latitude};
            }
        }
        return new Promise((resolve, reject) => {
            if (!this.map) {
                this.map = this.L.map('map', mapOptions);
            }
            if (this.map) {
                this.mapInitResolve();
            } else {
                this.mapInitReject();
                reject();
            }
            if (this.mapEvents) {
                this.eventsBound.then(() => {
                    this.map.setView([center.lat, center.lng], mapOptions.zoomLevel);
                });
            } else {
                this.map.setView([center.lat, center.lng], mapOptions.zoomLevel);
            }
            this.attachLayers();
            this.withLayerControlChanged();
            this.withScaleControlChanged();
            this.withEditControlChanged();
            resolve();
        });
    }

    attachLayers() {
        let layersToAttach = {base: {}, overlay: {}};
        let layers = Object.assign({}, this.defaultLayers, this.layers);
        if (layers.hasOwnProperty('base')) {
            for (let layer of layers.base) {
                const id = this.getLayerId(layer);
                if (!this.attachedLayers.base.hasOwnProperty(id)) {
                    layersToAttach.base[id] = this.layerFactory.getLayer(layer);
                }
            }
        }
        if (layers.hasOwnProperty('overlay')) {
            for (let layer of layers.overlay) {
                const id = this.getLayerId(layer);
                if (!this.attachedLayers.overlay.hasOwnProperty(id)) {
                    layersToAttach.overlay[this.getLayerId(layer)] = this.layerFactory.getLayer(layer);
                }
            }
        }
        this.mapInit.then(() => {
            for (let layerId in layersToAttach.base) {
                this.attachedLayers.base[layerId] = layersToAttach.base[layerId].addTo(this.map);
            }
            for (let layerId in layersToAttach.overlay) {
                this.attachedLayers.overlay[layerId] = layersToAttach.overlay[layerId].addTo(this.map);
            }
        });
    }

    removeOldLayers(oldLayers, type) {
        if (!oldLayers || !oldLayers.length) {
            return;
        }
        let removedLayers = oldLayers.filter((oldLayer) => {
            let removed = true;
            if (this.layers.hasOwnProperty(type)) {
                for (let newLayer of this.layers[type]) {
                    if (this.getLayerId(newLayer) === this.getLayerId(oldLayer)) {
                        removed = false;
                    }
                }
            }
            return removed;
        });
        for (let removedLayer of removedLayers) {
            this.mapInit.then(() => {
                let id = this.getLayerId(removedLayer);
                if (this.attachedLayers[type].hasOwnProperty(id)) {
                    this.map.removeLayer(this.attachedLayers[type][id]);
                    delete this.attachedLayers[type][this.getLayerId(removedLayer)];
                }
            });
        }
    }

    getLayerId(layer) {
        let id = layer.id ? layer.id : layer.url;
        if (!id) {
            throw new AureliaLeafletException('Not possible to get id for layer. Set the id property');
        }
        return id;
    }

    layersChanged(newLayers, oldLayers) {
        if (oldLayers) {
            this.removeOldLayers(oldLayers.base, 'base');
            this.removeOldLayers(oldLayers.overlay, 'overlay');
        }
        this.attachLayers();
    }

    mapOptionsChanged(newOptions, oldOptions) {
        this.mapInit.then(() => {
            if (oldOptions) {
                if (this.mapOptions.zoom !== oldOptions.zoom) {
                    this.map.setZoom(this.mapOptions.zoom);
                }
                if (this.mapOptions.maxBounds !== oldOptions.maxBounds) {
                    this.map.setMaxBounds(this.mapOptions.maxBounds);
                }
            }
        });
    }

    centerChanged(newCenter, oldCenter) {
        this.mapInit.then(() => {
            if (oldCenter) {
                if (this.center !== oldCenter) {
                    this.map.setView(this.center);
                }
            }
        });
    }

    mapEventsChanged(newEvents, oldEvents) {
        this.mapInit.then(() => {
            if (newEvents && newEvents.length) {
                for (let eventName of newEvents) {
                    this.map.on(eventName, (e) => this.eventAggregator.publish('aurelia-leaflet', Object.assign(e, {map: this.map})));
                }
            }
            if (oldEvents !== null) {
                for (let removedEvent of oldEvents.filter((e) => newEvents.indexOf(e) === -1)) {
                    this.map.off(removedEvent);
                }
            }
            if (!this.eventsBound.resolved) {
                this.eventsBoundResolve();
            }
        });
    }

    withLayerControlChanged() {
        this.mapInit.then(() => {
            if (this.layerControl) {
                this.map.removeControl(this.layerControl);
            }
            if (this.withLayerControl) {
                this.layerControl = this.L.control.layers(this.attachedLayers.base, this.attachedLayers.overlay, this.withLayerControl).addTo(this.map);
            }
        });
    }

    withScaleControlChanged() {
        this.mapInit.then(() => {
            if (this.scaleControl) {
                this.map.removeControl(this.scaleControl);
            }
            if (this.withScaleControl) {
                this.scaleControl = this.L.control.scale(this.withScaleControl).addTo(this.map);
            }
        });
    }

    withEditControlChanged() {
        this.mapInit.then(() => {
            if (this.map.pm.controlsVisible()) {
                this.map.pm.removeControls();
            }
            if (this.withEditControl) {
                this.map.pm.addControls(this.withEditControl);
                this.map.pm.setLang(this.i18n.getLocale());
                this.map.on('pm:create', e => {
                    const pmEventHandler = ev => {
                        let geoJSON = e.layer.toGeoJSON();
                        geoJSON.properties = Object.assign({}, e.layer.options, {
                            shape: e.shape,
                            name: 'leaflet_id ' + e.layer._leaflet_id,
                            category: 'default'
                        });
                        this.eventAggregator.publish(ev.type, geoJSON);
                    };
                    pmEventHandler(e);
                    const pmEvents = ['pm:edit', 'pm:update', 'pm:remove', 'pm:drag', 'pm:rotate'];
                    for (let pmEvent of pmEvents) {
                        e.layer.on(pmEvent, pmEventHandler);
                    }
                });
            }
        });
    }

}

export class AureliaLeafletException {

    name = 'AureliaLeafletException';

    constructor(message) {
        this.message = message;
    }

}

class LayerFactory {

    constructor() {
        this.L = Leaflet;
    }

    getLayer(layer) {
        if (!layer.hasOwnProperty('type')) {
            layer.type = 'tile';
        }
        let instance;
        switch (layer.type) {
            case 'marker':
                instance = this.getMarker(layer);
                break;
            case 'popup':
                instance = this.getPopup(layer);
                break;
            case 'tile':
                instance = this.getTile(layer);
                break;
            case 'wms':
                instance = this.getWMS(layer);
                break;
            case 'canvas':
                instance = this.getCanvas(layer);
                break;
            case 'imageOverlay':
                instance = this.getImageOverlay(layer);
                break;
            case 'polyline':
                instance = this.getPolyline(layer);
                break;
            case 'multiPolyline':
                instance = this.getMultiPolyline(layer);
                break;
            case 'polygone':
                instance = this.getPolygone(layer);
                break;
            case 'multiPolygone':
                instance = this.getMultiPolygone(layer);
                break;
            case 'rectangle':
                instance = this.getRectangle(layer);
                break;
            case 'circle':
                instance = this.getCircle(layer);
                break;
            case 'circleMarker':
                instance = this.getCircleMarker(layer);
                break;
            case 'group':
                instance = this.getLayerGroup(layer);
                break;
            case 'featureGroup':
                instance = this.getFeatureGroup(layer);
                break;
            case 'geoJSON':
                instance = this.getGeoJson(layer);
                break;
            default:
                throw new AureliaLeafletException(`Layer type ${layer.type} not implemented`);
        }
        if (typeof layer.initCallback === 'function') {
            layer.initCallback(instance);
        }
        if (layer.hasOwnProperty('events')) {
            for (let e of layer.events) {
                if (typeof instance.on === 'function') {
                    instance.on(e.name, e.callback);
                }
            }
        }
        return instance;
    }

    getMarker(layer) {
        if (!layer.hasOwnProperty('latLng')) {
            throw new AureliaLeafletException('No latLng given for layer.type "marker"');
        }
        let marker = this.L.marker(layer.latLng, layer.options);
        if (layer.hasOwnProperty('popupContent')) {
            marker.bindPopup(layer.popupContent).openPopup();
        }
        return marker;
    }

    getPopup(layer) {
        let popup = this.L.popup(layer.options);
        if (layer.hasOwnProperty('content')) {
            popup.setContent(layer.content);
        }
        if (layer.hasOwnProperty('latLng')) {
            popup.setLatLng(layer.latLng);
        }
        return popup;
    }

    getTile(layer) {
        if (!layer.hasOwnProperty('url')) {
            throw new AureliaLeafletException('No url given for layer.type "tile"');
        }
        return this.L.tileLayer(layer.url, layer.options);
    }

    getWMS(layer) {
        if (!layer.hasOwnProperty('url')) {
            throw new AureliaLeafletException('No url given for layer.type "wms"');
        }
        return this.L.tileLayer.wms(layer.url, layer.options);
    }

    getCanvas(layer) {
        let l = this.L.tileLayer.canvas(layer.options);
        if (layer.hasOwnProperty('drawTile')) {
            l.drawTile = layer.drawTile;
        }
        if (layer.hasOwnProperty('tileDrawn')) {
            l.tileDrawn = layer.tileDrawn;
        }
        return l;
    }

    getImageOverlay(layer) {
        if (!layer.hasOwnProperty('url')) {
            throw new AureliaLeafletException('No url given for layer.type "imageOverlay"');
        }
        if (!layer.hasOwnProperty('imageBounds')) {
            throw new AureliaLeafletException('No imageBounds given for layer.type "imageOverlay"');
        }
        return this.L.imageOverlay(layer.url, layer.imageBounds, layer.options);
    }

    getPolyline(layer) {
        if (!layer.hasOwnProperty('latLngs')) {
            throw new AureliaLeafletException('No latLngs given for layer.type "polyline"');
        }
        return this.L.polyline(layer.latlngs, layer.options);
    }

    getMultiPolyline(layer) {
        if (!layer.hasOwnProperty('latLngs')) {
            throw new AureliaLeafletException('No latLngs given for layer.type "multiPolyline"');
        }
        return this.L.multiPolyline(layer.latlngs, layer.options);
    }

    getPolygone(layer) {
        if (!layer.hasOwnProperty('latLngs')) {
            throw new AureliaLeafletException('No latLngs given for layer.type "polygone"');
        }
        return this.L.polygone(layer.latlngs, layer.options);
    }

    getMultiPolygone(layer) {
        if (!layer.hasOwnProperty('latLngs')) {
            throw new AureliaLeafletException('No latLngs given for layer.type "multiPolygone"');
        }
        return this.L.multiPolygone(layer.latlngs, layer.options);
    }

    getRectangle(layer) {
        if (!layer.hasOwnProperty('bounds')) {
            throw new AureliaLeafletException('No bounds given for layer.type "rectangle"');
        }
        return this.L.rectangle(layer.bounds, layer.options);
    }

    getCircle(layer) {
        if (!layer.hasOwnProperty('latLng')) {
            throw new AureliaLeafletException('No latLng given for layer.type "circle"');
        }
        if (!layer.hasOwnProperty('radius')) {
            throw new AureliaLeafletException('No radius given for layer.type "circle"');
        }
        return this.L.circle(layer.latLng, layer.radius, layer.options);
    }

    getCircleMarker(layer) {
        if (!layer.hasOwnProperty('latLng')) {
            throw new AureliaLeafletException('No latLng given for layer.type "circleMarker"');
        }
        return this.L.circleMarker(layer.latLng, layer.options);
    }

    getLayerGroup(layer) {
        if (!layer.hasOwnProperty('layers')) {
            throw new AureliaLeafletException('No layers given for layer.type "group"');
        }
        let layers = [];
        for (let l of layer.layers) {
            layers.push(this.getLayer(l));
        }
        return this.L.layerGroup(layers);
    }

    getFeatureGroup(layer) {
        if (!layer.hasOwnProperty('layers')) {
            throw new AureliaLeafletException('No layers given for layer.type "featureGroup"');
        }
        let layers = [];
        for (let l of layer.layers) {
            layers.push(this.getLayer(l));
        }
        return this.L.featureGroup(layers);
    }

    getGeoJson(layer) {
        if (!layer.hasOwnProperty('data')) {
            throw new AureliaLeafletException('No data property given for layer.type "geoJSON"');
        }
        return this.L.geoJson(layer.data, layer.options);
    }

}
