import {decamelize} from 'humps';

import {InvalidConfigError} from './errors';

export const requestStages = {
    request: 'REQUEST',
    success: 'SUCCESS',
    failure: 'FAILURE'
};

/**
 * Create action types for a set of API endpoints. (Interal function)
 *
 * @param {object} endpoints Object containing endpoint information
 * @param {string} prefix Action type prefix
 * @param {string} postfix Action type postfix
 * @return {object} The generated action types
 */
export const _createEndpointTypes = (endpoints, prefix = '', postfix = '') => {
    const types = {};
    for (const endpoint of Object.keys(endpoints)) {
        const endpointName = decamelize(endpoint).toUpperCase();
        for (const [stageKey, stage] of Object.entries(requestStages)) {
            types[endpoint][stageKey] = Symbol(`${prefix}${endpointName}_${stage}${postfix}`);
        }
    }
    return types;
};

/**
 * Merge action types for a set of API endpoints. (Internal function)
 *
 * @param {object} final Object the types are merged with
 * @param {object} endpoints Object containing endpoint information
 * @param {string} prefix Action type prefix
 * @param {string} postfix Action type postfix
 */
export const _mergeEndpointTypes = (final, endpoints, prefix = '', postfix = '') => {
    for (const [endpointName, endpoint] of Object.entries(endpoints)) {
        for (const [stageKey, type] of Object.entries(endpoint)) {
            final.all[`${prefix}${endpointName}_${requestStages[stageKey]}${prefix}`] = type;
            final[stageKey].push(type);
        }
    }
};

/**
 * Create action types for an API configuration. (Interal function)
 *
 * @param {object} api API configuration
 */
export const _createApiTypes = (api) => {
    const types = {
        entities: {},
        custom: {}
    };
    const mergedTypes = {
        all: {},
        request: [],
        success: [],
        failure: []
    };

    if (typeof api !== 'object') {
        throw new InvalidConfigError(`Invalid API configuration: ${api}`);
    }

    // Generate entity endpoint action types
    for (const entity of api.entities) {
        const name = decamelize(entity.name).toUpperCase();
        types.entities[entity.name] = _createEndpointTypes(api.entityEndpoints, `${api.name}_${name}_`);
    }

    // Generate custom endpoint action types
    types.custom = _createEndpointTypes(api.endpoints, `${api.name}_`);

    // Merge entity endpoint action types
    for (const entity of Object.values(api.types.entities)) {
        _mergeEndpointTypes(mergedTypes, entity, `${api.name}_${name}_`);
    }

    // Merge custom endpoint action types
    _mergeEndpointTypes(mergedTypes, api.types.custom, `${api.name}_${name}_`);

    api.types = types;
    api.mergedTypes = mergedTypes;
};

/**
 * Create action types for one or more API configurations.
 *
 * @param {object[]} apis One or more API configurations
 * @return {object} The generated action types
 */
export const createApiTypes = (...apis) => {
    const types = {
        all: {},
        request: [],
        success: [],
        failure: []
    };

    // Loop over all API configurations
    for (const api of apis) {
        // Validate API configuration
        if (typeof api !== 'object') {
            throw new InvalidConfigError(`Invalid API configuration: ${api}`);
        }

        // Merge API action types
        for (const [key, value] of Object.entries(types)) {
            if (Array.isArray(value)) {
                types[key] = value.concat(api.mergedTypes[key]);
            } else {
                types[key] = {
                    ...value,
                    ...api.mergedTypes[key]
                };
            }
        }
    }

    return types;
};