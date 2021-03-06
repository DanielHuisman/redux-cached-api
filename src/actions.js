import {InvalidConfigError} from './errors';
import {API_SIGNATURE, RESET_ENDPOINT} from './types';

/**
 * Create an API endpoint action. (Internal function)
 *
 * @param {string} apiName Name of the API
 * @param {boolean} isEntity Indicates whether it's an entity endpoint
 * @param {string} entityName Entity name
 * @param {string} endpointName Name of the endpoint
 * @param {object} types Object containing the endpoint action types
 * @param {string} types.request Request action type
 * @param {string} types.success Success action type
 * @param {string} types.failure Failure action type
 * @return {function} The created endpoint action
 */
export const _createApiAction = (apiName, isEntity, entityName, endpointName, types) => {
    return (payload, extra = {}) => ({
        signature: API_SIGNATURE,
        api: apiName,
        type: types.request,
        isEntity,
        entity: entityName,
        endpoint: endpointName,
        requestPayload: payload,
        extra
    });
};

/**
 * Create an API reset endpoint action. (Internal function)
 *
 * @param {string} apiName Name of the API
 * @return {function} The created reset endpoint action
 */
export const _createApiResetAction = (apiName) => {
    return (endpointName, extra = {}) => ({
        signature: API_SIGNATURE,
        api: apiName,
        type: RESET_ENDPOINT,
        endpoint: endpointName,
        extra
    });
};

/**
 * Create API endpoint actions for a set of endpoints. (Internal function)
 *
 * @param {string} apiName Name of the API
 * @param {boolean} isEntity Indicates whether it's an entity endpoint
 * @param {string} entityName Entity name
 * @param {object} endpoints An object containing endpoint configurations
 * @param {object} endpointTypes Object containing action types for all endpoints
 * @return {object} The created endpoint actions
 */
export const _createApiActions = (apiName, isEntity, entityName, endpoints, endpointTypes) => {
    const actions = {};

    for (const endpointName of Object.keys(endpoints)) {
        const types = endpointTypes[endpointName];
        actions[endpointName] = _createApiAction(apiName, isEntity, entityName, endpointName, types);
    }

    return actions;
};

/**
 * Create API actions.
 *
 * @param {object} api API configuration
 * @return {object} An object containing all endpoint actions
 */
export const createApiActions = (api) => {
    if (typeof api !== 'object') {
        throw new InvalidConfigError(`Invalid API configuration: ${api}`);
    }

    const apiActions = {
        entities: {},
        endpoints: null
    };

    // Generate entity endpoint actions
    for (const entity of Object.values(api.entities)) {
        apiActions.entities[entity.name] = _createApiActions(api.name, true, entity.name, api.entityEndpoints, api.types.entities[entity.name]);
    }

    // Generate custom endpoint actions
    apiActions.endpoints = _createApiActions(api.name, false, null, api.endpoints, api.types.custom);

    // Generate reset endpoint action
    apiActions.resetEndpoint = _createApiResetAction(api.name);

    // Store the actions on the API object as well
    api.actions = apiActions;

    return apiActions;
};
