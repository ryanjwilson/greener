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
    try {
        const url = `${WEATHER_URL}/${process.env.DARKSKY_API_KEY}/${latitude},${longitude}`;
        const parameters = "exclude=minutely,hourly,alerts,flags";
        const response = await fetch(`${url}?${parameters}`);
    
        if (!response.ok) {
            logger.log(`Dark Sky API returned a response status of ${response.status}.`, response);
        } else {
            return response.json();
        }
    } catch (e) {
        logger.log("Dark Sky API appears down or unreachable.", e);
    }
};

/**
 * Export functions.
 */

module.exports = {
    getWeatherConditions
};