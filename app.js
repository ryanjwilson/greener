require("dotenv").config({ path: "./config/.env" });

const cron = require("node-cron");
const logger = require("./utils/logger");
const darksky = require("./utils/weather-api");
const db = require("./utils/database");
const husqv = {
    api: require("./utils/husqvarna-api"),
    internal: require("./utils/husqvarna-internal")
};
const rachio = require("./utils/rachio-api");

/**
 * Schedules the script to run every 15 minutes.
 */

// cron.schedule("*/15 * * * *", () => {
//     init();
// });

/**
 * Executes API requests in parallel before writing fetched data to database.
 */

const init = async () => {
    try {
        let mowers = [];
        let sprinklers = [];

        // fetch internal and external mower data from Husqvarna endpoints

        const { access_token: husqvToken, user_id: husqvUserId } = await husqv.api.getToken();
        const { data: { id: husqvId }} = await husqv.internal.getToken();
        const { data: mowersExternal } = await husqv.api.getMowers(husqvToken);
        const mowersInternal = await husqv.internal.getMowers(husqvId);

        // parse and aggregate internal and external mower data, as well
        // as current and forecasted weather conditions into an array

        mowers = await aggregateExternalMowerData(husqvUserId, mowersExternal);
        mowers = await aggregateInternalMowerData(mowersInternal, mowers, husqvId);
        mowers = await aggregateMowerWeatherConditions(mowers);

        // request sprinkler data from Rachio endpoints
        
        const { id: rachioToken } = await rachio.getToken();        
        const { id: rachioUserId, devices } = await rachio.getDevices(rachioToken);

        // parse and aggregate sprinkler data, as well as current and forecasted weather conditions into an array

        sprinklers = await aggregateSprinklerData(rachioUserId, devices);
        sprinklers = await aggregateSprinklerWeatherConditions(sprinklers);

        // insert records into database

        db.insertMowers(mowers);
        db.insertSprinklers(sprinkers);
    } catch (e) {
        logger.log(e.message, e);
    }
};

/**
 * Parses and populates a list of external mowers into the record list.
 * 
 * @param {string} userId the Husqvarna user identifier
 * @param {Array<Object>} mowers the list of mowers
 * @returns a list of records after adding external mower data
 */

const aggregateExternalMowerData = (userId, mowers) => {
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

const aggregateInternalMowerData = async (mowers, records, token) => {
    logger.log("Fetching mower status from Husqvarna internal endpoint.");
    logger.log("Fetching geofence data from Husqvarna internal endpoint.");
    logger.log("Fetching settings data from Husqvarna internal endpoint.");

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
 * Parses and aggregates current and forecasted weather conditions for mower locations into the record list.
 * 
 * @param {Array<Object>} records the list of existing records
 * @returns a list of records after adding current and forecasted weather conditions
 */

const aggregateMowerWeatherConditions = async (records) => {
    logger.log("Fetching current and forecasted weather conditions from Dark Sky API.");

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

/**
 * Parses and populates a list of sprinklers into the record list.
 * 
 * @param {string} userId the unique Rachio user identifier
 * @param {Array<Object>} sprinklers the list of sprinklers
 * @returns a list of records after adding sprinkler data
 */

const aggregateSprinklerData = async (userId, sprinklers) => {
    let records = [];

    sprinklers.forEach((sprinkler) => {
        records.push({
            manufacturer: "rachio",
            deviceId: sprinkler.id,
            deviceName: sprinkler.name,
            deviceModel: sprinkler.model,
            serialNo: sprinkler.serialNumber,
            macAddress: sprinkler.macAddress,
            latitude: sprinkler.latitude,
            longitude: sprinkler.longitude,
            zones: sprinkler.zones.filter((zone) => {
                zone.zoneId = zone.id;
                zone.zoneName = zone.name;
                zone.sqft = zone.yardAreaSquareFeet;
                zone.nozzleName = zone.customNozzle.name;
                zone.inchesPerHour = zone.customNozzle.inchesPerHour;
                zone.soilName = zone.customSoil.name;
                zone.slopeName = zone.customSlope.name;
                zone.slopeSortOrder = zone.customSlope.sortOrder;
                zone.cropName = zone.customCrop.name;
                zone.cropCoefficient = zone.customCrop.coefficient;
                zone.shadeName = zone.customShade.name;
    
                delete zone.id;
                delete zone.name;
                delete zone.yardAreaSquareFeet;
                delete zone.customNozzle;
                delete zone.customSoil;
                delete zone.customSlope;
                delete zone.customCrop;
                delete zone.customShade;
                delete zone.wateringAdjustmentRuntimes;
    
                return true;
            }).sort((a, b) => {
                return a.zoneNumber - b.zoneNumber;
            }),
            scheduleRules: sprinkler.scheduleRules.filter((scheduleRule) => {
                scheduleRule.scheduleId = scheduleRule.id;
                scheduleRule.applicableZones = scheduleRule.zones.sort((a, b) => {
                    return a.sortOrder - b.sortOrder;
                });

                delete scheduleRule.id;
                delete scheduleRule.zones;
                delete scheduleRule.startDay;
                delete scheduleRule.startMonth;
                delete scheduleRule.startYear;

                return true;
            }),
            poweredOn: sprinkler.on,
            scheduleModeType: sprinkler.scheduleModeType,
            homekitCompatible: sprinkler.homekitCompatible,
            status: sprinkler.status,
            isDeleted: sprinkler.deleted,
            userId: userId
        });
    });

    return records;
};

/**
 * Parses and aggregates current and forecasted weather conditions for sprinkler locations into the record list.
 * 
 * @param {Array<Object>} records the list of existing records
 * @returns a list of records after adding current and forecasted weather conditions
 */

const aggregateSprinklerWeatherConditions = async (records) => {
    logger.log("Fetching current and forecasted weather conditions from Rachio API.");

    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const { current, forecast } = await rachio.getWeatherConditions(record.deviceId);

        record.weather = [{
            forecastType: "currently",
            forecastDay: -1,
            summary: current.weatherSummary,
            precipIntensity: current.precipIntensity,
            precipChance: current.precipProbability,
            temp: current.currentTemperature,
            tempHigh: undefined,
            tempLow: undefined,
            dewPoint: current.dewPoint,
            humidity: current.humidity,
            windSpeed: current.windSpeed,
            cloudCover: current.cloudCover
        }];

        for (let j = 0; j < forecast.length; j++) {
            const daily = forecast[j];

            record.weather.push({
                forecastType: "daily",
                forecastDay: j,
                summary: daily.weatherSummary,
                precipIntensity: daily.precipIntensity,
                precipChance: daily.precipProbability,
                temp: undefined,
                tempHigh: daily.temperatureMax,
                tempLow: daily.temperatureMin,
                dewPoint: daily.dewPoint,
                humidity: daily.humidity,
                windSpeed: daily.windSpeed,
                cloudCover: daily.cloudCover
            });
        }

        records.splice(i, 1, record);
    }

    return records;
};

init();