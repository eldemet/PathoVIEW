import {BasicComponent} from 'library-aurelia/src/prototypes/basic-component';
import {LogManager, bindable} from 'aurelia-framework';
import merge from 'lodash/merge';
import 'leaflet/dist/images/layers.png';
import 'leaflet/dist/images/layers-2x.png';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-icon-2x.png';
import 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import 'leaflet-geosearch/assets/css/leaflet.css';
import './leaflet.scss';
import {locationUtilities} from '../../utilities';
import {NotificationType} from '../../services/notification-service';

export class LeafletCustomElement extends BasicComponent {

    @bindable containerId;
    @bindable layers;
    @bindable mapEvents;
    @bindable layerEvents;
    @bindable mapOptions;
    @bindable withLayerControl;
    @bindable withScaleControl;
    @bindable withEditControl;
    @bindable withSearchControl;
    @bindable center;
    @bindable defaultCenter;

    initialized = new Promise((resolve, reject) => {
        this.initializeResolve = resolve;
    });

    defaultMapOptions = {zoomLevel: 12};

    defaultLayers = {
        base: [
            {
                id: 'OSM Tiles',
                type: 'tile',
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                options: {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> ' + this.i18n.tr('model.contributor', {count: 2}),
                    className: 'map-tiles'
                }
            }
        ],
        overlay: []
    };

    attachedLayers = {
        base: {},
        overlay: {}
    };

    /**
     * @param {ConstructorParameters<typeof BasicComponent>} rest
     */
    constructor(...rest) {
        super(...rest);
        this.layers = this.defaultLayers;
        this.containerId = 'map';
    }

    async attached() {
        super.attached();
        this.L = await import('leaflet');
        await import('@geoman-io/leaflet-geoman-free');
        this.Geosearch = await import('leaflet-geosearch');
        this.L.Icon.Default.imagePath = 'assets/';
        this.layerFactory = new LayerFactory(this.L);
        let mapOptions = this.defaultMapOptions;
        if (this.mapOptions) {
            mapOptions = merge({}, this.defaultMapOptions, this.mapOptions);
        }
        let center = this.center || this.defaultCenter || {lat: 48.783333, lng: 9.183333};
        if (!this.center) {
            try {
                // @ts-ignore
                center = await locationUtilities.getCurrenPosition();
            } catch (error) {
                this.logger.warn(error.message);
                // eslint-disable-next-line no-undef
                const message = window.isSecureContext && error instanceof GeolocationPositionError ? 'alerts.geoLocationDenied' : 'alerts.geoLocationUnavailable';
                this.eventAggregator.publish('toast', {
                    title: 'alerts.geoLocation',
                    body: message,
                    biIcon: 'geo-alt',
                    autohide: false,
                    dismissible: true,
                    type: NotificationType.Warning
                });
            }
        }
        // @ts-ignore
        this.map = this.L.map(this.containerId, mapOptions);
        this.map.setView(center, mapOptions.zoomLevel);
        if (mapOptions.fitBounds) {
            try {
                this.map.fitBounds(mapOptions.fitBounds);
            } catch (error) {
                // handle silently
            }
        }
        this.attachLayers();
        this.setMapEvents();
        this.setLayerEvents();
        this.setScaleControl();
        this.setLayerControl();
        this.setEditControl();
        this.setSearchControl();
        this.initializeResolve();
    }

    detached() {
        super.detached();
        this.initialized = new Promise(resolve => {
            this.initializeResolve = resolve;
        });
        try {
            this.map.remove();
        } catch (error) {
            //handle silently
        }
    }

    getLayerId(layer) {
        let id = layer.id ? layer.id : layer.url;
        if (!id) {
            throw new AureliaLeafletException('Not possible to get id for layer. Set the id property');
        }
        return id;
    }

    async layersChanged(newLayers, oldLayers) {
        await this.initialized;
        if (oldLayers) {
            Object.keys(this.attachedLayers.overlay).forEach((key, index) => {
                this.attachedLayers.overlay[key].off();
                for (let p in this.attachedLayers.overlay[key]._layers) {
                    this.attachedLayers.overlay[key]._layers[p].off();
                }
                this.attachedLayers.overlay[key].clearLayers();
                delete this.attachedLayers.overlay[key];
            });
        }
        this.attachLayers();
        await this.withLayerControlChanged();
    }

    attachLayers() {
        let layersToAttach = {base: {}, overlay: {}};
        let layers = Object.assign({}, this.defaultLayers, this.layers);
        if (layers.hasOwnProperty('base')) {
            for (let base of layers.base) {
                let id = this.getLayerId(base);
                if (!this.attachedLayers.base.hasOwnProperty(id)) {
                    try {
                        layersToAttach.base[id] = this.layerFactory.getLayer(base);
                    } catch (error) {
                        this.handleError(error);
                    }
                }
            }
        }
        if (layers.hasOwnProperty('overlay')) {
            for (let overlay of layers.overlay) {
                try {
                    let id = this.getLayerId(overlay);
                    layersToAttach.overlay[id] = this.layerFactory.getLayer(overlay, this.handleEvent);
                    if (overlay?.settings?.fitBounds) {
                        try {
                            this.map.fitBounds(layersToAttach.overlay[id].getBounds());
                        } catch (error) {
                            //silently handle error
                        }
                    }
                } catch (error) {
                    this.handleError(error);
                }
            }
        }
        for (let layerId in layersToAttach.base) {
            let layer = layersToAttach.base[layerId];
            this.attachedLayers.base[layerId] = layer;
            if (!layer.options.hidden) {
                layer.addTo(this.map);
            }
        }
        for (let layerId in layersToAttach.overlay) {
            let layer = layersToAttach.overlay[layerId];
            this.attachedLayers.overlay[layerId] = layer;
            if (!layer.options.hidden) {
                layer.addTo(this.map);
            }
            for (let key in layer._layers) {
                let l = layer._layers[key];
                if (l.options.popup) {
                    l.openPopup();
                    break;
                }
            }
        }
    }

    async mapOptionsChanged(newOptions, oldOptions) {
        await this.initialized;
        if (this.mapOptions.zoom !== oldOptions?.zoom) {
            this.map.setZoom(this.mapOptions.zoom);
        }
        if (this.mapOptions.maxBounds !== oldOptions?.maxBounds) {
            this.map.setMaxBounds(this.mapOptions.maxBounds);
        }
        if (this.mapOptions.fitBounds !== oldOptions?.fitBounds) {
            try {
                this.map.fitBounds(this.mapOptions.fitBounds);
            } catch (error) {
                // handle silently
            }
        }
    }

    async centerChanged(newCenter, oldCenter) {
        await this.initialized;
        this.map.setView(this.center);
    }

    async mapEventsChanged(newEvents, oldEvents) {
        await this.initialized;
        if (oldEvents) {
            for (let removedEvent of oldEvents.filter((e) => this.mapEvents.indexOf(e) === -1)) {
                this.map.off(removedEvent);
            }
        }
        this.setMapEvents();
    }

    setMapEvents() {
        if (this.mapEvents && this.mapEvents.length) {
            for (let eventName of this.mapEvents) {
                this.map.on(eventName, (e) => this.eventAggregator.publish('aurelia-leaflet', Object.assign(e, {map: this.map})));
            }
        }
    }

    async layerEventsChanged(newEvents, oldEvents) {
        await this.initialized;
        if (oldEvents) {
            this.map.off('pm:create');
        }
        this.setLayerEvents();
    }

    setLayerEvents() {
        if (this.layerEvents && this.layerEvents.length) {
            this.map.on('pm:create', e => {
                for (let layerEvent of this.layerEvents) {
                    e.layer.on(layerEvent, this.handleEvent);
                }
                this.handleEvent(e);
            });
        }
    }

    async withLayerControlChanged() {
        await this.initialized;
        if (this.layerControl) {
            this.map.removeControl(this.layerControl);
        }
        this.setLayerControl();
    }

    setLayerControl() {
        if (this.withLayerControl) {
            this.layerControl = this.L.control.layers(this.attachedLayers.base, this.attachedLayers.overlay, this.withLayerControl).addTo(this.map);
        }
    }

    async withScaleControlChanged() {
        await this.initialized;
        if (this.scaleControl) {
            this.map.removeControl(this.scaleControl);
        }
        this.setScaleControl();
    }

    setScaleControl() {
        if (this.withScaleControl) {
            this.scaleControl = this.L.control.scale(this.withScaleControl).addTo(this.map);
        }
    }

    async withEditControlChanged() {
        await this.initialized;
        if (this.map.pm.controlsVisible()) {
            this.map.pm.removeControls();
        }
        this.setEditControl();
    }

    setEditControl() {
        if (this.withEditControl) {
            this.map.pm.addControls(this.withEditControl);
            // @ts-ignore
            this.map.pm.setLang(this.i18n.getLocale());
        }
    }

    setSearchControl() {
        if (this.withSearchControl) {
            let provider = new this.Geosearch[this.withSearchControl.provider](this.withSearchControl.providerOptions);
            // @ts-ignore
            let control = new this.Geosearch.GeoSearchControl(Object.assign({}, this.withSearchControl, {provider}));
            this.map.addControl(control);
            this.map.on('geosearch/showlocation', this.handleSearchEvent);
        }
    }

    handleSearchEvent = ev => {
        let geoJson = ev.marker.toGeoJSON();
        geoJson.properties = Object.assign({}, ev.marker.options, {
            name: 'leaflet_id ' + ev.marker._leaflet_id,
            category: 'default'
        });
        for (let layerEvent of this.layerEvents) {
            ev.marker.on(layerEvent, this.handleEvent);
        }
        ev.marker.on('remove', this.handleSearchRemoveEvent);
        this.eventAggregator.publish('aurelia-leaflet', {
            type: 'geosearch:add',
            location: ev.location,
            map: this.map,
            geoJson: geoJson
        });
    };

    handleSearchRemoveEvent = ev => {
        this.eventAggregator.publish('aurelia-leaflet', {type: 'geosearch:remove'});
    };

    handleEvent = ev => {
        let geoJson = ev.layer.toGeoJSON();
        geoJson.properties = Object.assign({}, ev.layer.options, {
            shape: ev.shape,
            name: 'leaflet_id ' + ev.layer._leaflet_id,
            category: 'default'
        });
        this.eventAggregator.publish('aurelia-leaflet', Object.assign(ev, {
            map: this.map,
            geoJson: geoJson
        }));
    };

}

export class AureliaLeafletException {

    name = 'AureliaLeafletException';

    constructor(message) {
        this.message = message;
    }

}

class LayerFactory {

    constructor(L) {
        this.L = L;
        this.logger = LogManager.getLogger(this.constructor.name);
    }

    getLayer(layer, handleEvent) {
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
            case 'layerGroup':
                instance = this.getLayerGroup(layer, handleEvent);
                break;
            case 'featureGroup':
                instance = this.getFeatureGroup(layer, handleEvent);
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
                    instance.on(e, handleEvent);
                }
            }
        }
        if (layer.hasOwnProperty('popupContent')) {
            instance.bindPopup(layer.popupContent, {closeButton: false}).openPopup();
            instance.getPopup().on('remove', () => {
                instance.bringToBack();
            });
        }
        return instance;
    }

    getMarker(layer) {
        if (!layer.hasOwnProperty('latLng')) {
            throw new AureliaLeafletException('No latLng given for layer.type "marker"');
        }
        let options = Object.assign({}, layer.options);
        if (layer.divIconContent) {
            options.icon = this.L.divIcon({html: layer.divIconContent, className: ''});
        }
        return this.L.marker(layer.latLng, options);
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

    getLayerGroup(layer, handleEvent) {
        if (!layer.hasOwnProperty('layers')) {
            throw new AureliaLeafletException('No layers given for layer.type "group"');
        }
        let layers = [];
        for (let l of layer.layers) {
            try {
                layers.push(this.getLayer(l, handleEvent));
            } catch (error) {
                this.logger.error(error.message);
            }
        }
        return this.L.layerGroup(layers, layer.options);
    }

    getFeatureGroup(layer, handleEvent) {
        if (!layer.hasOwnProperty('layers')) {
            throw new AureliaLeafletException('No layers given for layer.type "featureGroup"');
        }
        let layers = [];
        for (let l of layer.layers) {
            layers.push(this.getLayer(l, handleEvent));
        }
        return this.L.featureGroup(layers);
    }

    getGeoJson(layer) {
        if (!layer.hasOwnProperty('data')) {
            throw new AureliaLeafletException('No data property given for layer.type "geoJSON"');
        }
        let options = Object.assign({}, layer.options);
        if (layer?.data?.type === 'Point') {
            options.pointToLayer = (feature, latLng) => this.getMarker({latLng, options: layer.options, divIconContent: layer.divIconContent});
        }
        return this.L.geoJson(layer.data, options);
    }

}
