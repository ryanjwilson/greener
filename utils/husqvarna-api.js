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
    logger.log("retrieving external authentication token.");

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
        throw new Error(response.status);
    }

    return response.json();
};

/**
 * Validates an access token through the Authentication API.
 * 
 * @param {string} token the access token associated with this user
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a collection of authentication attributes
 */

const validateToken = async (token) => {
    const url = `${AUTH_URL}/token/${token}`;
    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Authorization-Provider": "husqvarna",
            "X-Api-Key": process.env.HUSQV_API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    return response.json();
};

/**
 * Invalidates an access token through the Authentication API.
 * 
 * @param {string} token the access token associated with this user
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns an HTTP response code
 */

const invalidateToken = async (token) => {
    const url = `${AUTH_URL}/token/${token}`;

    return await fetch(url, {
        method: "DELETE",
        headers: {
            "X-Api-Key": process.env.HUSQV_API_KEY
        }
    });
};

/**
 * Finds and retrieves a user by ID.
 * 
 * @param {string} userId the ID of the user to find
 * @param {string} token the access token associated with this user
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a collection of user attributes
 */

const getUser = async (userId, token) => {
    const url = `${AUTH_URL}/users/${userId}`;
    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Authorization-Provider": "husqvarna",
            "X-Api-Key": process.env.HUSQV_API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    return response.json();
};

/**
 * Retrieves all paired mowers associated with a user.
 * 
 * @param {string} token the access token associated with this user
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a list of available mowers
 */

const getMowers = async (token) => {
    logger.log("fetching external mower data.");
    
    const response = await fetch(AMC_URL, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Authorization-Provider": "husqvarna",
            "X-Api-Key": process.env.HUSQV_API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    return response.json();
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
    const url = `${AMC_URL}/${mowerId}`;
    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Authorization-Provider": "husqvarna",
            "X-Api-Key": process.env.HUSQV_API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    return response.json();
};

/**
 * Export functions.
 */

module.exports = {
    getToken,
    validateToken,
    invalidateToken,
    getUser,
    getMowers,
    getMower
};