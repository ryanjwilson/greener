const mysql = require("mysql");
const logger = require("./logger");

/**
 * Establishes a connection to the MySQL database.
 * 
 * @returns the MySQL connection object
 */

const getConnection = () => {
    return mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USERNAME,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        multipleStatements: true
    });
};

/**
 * Inserts data into the mowers, schedules, locations, settings, and forecasts tables in a single transaction.
 * 
 * @param {Array<Object>} mowers the records to be inserted into the database
 */

const insertMowers = (mowers) => {
    logger.log("Establishing secure connection to database.");

    const connection = getConnection();    
    mowers.forEach((mower, i) => {
        connection.beginTransaction((error) => {
            if (error) {
                switch (error.code) {
                    case "ENOTFOUND": logger.log(`Database server appears down or unreachable (mowers, batch ${i + 1} of ${mowers.length}).`, error); break;
                    case "ER_NOT_SUPPORTED_AUTH_MODE": logger.log(`Unrecognized credentials or authentication protocol (mowers, batch ${i + 1} of ${mowers.length}).`, error); break;
                    case "ER_ACCESS_DENIED_ERROR": logger.log(`Unrecognized credentials or authentication protocol (mowers, batch ${i + 1} of ${mowers.length}).`, error); break;
                    case "ER_BAD_DB_ERROR": logger.log(`Unrecognized database schema (mowers, batch ${i + 1} of ${mowers.length}).`, error); break;
                    case "ER_NO_SUCH_TABLE": logger.log(`Error while parsing SQL statement (mowers, batch ${i + 1} of ${mowers.length}).`, error); break;
                    case "ER_PARSE_ERROR": logger.log(`Error while parsing SQL statement (mowers, batch ${i + 1} of ${mowers.length}).`, error); break;
                    default: logger.log(`Unknown connection or transaction error (mowers, batch ${i + 1} of ${mowers.length}).`, error); break;
                }

                return -1;
            }

            const preparedStmts = [
                prepareMowerSQL(mower),
                prepareMowerScheduleSQL(mower),
                prepareMowerLocationSQL(mower),
                prepareMowerSettingSQL(mower),
                prepareMowerForecastSQL(mower)
            ].filter(Boolean).join(";");

            connection.query(preparedStmts, (error) => {
                if (error) {
                    switch (error.code) {
                        case "ER_NO_SUCH_TABLE": logger.log(`Error while parsing SQL statement (mowers, batch ${i + 1} of ${mowers.length}).`, error); break;
                        case "ER_PARSE_ERROR": logger.log(`Error while parsing SQL statement (mowers, batch ${i + 1} of ${mowers.length}).`, error); break;
                        default: logger.log(`Unknown SQL parsing error (mowers, batch ${i + 1} of ${mowers.length}).`, error); break;
                    }

                    connection.rollback();
                    if (i === mowers.length - 1) {
                        connection.end();
                    }

                    return -1;
                }

                connection.commit((error) => {
                    if (error) {
                        switch (error.code) {
                            default: logger.log(`Unknown commit error (mowers, batch ${i + 1} of ${mowers.length}).`, error); break;
                        }

                        connection.rollback();    
                        if (i === mowers.length - 1) {
                            connection.end();
                        }

                        return -1;
                    }
    
                    if (i === mowers.length - 1) {
                        connection.end();
                    }
                    logger.log(`Successful database insertion (mowers, batch ${i + 1} of ${mowers.length}).`);
                });
            });
        });
    });
};

/**
 * Inserts data into the <TO BE DETERMINED> tables in a single transaction.
 * 
 * @param {Array<Object>} sprinklers the records to be inserted into the database
 */

const insertSprinklers = (sprinklers) => {
    logger.log("Establishing secure connection to database.");

    const connection = getConnection();    
    sprinklers.forEach((sprinkler, i) => {
        connection.beginTransaction((error) => {
            if (error) {
                switch (error.code) {
                    case "ENOTFOUND": logger.log(`Database server appears down or unreachable (sprinklers, batch ${i + 1} of ${sprinklers.length}).`, error); break;
                    case "ER_NOT_SUPPORTED_AUTH_MODE": logger.log(`Unrecognized credentials or authentication protocol (sprinklers, batch ${i + 1} of ${sprinklers.length}).`, error); break;
                    case "ER_ACCESS_DENIED_ERROR": logger.log(`Unrecognized credentials or authentication protocol (sprinklers, batch ${i + 1} of ${sprinklers.length}).`, error); break;
                    case "ER_BAD_DB_ERROR": logger.log(`Unrecognized database schema (sprinklers, batch ${i + 1} of ${sprinklers.length}).`, error); break;
                    case "ER_NO_SUCH_TABLE": logger.log(`Error while parsing SQL statement (sprinklers, batch ${i + 1} of ${sprinklers.length}).`, error); break;
                    case "ER_PARSE_ERROR": logger.log(`Error while parsing SQL statement (sprinklers, batch ${i + 1} of ${sprinklers.length}).`, error); break;
                    default: logger.log(`Unknown connection or transaction error (sprinklers, batch ${i + 1} of ${sprinklers.length}).`, error); break;
                }

                return -1;
            }

            const preparedStmts = [
                prepareSprinklerSQL(sprinkler),
                prepareSprinklerScheduleSQL(sprinkler),
                prepareSprinklerZoneSQL(sprinkler),
                prepareSprinklerForecastSQL(sprinkler)
            ].filter(Boolean).join(";");

            connection.query(preparedStmts, (error) => {
                if (error) {
                    switch (error.code) {
                        case "ER_NO_SUCH_TABLE": logger.log(`Error while parsing SQL statement (sprinklers, batch ${i + 1} of ${sprinklers.length}).`, error); break;
                        case "ER_PARSE_ERROR": logger.log(`Error while parsing SQL statement (sprinklers, batch ${i + 1} of ${sprinklers.length}).`, error); break;
                        default: logger.log(`Unknown SQL parsing error (sprinklers, batch ${i + 1} of ${sprinklers.length}).`, error); break;
                    }

                    connection.rollback();
                    if (i === sprinklers.length - 1) {
                        connection.end();
                    }

                    return -1;
                }

                connection.commit((error) => {
                    if (error) {
                        switch (error.code) {
                            default: logger.log(`Unknown commit error (sprinklers, batch ${i + 1} of ${sprinklers.length}).`, error); break;
                        }

                        connection.rollback();    
                        if (i === sprinklers.length - 1) {
                            connection.end();
                        }

                        return -1;
                    }
    
                    if (i === sprinklers.length - 1) {
                        connection.end();
                    }
                    logger.log(`Successful database insertion (sprinklers, batch ${i + 1} of ${sprinklers.length}).`);
                });
            });
        });
    });
};

/**
 * Prepares a SQL statement for insertion into the mowers table.
 * 
 * @param {Object} data the values to be inserted
 * @returns the prepared SQL statement
 */

const prepareMowerSQL = (data) => {
    const sql = `INSERT INTO mowers VALUES (` +
        "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?" +
    ")";

    const values = [
        data.manufacturer,
        data.deviceId,
        data.internalId,
        data.deviceType,
        data.deviceName,
        data.deviceModel,
        data.internalModel,
        data.serialNo,
        data.batteryPct,
        data.mowerMode,
        data.mowerActivity,
        data.mowerState,
        data.internalStatus,
        data.internalOpMode,
        data.geofenceLat,
        data.geofenceLong,
        data.geofenceLvl,
        data.geofenceRadius,
        data.lastError,
        data.lastErrorTs,
        data.nextStartTs,
        data.override,
        data.restrictReason,
        data.connected ? 1 : 0,
        data.weather[0].fetchTs,
        data.userId
    ];

    return mysql.format(sql, values);
};

/**
 * Prepares a SQL statement for insertion into the mower schedules table.
 * 
 * @param {Object} data the values to be inserted
 * @returns the prepared SQL statement
 */

const prepareMowerScheduleSQL = (data) => {
    const sql = `INSERT INTO mower_schedules VALUES (` +
        "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?" +
    ")";

    const statements = [];
    data.schedules.forEach((schedule, index) => {
        const values = [
            data.manufacturer,
            data.deviceId,
            index,
            schedule.start,
            schedule.duration,
            schedule.monday ? 1 : 0,
            schedule.tuesday ? 1 : 0,
            schedule.wednesday ? 1 : 0,
            schedule.thursday ? 1 : 0,
            schedule.friday ? 1 : 0,
            schedule.saturday ? 1 : 0,
            schedule.sunday ? 1 : 0,
            data.weather[0].fetchTs
        ];

        statements.push(mysql.format(sql, values));
    });

    return statements.filter(Boolean).join(";");
};

/**
 * Prepares a SQL statement for insertion into the mower locations table.
 * 
 * @param {Object} data the values to be inserted
 * @returns the prepared SQL statement
 */

const prepareMowerLocationSQL = (data) => {
    const sql = `INSERT INTO mower_locations VALUES (` +
        "?, ?, ?, ?, ?, ?" +
    ")";

    const statements = [];
    data.lastLocations.forEach((location, index) => {
        const values = [
            data.manufacturer,
            data.deviceId,
            index,
            location.latitude,
            location.longitude,
            data.weather[0].fetchTs
        ];

        statements.push(mysql.format(sql, values));
    });

    return statements.filter(Boolean).join(";");
};

/**
 * Prepares a SQL statement for insertion into the mower settings table.
 * 
 * @param {Object} data the values to be inserted
 * @returns the prepared SQL statement
 */

const prepareMowerSettingSQL = (data) => {
    const sql = `INSERT INTO mower_settings VALUES (` +
        "?, ?, ?, ?, ?, ?" +
    ")";

    const statements = [];
    data.settings.forEach((setting) => {
        const values = [
            data.manufacturer,
            data.deviceId,
            setting.settingName,
            setting.settingValue,
            setting.settingDatatype,
            data.weather[0].fetchTs
        ];

        statements.push(mysql.format(sql, values));
    });

    return statements.filter(Boolean).join(";");
};

/**
 * Prepares a SQL statement for insertion into the mower forecasts table.
 * 
 * @param {Object} data the values to be inserted
 * @returns the prepared SQL statement
 */

const prepareMowerForecastSQL = (data) => {
    const sql = `INSERT INTO mower_forecasts VALUES (` +
        "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?" +
    ")";

    const statements = [];
    data.weather.forEach((forecast) => {
        const values = [
            data.manufacturer,
            data.deviceId,
            forecast.forecastType,
            forecast.forecastDay,
            forecast.summary,
            forecast.sunriseTs,
            forecast.sunsetTs,
            forecast.stormDist,
            forecast.stormBearing,
            forecast.precipAccum,
            forecast.precipIntensity,
            forecast.precipChance,
            forecast.precipType,
            forecast.temp,
            forecast.tempHigh,
            forecast.tempLow,
            forecast.dewPoint,
            forecast.humidity,
            forecast.pressure,
            forecast.windSpeed,
            forecast.cloudCover,
            forecast.uvIndex,
            forecast.visibility,
            forecast.ozone,
            data.weather[0].fetchTs
        ];

        statements.push(mysql.format(sql, values));
    });

    return statements.filter(Boolean).join(";");
};

/**
 * Prepares a SQL statement for insertion into the sprinklers table.
 * 
 * @param {Object} data the values to be inserted
 * @returns the prepared SQL statement
 */

const prepareSprinklerSQL = (data) => {
    const sql = `INSERT INTO sprinklers VALUES (` +
        "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?" +
    ")";

    const values = [
        data.manufacturer,
        data.deviceId,
        data.deviceType,
        data.deviceName,
        data.deviceModel,
        data.serialNo,
        data.macAddress,
        data.latitude,
        data.longitude,
        data.poweredOn ? 1 : 0,
        data.scheduleModeType,
        data.status,
        data.isDeleted ? 1 : 0,
        data.weather[0].fetchTs,
        data.userId
    ];

    return mysql.format(sql, values);
};

/**
 * Prepares a SQL statement for insertion into the sprinkler schedules table.
 * 
 * @param {Object} data the values to be inserted
 * @returns the prepared SQL statement
 */

const prepareSprinklerScheduleSQL = (data) => {
    const sql = `INSERT INTO sprinkler_schedules VALUES (` +
        "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?" +
    ")";

    const statements = [];
    data.scheduleRules.forEach((scheduleRule) => {
        scheduleRule.applicableZones.forEach((zone) => {
            const values = [
                data.manufacturer,
                data.deviceId,
                scheduleRule.scheduleId,
                zone.zoneId,
                zone.sortOrder,
                scheduleRule.totalDuration,
                zone.duration,
                scheduleRule.name,
                scheduleRule.externalName,
                scheduleRule.summary,
                scheduleRule.operator,
                scheduleRule.cycleSoak ? 1: 0,
                scheduleRule.cycleSoakStatus,
                scheduleRule.startDate,
                scheduleRule.enabled ? 1 : 0,
                scheduleRule.etSkip ? 1: 0,
                data.weather[0].fetchTs
            ];

            statements.push(mysql.format(sql, values));
        });
    });

    return statements.filter(Boolean).join(";");
};

/**
 * Prepares a SQL statement for insertion into the sprinkler zones table.
 * 
 * @param {Object} data the values to be inserted
 * @returns the prepared SQL statement
 */

const prepareSprinklerZoneSQL = (data) => {
    const sql = `INSERT INTO sprinkler_zones VALUES (` +
        "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?" +
    ")";

    const statements = [];
    data.zones.forEach((zone) => {
        const values = [
            data.manufacturer,
            data.deviceId,
            zone.zoneId,
            zone.zoneNumber,
            zone.zoneName,
            zone.sqft,
            zone.nozzleName,
            zone.inchesPerHour,
            zone.soilName,
            zone.slopeName,
            zone.slopeSortOrder,
            zone.cropName,
            zone.cropCoefficient,
            zone.shadeName,
            zone.enabled ? 1 : 0,
            zone.availableWater,
            zone.rootZoneDepth,
            zone.managementAllowedDepletion,
            zone.efficiency,
            zone.lastWateredDate || -1,
            zone.scheduleDataModified,
            zone.depthOfWater,
            zone.runtime,
            zone.maxRuntime,
            data.weather[0].fetchTs
        ];

        statements.push(mysql.format(sql, values));
    });

    return statements.filter(Boolean).join(";");
};

/**
 * Prepares a SQL statement for insertion into the sprinkler forecasts table.
 * 
 * @param {Object} data the values to be inserted
 * @returns the prepared SQL statement
 */

const prepareSprinklerForecastSQL = (data) => {
    const sql = `INSERT INTO sprinkler_forecasts VALUES (` +
        "?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?" +
    ")";

    const statements = [];
    data.weather.forEach((forecast) => {
        const values = [
            data.manufacturer,
            data.deviceId,
            forecast.forecastType,
            forecast.forecastDay,
            forecast.summary,
            forecast.precipIntensity,
            forecast.precipChance,
            forecast.temp,
            forecast.tempHigh,
            forecast.tempLow,
            forecast.dewPoint,
            forecast.humidity,
            forecast.windSpeed,
            forecast.cloudCover,
            data.weather[0].fetchTs
        ];

        statements.push(mysql.format(sql, values));
    });

    return statements.filter(Boolean).join(";");
};

/**
 * Export functions.
 */

module.exports = {
    insertMowers,
    insertSprinklers
};