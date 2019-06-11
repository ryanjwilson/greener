const { URLSearchParams } = require("url");
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
    const url = `${WEATHER_URL}/${process.env.DARK_SKY_API_KEY}/${latitude},${longitude}`;
    const response = await fetch(`${url}?exclude=minutely,hourly,alerts,flags`);

    if (!response.ok) {
        throw new Error(response.status);
    }

    return response.json();
};

module.exports = {
    getWeatherConditions
};