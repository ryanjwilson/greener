const { URLSearchParams } = require("url");
const fetch = require("node-fetch");

/**
 * Requests an access token from the Authentication API.
 * 
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a JSON-formatted HTTP response
 */
const getToken = async () => {
    const url = "https://api.authentication.husqvarnagroup.dev/v1/oauth2/token";

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
        throw new Error(`${response.status} (${response.statusText})`);
    }

    return response.json();
};

/**
 * Validates an access token through the Authentication API.
 * 
 * @param {string} token the access token to be validated
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a JSON-formatted HTTP response
 */
const validateToken = async (token) => {
    const url = `https://api.authentication.husqvarnagroup.dev/v1/token/${token}`;

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Authorization-Provider": "husqvarna",
            "X-Api-Key": process.env.API_KEY
        }
    });

    if (response.status !== 200) {
        throw new Error(`${response.status} (${response.statusText})`);
    }

    return response.json();
};

/**
 * Invalidates an access token through the Authentication API.
 * 
 * @param {string} token the access token to be invalidated
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a JSON-formatted HTTP response wrapped in a Promise
 */
const invalidateToken = async (token) => {
    const url = `https://api.authentication.husqvarnagroup.dev/v1/token/${token}`;

    return await fetch(url, {
        method: "DELETE",
        headers: {
            "X-Api-Key": process.env.API_KEY
        }
    });
};

/**
 * Finds and retrieves a user's information by ID.
 * 
 * @param {string} userId the ID of the user to find
 * @param {string} token the access token
 * @throws an error for all HTTP response codes not in the range 200-299
 * @returns a JSON-formatted HTTP response wrapped in a Promise
 */
const getUser = async (userId, token) => {
    const url = `https://api.authentication.husqvarnagroup.dev/v1/users/${userId}`;

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Authorization-Provider": "husqvarna",
            "X-Api-Key": process.env.API_KEY
        }
    });

    if (response.status !== 200) {
        throw new Error(`${response.status} (${response.statusText})`);
    }

    return response.json();
};

module.exports = {
    getToken,
    validateToken,
    invalidateToken,
    getUser
};