const { URLSearchParams } = require("url");
const fetch = require("node-fetch");
const logger = require("./logger");

const AUTH_URL = "https://api.authentication.husqvarnagroup.dev/v1";
const AMC_URL = "https://api.amc.husqvarna.dev/v1/mowers";

/**
 * Requests an access token from the Authentication API.
 * 
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a collection of authentication attributes
 */

const getToken = async () => {
    logger.log("Requesting access token from Husqvarna Authentication API.");

    try {
        const url = `${AUTH_URL}/oauth2/token`;
        const response = await fetch(url, {
            method: "POST",
            body: new URLSearchParams({
                grant_type: "password",
                client_id: process.env.HUSQV_API_KEY,
                username: process.env.HUSQV_USERNAME,
                password: process.env.HUSQV_PASSWORD
            })
        });
    
        if (!response.ok) {
            logger.log(`Husqvarna Authentication API returned a response status of ${response.status}.`, response);
        } else {
            return response.json();
        }
    } catch (e) {
        logger.log("Husqvarna Authentication API appears down or unreachable.", e);
    }
};

/**
 * Retrieves all paired mowers associated with a user.
 * 
 * @param {string} token the access token associated with this user
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a list of available mowers
 */

const getMowers = async (token) => {
    logger.log("Fetching mower data from Husqvarna Automower Connect API.");
    
    try {
        const response = await fetch(AMC_URL, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Authorization-Provider": "husqvarna",
                "X-Api-Key": process.env.HUSQV_API_KEY
            }
        });
    
        if (!response.ok) {
            logger.log(`Husqvarna Automower Connect API returned a response status of ${response.status}.`, response);
        } else {
            return response.json();
        }
    } catch (e) {
        logger.log("Husqvarna Automower Connect API appears down or unreachable.", e);
    }
};

/**
 * Finds and retrieves a specific mower.
 * 
 * @param {string} mowerId the ID of the mower to find
 * @param {string} token the access token associated with this user
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a collection of mower attributes and data
 */

const getMower = async (mowerId, token) => {
    try {
        const url = `${AMC_URL}/${mowerId}`;
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Authorization-Provider": "husqvarna",
                "X-Api-Key": process.env.HUSQV_API_KEY
            }
        });
    
        if (!response.ok) {
            logger.log(`Husqvarna Automower Connect API returned a response status of ${response.status}.`, response);
        } else {
            return response.json();
        }
    } catch (e) {
        logger.log("Husqvarna Automower Connect API appears down or unreachable.", e);
    }
};

/**
 * Export functions.
 */

module.exports = {
    getToken,
    getMowers,
    getMower
};