const _ = require('lodash');

/**
 * ngsiIdGenerator
 *
 * @param schema
 * @param objects
 * @param object
 * @returns {string}
 *
 * @description urn:ngsi-ld:<Entity_Type_Name>:<Entity_Identification_String>
 * @example urn:ngsi-ld:Alert:00001
 */
function ngsiIdGenerator(schema, objects, object) {
    let currentIndex = objects.length + 1;
    let _id = 'urn:ngsi-ld:' + object.type + ':';
    _id += _.padStart(currentIndex, 5, '0');
    return _id;
}

module.exports = ngsiIdGenerator;
