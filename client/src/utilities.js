import get from 'lodash/get';

export const modelUtilities = {
    getIconByType(type) {
        let icon;
        if (type === 'alert') {
            icon = 'alarm';
        } else if (type === 'device') {
            icon = 'phone';
        } else if (type === 'emergency-event') {
            icon = 'hospital';
        } else if (type === 'incident') {
            icon = 'journal-medical';
        } else if (type === 'point-of-interest') {
            icon = 'pin-map-fill';
        } else if (type === 'pathogen') {
            icon = 'virus';
        }
        return icon;
    }
};

export const emergencyEventUtilities = {
    getPopupContent(i18n, emergencyEvent) {
        return `<h6>${emergencyEvent.name}</h6>`;
    }
};

export const deviceUtilities = {
    getDeviceIcon(device) {
        let icon = 'bi bi-';
        if (device.manufacturer === 'Apple' || device.manufacturer === 'Google') {
            icon += 'phone';
        } else if (device?.osVersion?.includes('Mac')) {
            icon += 'apple';
        } else {
            icon += 'windows';
        }
        return icon;
    },
    getPopupContent(i18n, device) {
        return `<h6><i class="${deviceUtilities.getDeviceIcon(device)}"></i> ${device.name}</h6>
                ${i18n.tr('enum.device.category.' + device.category)}`;
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
    async getCurrentGeoJSONPoint() {
        const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
        return {type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude]};
    }
};

export const alertUtilities = {
    getSeverityIcon(severity) {
        let icon = 'bi bi-';
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
    getPopupContent(i18n, alert) {
        return `<h6><i class="${alertUtilities.getSeverityIcon(alert.severity)}"></i> ${alert.name}</h6>
                ${i18n.tr('enum.alert.category.' + alert.category)}, ${i18n.tr('enum.alert.subCategory.' + alert.subCategory)}`;
    },
    getISO7010WarningIcon(category, subCategory) {
        let icon = '001';
        if (subCategory === 'tsunami') {
            icon = '056';
        } else if (subCategory === 'snow/ice') {
            icon = '010';
        } else if (subCategory === 'buildingFire' || subCategory === 'forestFire') {
            icon = '021';
        } else if (['fertilisation', 'irrigation', 'waterPollution', 'airPollution'].includes(subCategory)) {
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
            let name = user.username;
            if (user.firstName && user.lastName) {
                name = user.firstName + ' ' + user.lastName;
            }
            abbreviation = name.match(/(^\S\S?|\s\S)?/g).map(v => v.trim()).join('').match(/(^\S|\S$)?/g).join('').toLocaleUpperCase();
        }
        return abbreviation;
    }
};

