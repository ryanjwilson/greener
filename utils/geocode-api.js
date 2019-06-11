const fetch = require("node-fetch");
const GEOCODE_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places"

/**
 * Reverse geocodes a latitude, longitude coordinate pair to a physical address.
 * 
 * @param {number} latitude the latitude coordinate
 * @param {number} longitude the longitude coordinate
 * @returns the address of the latitude, longitude coordinate pair
 */
const getAddress = async (latitude, longitude) => {
    const url = `${GEOCODE_URL}/${longitude},${latitude}.json?access_token=${process.env.MAPBOX_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(response.status);
    }

    return response.json();
};

module.exports = {
    getAddress
};