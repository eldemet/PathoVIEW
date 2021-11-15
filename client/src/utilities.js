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
    }
};
