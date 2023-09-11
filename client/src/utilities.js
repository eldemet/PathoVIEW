import get from 'lodash/get';
import {polygon} from '@turf/helpers';
import center from '@turf/center';
import distance from '@turf/distance';
import pointToLineDistance from '@turf/point-to-line-distance';
import polygonToLine from '@turf/polygon-to-line';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import {DateTime} from 'luxon';

function formatDate(value, format = 'f', i18n) {
    let result;
    try {
        let dt = typeof value === 'object' ? DateTime.fromJSDate(value) : DateTime.fromISO(value);
        if (dt.invalid) {
            throw new Error(dt.invalid);
        }
        result = dt.setLocale(i18n.getLocale()).toFormat(format);
    } catch (error) {
        result = i18n.tr('alerts.general.invalidDate');
    }
    return result;
}

export const modelUtilities = {
    getIconByType(type) {
        let icon;
        if (type === 'alert') {
            icon = 'alarm';
        } else if (type === 'device') {
            icon = 'phone';
        } else if (type === 'emergency-event' || type === 'emergencyEvent') {
            icon = 'hospital';
        } else if (type === 'mission') {
            icon = 'journal-medical';
        } else if (type === 'point-of-interest') {
            icon = 'pin-map-fill';
        } else if (type === 'pathogen') {
            icon = 'virus';
        }
        return icon;
    }
};

export const emergencyEventUtilities = {};

export const missionUtilities = {};

export const deviceUtilities = {
    getDeviceIcon(device) {
        let icon = 'bi-';
        if (device.manufacturer === 'Apple' || device.manufacturer === 'Google') {
            icon += 'phone';
        } else if (device?.osVersion?.includes('Mac')) {
            icon += 'apple';
        } else {
            icon += 'windows';
        }
        return icon;
    },
    getCustomPopupContent(device, i18n) {
        return `<p>${device.batteryLevel * 100} %</p>
                <p>${device.softwareVersion}</p>
                <p>${formatDate(device.dateModified, 'f', i18n)}</p>`;
    },
    async getBatteryLevel() {
        let batteryLevel = -1;
        // @ts-ignore
        if (typeof navigator.getBattery === 'function') {
            // @ts-ignore
            batteryLevel = (await navigator.getBattery()).level;
        }
        return batteryLevel;
    }
};

export const locationUtilities = {
    /**
     *
     * @param {undefined | 'geoJSON' | 'array'} [format]
     * @param {PositionOptions} [options]
     * @returns {Promise<{lng: number, lat: number}|{coordinates: number[], type: string}|number[]>}
     */
    async getCurrenPosition(format, options = {timeout: 5000, enableHighAccuracy: true}) {
        let position;
        try {
            const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, options));
            if (format === 'geoJSON') {
                position = {type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude]};
            } else if (format === 'array') {
                position = [pos.coords.longitude, pos.coords.latitude];
            } else {
                position = {lng: pos.coords.longitude, lat: pos.coords.latitude};
            }
        } catch (error) {
            throw error;
        }
        return position;
    },
    getCenter(location, format) {
        const pos = center(location).geometry.coordinates;
        let position;
        if (format === 'geoJSON') {
            position = {type: 'Point', coordinates: pos};
        } else if (format === 'array') {
            position = pos;
        } else {
            position = {lng: pos[0], lat: pos[1]};
        }
        return position;
    },
    distancePointToGeoJSON({from, to}) {
        if (to.type === 'Feature') {
            to = to.geometry;
        }
        let distanceResult;
        if (to.type === 'Point') {
            distanceResult = distance(from, to);
        } else if (to.type === 'Polygon') {
            if (to.coordinates.length > 1) { // Has holes
                const [exteriorDistance, ...interiorDistances] = to.coordinates.map(coords =>
                    locationUtilities.distancePointToGeoJSON({from, to: polygon([coords]).geometry})
                );
                if (exteriorDistance < 0) {
                    const smallestInteriorDistance = interiorDistances.reduce((smallest, current) => (current < smallest ? current : smallest));
                    if (smallestInteriorDistance < 0) {
                        distanceResult = smallestInteriorDistance * -1;
                    } else {
                        distanceResult = smallestInteriorDistance < exteriorDistance * -1 ? smallestInteriorDistance * -1 : exteriorDistance;
                    }
                } else {
                    distanceResult = exteriorDistance;
                }
            } else {
                distanceResult = pointToLineDistance(from, /** @type {any} */ (polygonToLine(to)));
                if (booleanPointInPolygon(from, to)) {
                    distanceResult = distanceResult * -1;
                }
            }
        } else if (to.type === 'MultiPolygon') {
            distanceResult = to.coordinates
                .map(coords => locationUtilities.distancePointToGeoJSON({from, to: polygon(coords).geometry}))
                .reduce((smallest, current) => (current < smallest ? current : smallest));
        } else if (to.type === 'LineString') {
            distanceResult = pointToLineDistance(from, to);
        } else {
            distanceResult = distance(from, center(to));
        }
        return distanceResult;
    },
    getMapLinkContent(location) {
        let coordinates = locationUtilities.getCenter(location);
        let url = (navigator.platform.indexOf('iP') !== -1) ? 'maps://maps.google.com/maps' : 'https://maps.google.com/maps';
        // @ts-ignore
        let query = `?daddr=${coordinates.lat},${coordinates.lng}&amp;ll=`;
        let route = url + query;
        return `<p><a href="${route}" target="_blank"><i class="bi-sign-turn-left me-1"></i>${location?.coordinates}</a></p>`;
    }
};

export const alertUtilities = {
    getSeverityIcon(severity) {
        let icon = 'bi-';
        let color;
        switch (severity) {
            case 'low':
                icon += 'arrow-down-circle';
                color = 'info';
                break;
            case 'medium':
                icon += 'arrow-right-square';
                color = 'warning';
                break;
            case 'high':
                icon += 'exclamation-triangle';
                color = 'warning';
                break;
            case 'critical':
                icon += 'exclamation-circle';
                color = 'danger';
                break;
            default:
                icon += 'info-circle';
                color = 'success';
        }
        return icon + ' text-' + color;
    },
    getCustomPopupContent(alert, i18n) {
        return `<p><i class="${alertUtilities.getSeverityIcon(alert.severity)}"></i> ${i18n.tr('enum.alert.severity.' + alert.severity.toLowerCase())}</p>
                <p>${i18n.tr('enum.alert.category.' + alert.category)}, ${i18n.tr('enum.alert.subCategory.' + alert.subCategory)}</p>
                <p>${alert.source}</p>
                <p>${formatDate(alert.dateIssued, 'f', i18n)}</p>`;
    },
    getISO7010WarningIcon(category, subCategory) {
        let icon = '001';
        if (subCategory === 'flood') {
            icon = '077';
        } else if (subCategory === 'tsunami') {
            icon = '056';
        } else if (subCategory === 'coastalEvent') {
            icon = '060';
        } else if (subCategory === 'earthquake') {
            icon = '035';
        } else if (subCategory === 'tornado') {
            icon = '074';
        } else if (subCategory === 'hurricane' || subCategory === 'tropicalCyclone') {
            icon = '064';
        } else if (subCategory === 'waterPollution') {
            icon = '072';
        } else if (subCategory === 'snow/ice') {
            icon = '010';
        } else if (subCategory === 'buildingFire' || subCategory === 'forestFire') {
            icon = '021';
        } else if (['fertilisation', 'irrigation', 'airPollution'].includes(subCategory)) {
            icon = '016';
        } else if (category === 'agriculture') {
            icon = '009';
        }
        return icon;
    },
    getOptions() {
        return {
            style: {
                color: '#ff0000',
                weight: 3,
                opacity: 0.5
            }
        };
    }
};

export const weatherUtilities = {
    weatherProperties: {
        temp: 'main.temp',
        feels_like: 'main.feels_like',
        pressure: 'main.pressure',
        humidity: 'main.humidity',
        visibility: 'visibility',
        speed: 'wind.speed',
        deg: 'wind.deg',
        gust: 'wind.gust',
        clouds: 'clouds.all',
        'rain1h': 'rain.1h',
        'rain3h': 'rain.3h',
        'snow1h': 'snow.1h',
        'snow3h': 'snow.3h'
    },
    weatherIcons: {
        temp: 'bi-thermometer',
        feels_like: 'bi-emoji-sunglasses',
        pressure: 'bi-chevron-double-down',
        humidity: 'bi-droplet',
        visibility: 'bi-eye',
        speed: 'bi-wind',
        deg: 'bi-compass',
        gust: '',
        clouds: 'bi-cloud',
        'rain1h': 'bi-cloud-rain',
        'rain3h': '',
        'snow1h': 'bi-snow',
        'snow3h': ''
    },
    getValueAndUnit(object, path, units) {
        let unit;
        if (path === 'visibility') {
            unit = 'm';
        } else if (path === 'wind.deg') {
            unit = '°';
            //TODO get cardinal direction http://snowfence.umn.edu/Components/winddirectionanddegrees.htm
        } else if (['main.humidity', 'clouds.all'].includes(path)) {
            unit = '%';
        } else if (['wind.gust', 'wind.speed'].includes(path)) {
            if (units === 'imperial') {
                unit = 'miles/h';
            } else {
                unit = 'm/s';
            }
        } else if (['main.pressure', 'main.sea_level', 'main.grnd_level'].includes(path)) {
            unit = 'hPa';
        } else if (['main.temp', 'main.feels_like', 'main.temp_min', 'main.temp_max'].includes(path)) {
            if (units === 'imperial') {
                unit = '°F';
            } else if (units === 'metric') {
                unit = '°C';
            } else { //units === 'standard'
                unit = '°K';
            }
        } else if (['rain.1h', 'rain.3h', 'snow.1h', 'snow.3h'].includes(path)) {
            unit = 'mm';
        }
        return get(object, path) + ' ' + unit;
    }
};

export const instructionsUtilities = {
    getIconByType(type) {
        let icon;
        if (type === 'checklist') {
            icon = 'list-check';
        } else if (type === 'sampling') {
            icon = 'eyedropper';
        } else if (type === 'commissioning') {
            icon = 'gear';
        } else if (type === 'maintenance') {
            icon = 'wrench';
        }
        return icon;
    }
};

export const userUtilities = {
    getAbbreviation(user) {
        let abbreviation = 'ND';
        if (user) {
            try {
                let name = user.username;
                if (user.firstName && user.lastName) {
                    name = user.firstName + ' ' + user.lastName;
                }
                abbreviation = name.match(/(^\S\S?|\s\S)?/g).map(v => v.trim()).join('').match(/(^\S|\S$)?/g).join('').toLocaleUpperCase();
            } catch (error) {
                //silently handle error
            }
        }
        return abbreviation;
    }
};

