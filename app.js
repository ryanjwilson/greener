require("dotenv").config({ path: "./config/.env" });

const cron = require("node-cron");
const logger = require("./utils/logger");
const darksky = require("./utils/weather-api");
const db = require("./utils/database");
const husqv = {
    api: require("./utils/husqvarna-api"),
    internal: require("./utils/husqvarna-internal")
};

/**
 * Schedules script execution every 5 minutes.
 */

cron.schedule("*/15 * * * *", () => {
    init();
});

/**
 * Executes API requests in parallel before writing fetched data to database.
 */

const init = async () => {
    try {
        let records = [];

        // fetch external and internal access tokens, user information, and a list of paired
        // mowers from both the external and internal endpoints.

        const { access_token: externalToken, user_id: userId } = await husqv.api.getToken();
        const { data: { id: internalToken }} = await husqv.internal.getToken();
        const { data: externalMowers } = await husqv.api.getMowers(externalToken);
        const internalMowers = await husqv.internal.getMowers(internalToken);

        // parse and aggregate external and internal mower data, as well as current and
        // forecasted weather conditions into an array.

        records = await aggregateExternalData(userId, externalMowers);
        records = await aggregateInternalData(internalMowers, records, internalToken);
        records = await aggregateWeatherConditions(records);

        // write records to database
        
        db.bulkInsert(records);
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

const aggregateExternalData = (userId, mowers) => {
    let records = [];

    mowers.forEach((mower) => {
        records.push({
            manufacturer: "husqv",
            deviceId: mower.id,
            deviceType: mower.type,
            deviceName: mower.attributes.system.name,
            deviceModel: mower.attributes.system.model,
            serialNo: mower.attributes.system.serialNumber,
            batteryPct: mower.attributes.battery.batteryPercent,
            mowerMode: mower.attributes.mower.mode,
            mowerActivity: mower.attributes.mower.activity,
            mowerState: mower.attributes.mower.state,
            lastError: mower.attributes.mower.errorCode,
            lastErrorTs: mower.attributes.mower.errorCodeTimestamp,
            schedules: mower.attributes.calendar.tasks,
            nextStartTs: mower.attributes.planner.nextStartTimestamp,
            override: mower.attributes.planner.override.action,
            restrictReason: mower.attributes.planner.restrictedReason,
            connected: mower.attributes.metadata.connected,
            userId: userId
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
    logger.log("fetching internal mower status, geofence, and settings data.");

    for (let i = 0; i < mowers.length; i++) {
        const record = records[i];
        const mower = mowers[i];
        const status = await husqv.internal.getStatus(mower.id, token);
        const { centralPoint: geofence } = await husqv.internal.getGeofence(mower.id, token);
        const { settings } = await husqv.internal.getSettings(mower.id, token);

        record.internalId = mower.id;
        record.internalModel = mower.model;
        record.internalStatus = mower.status.mowerStatus;
        record.internalOpMode = mower.status.operatingMode;
        record.geofenceLat = geofence.location.latitude;
        record.geofenceLong = geofence.location.longitude;
        record.geofenceLvl = geofence.sensitivity.level;
        record.geofenceRadius = geofence.sensitivity.radius;

        record.lastLocations = status.lastLocations.filter((location) => {
            delete location.gpsStatus;
            return true;
        });
        record.settings = settings.filter((setting) => {        
            setting.settingName = setting.id;
            setting.settingValue = setting.value;
            setting.settingDatatype = typeof setting.value;

            delete setting.id;
            delete setting.value;

            return true;
        });

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
    logger.log("fetching current and forecasted weather conditions.");

    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const latitude = record.lastLocations[0].latitude;
        const longitude = record.lastLocations[0].longitude;
        const { currently, daily: { data: forecast }} = await darksky.getWeatherConditions(latitude, longitude);

        record.weather = [{
            forecastType: "currently",
            forecastDay: -1,
            summary: currently.summary,
            sunriseTs: undefined,
            sunsetTs: undefined,
            stormDist: currently.nearestStormDistance,
            stormBearing: currently.nearestStormBearing,
            precipAccum: undefined,
            precipIntensity: currently.precipIntensity,
            precipChance: currently.precipProbability,
            precipType: undefined,
            temp: currently.temperature,
            tempHigh: undefined,
            tempLow: undefined,
            dewPoint: currently.dewPoint,
            humidity: currently.humidity,
            pressure: currently.pressure,
            windSpeed: currently.windSpeed,
            cloudCover: currently.cloudCover,
            uvIndex: currently.uvIndex,
            visibility: currently.visibility,
            ozone: currently.ozone,
            fetchTs: currently.time
        }];

        for (let j = 0; j < forecast.length; j++) {
            const daily = forecast[j];

            record.weather.push({
                forecastType: "daily",
                forecastDay: j,
                summary: daily.summary,
                sunriseTS: daily.sunriseTime,
                sunsetTs: daily.sunsetTime,
                stormDist: undefined,
                stormBearing: undefined,
                precipAccum: daily.precipAccumulation || 0,
                precipIntensity: daily.precipIntensity,
                precipChance: daily.precipProbability,
                precipType: daily.precipType || "none",
                temp: undefined,
                tempHigh: daily.temperatureMax,
                tempLow: daily.temperatureMin,
                dewPoint: daily.dewPoint,
                humidity: daily.humidity,
                pressure: daily.pressure,
                windSpeed: daily.windSpeed,
                cloudCover: daily.cloudCover,
                uvIndex: daily.uvIndex,
                visibility: daily.visibility,
                ozone: daily.ozone,
                fetchTs: currently.time
            });
        }

        records.splice(i, 1, record);
    }

    return records;
};