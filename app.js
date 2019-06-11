require("dotenv").config({ path: "./config/.env" });

const husqvarna = {
    api: require("./utils/husqvarna-api"),
    internal: require("./utils/husqvarna-internal")
};
const darkskies = require("./utils/weather-api");
const mapbox = require("./utils/geocode-api");

/**
 * 
 */
const init = async () => {
    try {
        let records = [];

        // fetch external and internal access tokens, user information, and a list of paired
        // mowers from both the external and internal endpoints.

        const { access_token: externalToken, user_id: userId } = await husqvarna.api.getToken();
        const { data: { id: internalToken }} = await husqvarna.internal.getToken();
        const { data: externalMowers } = await husqvarna.api.getMowers(externalToken);
        const internalMowers = await husqvarna.internal.getMowers(internalToken);

        // parse, aggregate, and push external and internal mower data, current and forecasted
        // weather conditions, and location data into an array.

        records = await aggregateExternalData(externalMowers);
        records = await aggregateInternalData(internalMowers, records, internalToken);
        records = await aggregateWeatherConditions(records);
        records = await aggregateLocationData(records);

        // write records to shared spreadsheet
        
    } catch (error) {
        console.log(error);
    }
};

/**
 * Parses and populates a list of external mowers into the record list.
 * 
 * @param {Array<Object>} mowers the list of mowers
 * @returns a list of records after adding external mower data
 */
const aggregateExternalData = (mowers) => {
    let records = [];

    mowers.forEach((mower) => {
        records.push({
            id: mower.id,
            type: mower.type,
            name: mower.attributes.system.name,
            model: mower.attributes.system.model,
            serialNumber: mower.attributes.system.serialNumber,
            battery: mower.attributes.battery.batteryPercent,
            mode: mower.attributes.mower.mode,
            activity: mower.attributes.mower.activity,
            state: mower.attributes.mower.state,
            errorCode: mower.attributes.mower.errorCode,
            errorCodeTimestamp: mower.attributes.mower.errorCodeTimestamp,
            schedule: mower.attributes.calendar.tasks,
            nextStartTimestamp: mower.attributes.planner.nextStartTimestamp,
            nextStartSource: mower.attributes.planner.override.action,
            restrictedReason: mower.attributes.planner.restrictedReason,
            connected: mower.attributes.metadata.connected,
            statusTimestamp: mower.attributes.metadata.statusTimestamp
        });
    });

    return records;
};

/**
 * Parses and aggregates internal mower data to the record list.
 * 
 * @param {Array<Object>} mowers the list of mowers
 * @param {Array<Object>} records the list of existing records
 * @param {string} token the access token associated with this user
 * @returns a list of records after adding internal mower data
 */
const aggregateInternalData = async (mowers, records, token) => {
    for (let i = 0; i < mowers.length; i++) {
        const record = records[i];
        const mower = mowers[i];
        const status = await husqvarna.internal.getStatus(mower.id, token);
        const { centralPoint: geofence } = await husqvarna.internal.getGeofence(mower.id, token);
        const { settings } = await husqvarna.internal.getSettings(mower.id, token);

        record.internalId = mower.id;
        record.internalModel = mower.model;
        record.currentStatus = mower.status.mowerStatus;
        record.operatingMode = mower.status.operatingMode;
        record.lastLocations = status.lastLocations;
        record.geofenceLatitude = geofence.location.latitude;
        record.geofenceLongitude = geofence.location.longitude;
        record.geofenceLevel = geofence.sensitivity.level;
        record.geofenceRadius = geofence.sensitivity.radius;
        record.settings = settings;

        records.splice(i, 1, record);
    }

    return records;
};

/**
 * Parses and aggregates current and forecasted weather conditions into the record list.
 * 
 * @param {Array<Object>} records the list of existing records
 * @returns a list of records after adding current and forecasted weather conditions
 */
const aggregateWeatherConditions = async (records) => {
    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const latitude = record.lastLocations[0].latitude;
        const longitude = record.lastLocations[1].longitude;
        const { currently, daily: { data: forecast }} = await darkskies.getWeatherConditions(latitude, longitude);

        record.weather = [];
        for (let j = 0; j < forecast.length; j++) {
            const daily = forecast[j];

            record.weather.push({
                summary: (j === 0 ? `${currently.summary} ${daily.summary}` : forecast.summary),
                sunrise: daily.sunriseTime,
                sunset: daily.sunsetTime,
                precipAccumulation: (j === 0 ? currently.precipAccumulation || 0 : "n/a"),
                precipIntensity: daily.precipIntensity || 0,
                precipChance: daily.precipProbability,
                precipType: daily.precipType || "none",
                temperature: (j === 0 ? currently.temperature : "n/a"),
                high: daily.temperatureMax,
                low: daily.temperatureMin,
                dewPoint: daily.dewPoint,
                humidity: daily.humidity,
                pressure: daily.pressure,
                windSpeed: daily.windSpeed,
                cloudCover: daily.cloudCover
            });
        }

        records.splice(i, 1, record);
    }

    return records;
};

/**
 * Parses and aggregates location data into the record list.
 * 
 * @param {Array<Object>} records the list of existing records
 * @returns a list of records after adding location data
 */
const aggregateLocationData = async (records) => {
    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const latitude = record.lastLocations[0].latitude;
        const longitude = record.lastLocations[1].longitude;
        const { features: addresses } = await mapbox.getAddress(latitude, longitude);

        const address = addresses[0].place_name.split(",");
        record.street = address[0].trim();
        record.city = address[1].trim();
        record.state = address[2].substring(1, address[2].length - 5).trim();
        record.zip = address[2].substring(record.state.length + 1).trim();
        record.country = address[3].trim();

        records.splice(i, 1, record);
    }

    return records;
};

const updateSpreadsheet = () => {

};

init();