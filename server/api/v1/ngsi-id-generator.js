import {v1 as uuid} from 'uuid';

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
export default function ngsiIdGenerator(schema, objects, object) {
    return 'urn:ngsi-ld:' + (object.type ? object.type : object.kind) + ':' + uuid();
}
