import {v1 as uuid} from 'uuid';
import mapValues from 'lodash/mapValues.js';
import omitBy from 'lodash/omitBy.js';
import isNil from 'lodash/isNil.js';

/**
 * transform normalized NGSI-V2 coming from ORION context broker to keyvalues format
 * @param {object} alert
 * @returns {object} harmonized alert
 */
export function harmonizeAlert(alert) {
    let harmonizedAlert = mapValues(alert, 'value');
    if (!harmonizedAlert.id && alert.id) {
        harmonizedAlert.id = alert.id;
    }
    if (!harmonizedAlert.type && alert.type) {
        harmonizedAlert.type = alert.type;
    }
    harmonizedAlert = cleanAlert(harmonizedAlert);
    return harmonizedAlert;
}

export function cleanAlert(alert) {
    let cleanedAlert = Object.assign({}, alert);
    cleanedAlert = omitBy(cleanedAlert, isNil);
    if (alert.entityId && !alert.id) {
        cleanedAlert.id = alert.entityId;
    }
    if (alert.entityType && !alert.type) {
        cleanedAlert.type = alert.entityType;
    }
    if (cleanedAlert.name) cleanedAlert.name = decode(cleanedAlert.name);
    if (cleanedAlert.description) cleanedAlert.description = decode(cleanedAlert.description);
    if (alert.dateIssued) {
        try {
            let parsedDate = new Date(alert.dateIssued);
            cleanedAlert.dateIssued = parsedDate.toISOString();
        } catch (error) {
            cleanedAlert.dateIssued = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        }
    }
    if (typeof alert.severity === 'string') {
        cleanedAlert.severity = alert.severity.toLowerCase();
        if (cleanedAlert.severity === 'informative') {
            cleanedAlert.severity = 'informational';
        }
    }
    return cleanedAlert;
}

export function prepareAlert(alert) {
    let preparedAlert = Object.assign({}, alert);
    preparedAlert.id = 'Alert:' + uuid();
    if (preparedAlert.name) preparedAlert.name = encode(preparedAlert.name);
    if (preparedAlert.description) preparedAlert.description = encode(preparedAlert.description);
    return preparedAlert;
}

/**
 * PathoWARE does not allow following string characters: > " ' = ; ( )
 * This function encodes these characters with the representative UTF-8 encoding
 * @param {string} s
 * @returns string
 */
export function encode(s) {
    return encodeURIComponent(s) // escapes all characters except: A–Z a–z 0–9 - _ . ! ~ * ' ( )
        .replace('\'', '%27')
        .replace('(', '%28')
        .replace(')', '%29');
}

/**
 * PathoWARE does not allow following string characters: > " ' = ; ( )
 * This function decodes these characters with the representative UTF-8 encoding
 * @param {string} s
 * @returns string
 */
export function decode(s) {
    return decodeURIComponent(s) // unescapes all characters except: A–Z a–z 0–9 - _ . ! ~ * ' ( )
        .replace(/%27/gi, '\'')
        .replace(/%28/gi, '(')
        .replace(/%29/gi, ')');
}
