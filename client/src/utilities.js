import {catchError} from 'library-aurelia/src/decorators';

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
    @catchError()
    async getBatteryLevel() {
        return (await navigator.getBattery()).level;
    }
};

export const locationUtilities = {
    @catchError()
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
    }
};
