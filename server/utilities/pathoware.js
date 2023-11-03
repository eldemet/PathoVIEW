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
    return s
        .replace(/>/g, '\u003E')
        .replace(/"/g, '\u0022')
        .replace(/'/g, '\u0027')
        .replace(/=/g, '\u003D')
        .replace(/;/g, '\u003B')
        .replace(/\(/g, '\u0028')
        .replace(/\)/g, '\u0029');
}

/**
 * PathoWARE does not allow following string characters: > " ' = ; ( )
 * This function decodes these characters with the representative UTF-8 encoding
 * @param {string} s
 * @returns string
 */
export function decode(s) {
    return s
        .replace(/\u003E/g, '>')
        .replace(/\u0022/g, '"')
        .replace(/\u0027/g, '\'')
        .replace(/\u003D/g, '=')
        .replace(/\u003B/g, ';')
        .replace(/\u0028/g, '(')
        .replace(/\u0029/g, ')');
}
