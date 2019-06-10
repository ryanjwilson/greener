const fetch = require("node-fetch");

/**
 * Requests an access token from an internal endpoint.
 * 
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a collection of authentication attributes
 */
const getToken = async () => {
    const url = "https://iam-api.dss.husqvarnagroup.net/api/v3/token"; // unofficial internal endpoint

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "X-Api-Key": process.env.API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            data: {
                attributes: {
                    username: process.env.USERNAME,
                    password: process.env.PASSWORD
                },
                type: "token"
            }
        })
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    return response.json();
};

/**
 * Retrieves all paired mowers for a single user.
 * 
 * @param {string} token the access token associted with this user
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a list of available mowers
 */
const getMowers = async (token) => {
    const url = "https://amc-api.dss.husqvarnagroup.net/v1/mowers"; // unofficial internal endpoint

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Authorization-Provider": "husqvarna",
            "X-Api-Key": process.env.API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    return response.json();
};

/**
 * Finds and retrieves the status of a specifc mower
 * 
 * @param {string} mowerId the ID of the mower to find
 * @param {string} token the access token
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a collection of status attributes for the mower
 */
const getMowerStatus = async (mowerId, token) => {
    const url = `https://amc-api.dss.husqvarnagroup.net/v1/mowers/${mowerId}/status`; // unofficial internal endpoint

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Authorization-Provider": "husqvarna",
            "X-Api-Key": process.env.API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    return response.json();
};

/**
 * Finds and retrieves the geofence information of a specific mower.
 * 
 * @param {string} mowerId the ID of the mower to find
 * @param {string} token the access token
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a collection of mower attributes and data
 */
const getGeofenceForMower = async (mowerId, token) => {
    const url = `https://amc-api.dss.husqvarnagroup.net/v1/mowers/${mowerId}/geofence`; // unofficial internal endpoint

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Authorization-Provider": "husqvarna",
            "X-Api-Key": process.env.API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    return response.json();
};

/**
 * Finds and retrieves the settings of a specific mower.
 * 
 * @param {string} mowerId 
 * @param {string} token 
 */
const getMowerSettings = async (mowerId, token) => {
    const url = `https://amc-api.dss.husqvarnagroup.net/v1/mowers/${mowerId}/settings`;

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Authorization-Provider": "husqvarna",
            "X-Api-Key": process.env.API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    return response.json();
};

module.exports = {
    getToken,
    getMowers,
    getMowerStatus,
    getGeofenceForMower,
    getMowerSettings
};