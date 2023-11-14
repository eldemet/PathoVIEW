import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {modelUtilities, alertUtilities, deviceUtilities, missionUtilities, locationUtilities} from '../../utilities';
import './map.scss';

class MapView extends BasicView {

    /** @type {import('../../services/context-service').ContextService} */
    contextService;
    mapEvents = ['baselayerchange', 'overlayremove', 'overlayadd'];
    hiddenOverlays = this.catchError(JSON.parse)(localStorage.getItem('leaflet-hidden-overlays')) || [];
    handledTypes = [
        {name: 'alert', contextServicePropety: 'alerts', utilities: alertUtilities},
        {name: 'mission', contextServicePropety: 'missions', utilities: missionUtilities},
        {name: 'device', contextServicePropety: 'devices', utilities: deviceUtilities}
    ];

    /**
     * @param {ConstructorParameters<typeof BasicView>} rest
     */
    constructor(...rest) {
        super(...rest);
        this.contextService = this.proxy.get('context');
    }

    async attached() {
        super.attached();
        await this.contextService.initialized();
        this.users = (await this.proxy.get('auth').getUsers()).objects;
        this.userId = this.proxy.get('auth').getUserId();
        let overlay = [];
        for (const handledType of this.handledTypes) {
            if (this.contextService[handledType.contextServicePropety]) {
                //TODO handle updates differently
                this.subscriptions.push(this.bindingEngine.propertyObserver(this.contextService, handledType.contextServicePropety)
                    .subscribe(async(newValue, oldValue) => {
                        this.updateLayerGroup(handledType.name, this.contextService[handledType.contextServicePropety], handledType.utilities);
                    }));
                overlay.push(this.getLayerGroup(handledType.name, this.contextService[handledType.contextServicePropety], handledType.utilities));
            }
        }
        try {
            this.defaultCenter = locationUtilities.getCenter(this.contextService.currentEmergencyEvent.location);
        } catch (error) {
            //silently catch error
        }
        this.subscriptions.push(this.eventAggregator.subscribe('notification-model', async payload => {
            let type = payload.contentType.toLowerCase();
            let handledType = this.handledTypes.find(t => t.name === type);
            if (handledType) {
                //TODO only update single layer and not whole layer group
                await new Promise((resolve) => setTimeout(resolve, 500)); // wait until model service has updated objects
                this.updateLayerGroup(type, this.contextService[handledType.contextServicePropety], handledType.utilities);
            }
        }));
        this.subscriptions.push(this.eventAggregator.subscribe('aurelia-leaflet', event => {
            this.logger.debug('aurelia-leaflet', event);
            if (event.type.startsWith('overlay')) {
                if (event.type === 'overlayremove') {
                    this.hiddenOverlays.push(event.layer?.options?.model);
                } else if (event.type === 'overlayadd') {
                    this.hiddenOverlays.splice(this.hiddenOverlays.indexOf(event.layer?.options?.model), 1);
                }
                const layer = this.layers.overlay.find(x => x?.options?.model === event.layer?.options?.model);
                if (layer) {
                    layer.options.hidden = event.type === 'overlayremove';
                }
                localStorage.setItem('leaflet-hidden-overlays', JSON.stringify(this.hiddenOverlays));
            } else if (event.type.startsWith('popup')) {
                let activePopup;
                if (event.type === 'popupopen') {
                    activePopup = event.layer?.options?.id;
                } else if (event.type === 'popupclose') {
                    activePopup = '';
                }
                localStorage.setItem('leaflet-active-popup', activePopup);
            } else if (event.type === 'baselayerchange') {
                localStorage.setItem('leaflet-base-layer', event.layer.options.id);
            }
        }));
        this.layers = {
            base: [
                {
                    id: 'OpenStreetMap Tiles',
                    type: 'tile',
                    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    options: {
                        id: 'osm',
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> ' + this.i18n.tr('model.contributor', {count: 2}),
                        className: 'map-tiles',
                        hidden: localStorage.getItem('leaflet-base-layer') === 'otm'
                    }
                },
                {
                    id: 'OpenTopoMap Tiles',
                    type: 'tile',
                    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                    options: {
                        id: 'otm',
                        attribution: '&copy; <a href="https://opentopomap.org/credits" target="_blank">OpenTopoMap</a> ' + this.i18n.tr('model.contributor', {count: 2}) + ' <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank">CC-BY-SA</a>',
                        className: 'map-tiles',
                        hidden: localStorage.getItem('leaflet-base-layer') !== 'otm'
                    }
                }
            ],
            overlay
        };
    }

    updateLayerGroup(type, objects, utilities) {
        if (objects) {
            let layers = Object.assign({}, this.layers);
            let oldAlertLayerGroup = layers.overlay.find(x => x?.options?.model === type);
            if (oldAlertLayerGroup) {
                layers.overlay.splice(layers.overlay.indexOf(oldAlertLayerGroup), 1);
            }
            layers.overlay.push(this.getLayerGroup(type, objects, utilities));
            this.layers = layers;
        }
    }

    getLayerGroup(type, objects, utilities) {
        let id = `<i class="bi-${modelUtilities.getIconByType(type)} me-1"></i>` + this.i18n.tr('model.' + type, {count: 2});
        let activePopup = localStorage.getItem('leaflet-active-popup');
        return {
            id,
            type: 'layerGroup',
            options: {model: type, hidden: this.hiddenOverlays.includes(type)},
            layers: objects.map(object => {
                let owners = this.getOwners(object.owner);
                let popupContent = `<h6><i class="bi-${modelUtilities.getIconByType(type)}"></i> ${object.name || this.i18n.tr('model.' + type)}</h6>`;
                if (object.description) {
                    popupContent += `<p>${object.description}</p>`;
                }
                if (owners.length > 0) {
                    popupContent += `<p>${owners.join(', ')}</p>`;
                }
                try {
                    popupContent += locationUtilities.getMapLinkContent(object.location);
                } catch (error) {
                    // object does not proper location with coordinates
                }
                let customPopupContent = utilities.getCustomPopupContent?.(object, this.i18n, owners);
                if (customPopupContent) {
                    popupContent += customPopupContent;
                }
                const options = Object.assign({}, utilities.getOptions?.(), {id: object.id, popup: activePopup === object.id});
                return {
                    id: object.id,
                    type: 'geoJSON',
                    divIconContent: `<i class="bi-${modelUtilities.getIconByType(type)} bg-white ${Array.isArray(object.owner) && object.owner.includes(this.userId) ? 'text-primary h5' : 'h6'}" />`,
                    data: object.location,
                    events: ['popupopen', 'popupclose'],
                    options,
                    popupContent: popupContent
                };
            })
        };
    }

    getOwners(ownerIds) {
        if (!ownerIds) ownerIds = [];
        return this.users.filter(u => ownerIds.includes(u.id)).map(u => (u.firstName || u.lastName) ? `${u.firstName} ${u.lastName} (${u.username})` : u.username);
    }

}

export {MapView};
