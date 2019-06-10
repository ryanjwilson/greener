require("dotenv").config({ path: "./config/.env" });

const husqvarna = {
    api: require("./utils/husqvarna-api"),
    internal: require("./utils/husqvarna-internal")
};

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

        records = await populateExternalData(externalMowers);
        records = await populateInternalData(internalMowers, records, internalToken);

        // fetch weather data, parse and aggregate
        // fetch location data, parse and aggregate
        // write records to shared spreadsheet
        
    } catch (error) {
        console.log(error);
    }
};

/**
 * Parses and populates a list of external mowers.
 * 
 * @param {Array<Object>} mowers the list of mowers
 * @returns a list of parsed mowers
 */
const populateExternalData = (mowers) => {
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
 * Parses, aggregates, and populates a list of internal mowers.
 * 
 * @param {Array<Object>} mowers the list of mowers
 * @param {Array<Object>} records the list of existing records
 * @param {string} token the access token associated with this user
 * @returns a list of parsed and aggregated mowers
 */
const populateInternalData = async (mowers, records, token) => {
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

const getWeatherConditions = () => {

};

init();