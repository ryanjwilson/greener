const fetch = require("node-fetch");
const logger = require("./logger");

const AUTH_URL = "https://iam-api.dss.husqvarnagroup.net";
const AMC_URL = "https://amc-api.dss.husqvarnagroup.net/v1/mowers";

/**
 * Requests an access token from an internal endpoint.
 * 
 * @returns a collection of authentication attributes
 */

const getToken = async () => {
    logger.log("Requesting access token from Husqvarna internal endpoint.");

    try {
        const url = `${AUTH_URL}/api/v3/token`;         // unofficial internal endpoint
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "X-Api-Key": process.env.HUSQV_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                data: {
                    attributes: {
                        username: process.env.HUSQV_USERNAME,
                        password: process.env.HUSQV_PASSWORD
                    },
                    type: "token"
                }
            })
        });
    
        if (!response.ok) {
            logger.log(`Husqvarna internal endpoint returned a response status of ${response.status}.`, response);
        } else {
            return response.json();
        }
    } catch (e) {
        logger.log("Husqvarna internal endpoint appears down or unreachable.", e);
    }
};

/**
 * Retrieves all paired mowers for a single user.
 * 
 * @param {string} token the access token associated with this user
 * @returns a list of available mowers
 */

const getMowers = async (token) => {
    logger.log("Fetching mower data from Husqvarna internal endpoint.");

    try {
        const response = await fetch(AMC_URL, {         // unofficial internal endpoint
            headers: {
                "Authorization": `Bearer ${token}`,
                "Authorization-Provider": "husqvarna",
                "X-Api-Key": process.env.HUSQV_API_KEY
            }
        });
    
        if (!response.ok) {
            logger.log(`Husqvarna internal endpoint returned a response status of ${response.status}.`, response);
        } else {
            return response.json();
        }
    } catch (e) {
        logger.log("Husqvarna internal endpoint appears down or unreachable.", e);
    }
};

/**
 * Finds and retrieves the status of a specifc mower
 * 
 * @param {string} mowerId the ID of the mower to find
 * @param {string} token the access token associated with this user
 * @returns a collection of status attributes for the mower
 */

const getStatus = async (mowerId, token) => {
    try {
        const url = `${AMC_URL}/${mowerId}/status`;     // unofficial internal endpoint
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Authorization-Provider": "husqvarna",
                "X-Api-Key": process.env.HUSQV_API_KEY
            }
        });
    
        if (!response.ok) {
            logger.log(`Husqvarna internal endpoint returned a response status of ${response.status}.`, response);
        } else {
            return response.json();
        }
    } catch (e) {
        logger.log("Husqvarna internal endpoint appears down or unreachable.", e);
    }
};

/**
 * Finds and retrieves the geofence information of a specific mower.
 * 
 * @param {string} mowerId the ID of the mower to find
 * @param {string} token the access token associated with this user
 * @returns a collection of mower attributes and data
 */

const getGeofence = async (mowerId, token) => {
    try {
        const url = `${AMC_URL}/${mowerId}/geofence`;   // unofficial internal endpoint
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Authorization-Provider": "husqvarna",
                "X-Api-Key": process.env.HUSQV_API_KEY
            }
        });
    
        if (!response.ok) {
            logger.log(`Husqvarna internal endpoint returned a response status of ${response.status}.`, response);
        } else {
            return response.json();
        }
    } catch (e) {
        logger.log("Husqvarna internal endpoint appears down or unreachable.", e);
    }
};

/**
 * Finds and retrieves the settings of a specific mower.
 * 
 * @param {string} mowerId the ID of the mower to find
 * @param {string} token the access token associated with this user
 * @returns a collection of mower settings
 */

const getSettings = async (mowerId, token) => {
    try {
        const url = `${AMC_URL}/${mowerId}/settings`;   // unofficial internal endpoint
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Authorization-Provider": "husqvarna",
                "X-Api-Key": process.env.HUSQV_API_KEY
            }
        });
    
        if (!response.ok) {
            logger.log(`Husqvarna internal endpoint returned a response status of ${response.status}.`, response);
        } else {
            return response.json();
        }
    } catch (e) {
        logger.log("Husqvarna internal endpoint appears down or unreachable.", e);
    }
};

/**
 * Export functions.
 */

module.exports = {
    getToken,
    getMowers,
    getStatus,
    getGeofence,
    getSettings
};