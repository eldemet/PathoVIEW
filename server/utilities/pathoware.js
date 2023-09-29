import mapValues from 'lodash/mapValues.js';
import omitBy from 'lodash/omitBy.js';
import isNil from 'lodash/isNil.js';

export const alertUtilities = {
    harmonizeAlert(alert) {
        let harmonizedAlert = mapValues(alert, 'value');
        if (!harmonizedAlert.id && alert.id) {
            harmonizedAlert.id = alert.id;
        }
        if (!harmonizedAlert.type && alert.type) {
            harmonizedAlert.type = alert.type;
        }
        harmonizedAlert = alertUtilities.cleanAlert(harmonizedAlert);
        return harmonizedAlert;
    },
    cleanAlert(alert) {
        let cleanedAlert = Object.assign({}, alert);
        cleanedAlert = omitBy(cleanedAlert, isNil);
        if (alert.dateIssued) {
            try {
                let parsedDate = new Date(alert.dateIssued);
                cleanedAlert.dateIssued = parsedDate.toISOString();
            } catch (error) {
                cleanedAlert.dateIssued = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            }
        }
        if (alert.entityId && !alert.id) {
            cleanedAlert.id = alert.entityId;
        }
        if (alert.entityType && !alert.type) {
            cleanedAlert.type = alert.entityType;
        }
        if (typeof alert.severity === 'string') {
            cleanedAlert.severity = alert.severity.toLowerCase();
            if (cleanedAlert.severity === 'informative') {
                cleanedAlert.severity = 'informational';
            }
        }
        return cleanedAlert;
    }
};
