const fetch = require("node-fetch");
const logger = require("./logger");

const BASE_URL = "https://api.rach.io/1/public";

/**
 * Requests an access token from the API.
 * 
 * @returns a unique identifier
 */

const getToken = async () => {
    logger.log("Requesting access token from Rachio API.");

    try {
        const url = `${BASE_URL}/person/info`;
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${process.env.RACHIO_API_KEY}`
            }
        });

        if (!response.ok) {
            logger.log(`Rachio API returned a response status of ${response.status}.`, response);
        } else {
            return response.json();
        }
    } catch (e) {
        logger.log("Rachio API appears down or unreachable.", e);
    }
};

/**
 * Retrieves the devices associted with a specific user.
 * 
 * @param {string} token the access token for the specified user
 * @returns a collection of devices
 */

const getDevices = async (token) => {
    logger.log("Fetching device data from Rachio API.");

    try {
        const url = `${BASE_URL}/person/${token}`;
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${process.env.RACHIO_API_KEY}`
            }
        });

        if (!response.ok) {
            logger.log(`Rachio API returned a response status of ${response.status}.`, response);
        } else {
            return response.json();
        }
    } catch (e) {
        logger.log("Rachio API appears down or unreachable.", e);
    }
};

/**
 * Retrieves current and forecasted weather conditions assocated with a device.
 * 
 * @param {string} deviceId the unique identifier for the device
 * @returns a collection of weather conditions and forecast data
 */

const getWeatherConditions = async (deviceId) => {
    try {
        const url = `${BASE_URL}/device/${deviceId}/forecast`;
        const parameters = "units=US";
        const response = await fetch(`${url}?${parameters}`, {
            headers: {
                "Authorization": `Bearer ${process.env.RACHIO_API_KEY}`
            }
        });
    
        if (!response.ok) {
            logger.log(`Rachio API returned a response status of ${response.status}.`, response);
        } else {
            return response.json();
        }
    } catch (e) {
        logger.log("Rachio API appears down or unreachable.", e);
    }
};

/**
 * Export functions.
 */

module.exports = {
    getToken,
    getDevices,
    getWeatherConditions
};