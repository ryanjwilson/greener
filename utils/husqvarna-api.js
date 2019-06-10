const { URLSearchParams } = require("url");
const fetch = require("node-fetch");
const authUrl = "https://api.authentication.husqvarnagroup.dev/v1";
const amcUrl = "https://api.amc.husqvarna.dev/v1/mowers";

/**
 * Requests an access token from the Authentication API.
 * 
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a collection of authentication attributes
 */
const getToken = async () => {
    const url = `${authUrl}/oauth2/token`;

    const response = await fetch(url, {
        method: "POST",
        body: new URLSearchParams({
            grant_type: "password",
            client_id: process.env.API_KEY,
            username: process.env.USERNAME,
            password: process.env.PASSWORD
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
 * @param {string} token the access token to be validated
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a collection of authentication attributes
 */
const validateToken = async (token) => {
    const url = `${authUrl}/token/${token}`;

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
 * Invalidates an access token through the Authentication API.
 * 
 * @param {string} token the access token to be invalidated
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns an HTTP response code
 */
const invalidateToken = async (token) => {
    const url = `${authUrl}/token/${token}`;

    return await fetch(url, {
        method: "DELETE",
        headers: {
            "X-Api-Key": process.env.API_KEY
        }
    });
};

/**
 * Finds and retrieves a user by ID.
 * 
 * @param {string} userId the ID of the user to find
 * @param {string} token the access token
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a collection of user attributes
 */
const getUser = async (userId, token) => {
    const url = `${authUrl}/users/${userId}`;

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
 * Retrieves all paired mowers associated with a user.
 * 
 * @param {string} token the access token associted with this user
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a list of available mowers
 */
const getMowers = async (token) => {
    const response = await fetch(amcUrl, {
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
 * Finds and retrieves a specific mower.
 * 
 * @param {string} mowerId the ID of the mower to find
 * @param {string} token the access token
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a collection of mower attributes and data
 */
const getMower = async (mowerId, token) => {
    const url = `${amcUrl}/${mowerId}`;

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
    validateToken,
    invalidateToken,
    getUser,
    getMowers,
    getMower
};