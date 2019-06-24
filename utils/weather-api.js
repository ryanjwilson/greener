const fetch = require("node-fetch");

const WEATHER_URL = "https://api.darksky.net/forecast";

/**
 * Requests the current weather and forecasted conditions for a specific location.
 * 
 * @param {number} latitude the latitude of the location
 * @param {number} longitude the longitude of the location
 * @returns the current weather conditions for the location
 */

const getWeatherConditions = async (latitude, longitude) => {    
    const url = `${WEATHER_URL}/${process.env.DARKSKY_API_KEY}/${latitude},${longitude}`;
    const parameters = "exclude=minutely,hourly,alerts,flags";
    const response = await fetch(`${url}?${parameters}`);

    if (!response.ok) {
        throw new Error(response.status);
    }

    return response.json();
};

/**
 * Export functions.
 */

module.exports = {
    getWeatherConditions
};