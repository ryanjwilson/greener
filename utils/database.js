const mysql = require("mysql");
const logger = require("./logger");

/**
 * Establishes a connection to the MySQL database.
 * 
 * @returns the MySQL connection object
 */
const getConnection = () => {
    logger.log("establishing connection to database.");

    return mysql.createConnection({
        host: "localhost",
        user: process.env.MYSQL_USERNAME,
        password: process.env.MYSQL_PASSWORD
    });
};

/**
 * Inserts data into the mowers, schedules, locations, settings, and forecasts tables
 * in a single transaction.
 * 
 * @param {Object} data 
 */
const bulkInsert = (data) => {
    logger.log("inserting records into database.");

    try {
        const connection = getConnection();

        connection.beginTransaction((error) => {
            if (error) {
                throw error;
            }

            // generate prepared statements

            const mowerSQL = prepareMowerSQL(data);             // a single statement
            const scheduleSQLs = prepareScheduleSQLs(data);     // an array of statements
            const locationSQLs = prepareLocationSQLs(data);     // an array of statements
            const settingSQLs = prepareSettingSQLs(data);       // an array of statements
            const forecastSQLs = prepareForecastSQLs(data);     // an array of statements

            // insert into mowers table

            connection.query(mowerSQL, (error) => {
                if (error) {
                    return connection.rollback(() => {
                        throw error;
                    });
                }
            });

            // insert into schedules table

            scheduleSQLs.forEach((scheduleSQL) => {
                connection.query(scheduleSQL, (error) => {
                    if (error) {
                        return connection.rollback(() => {
                            throw error;
                        });
                    }
                });
            });

            // insert into locations table

            locationSQLs.forEach((locationSQL) => {
                connection.query(locationSQL, (error) => {
                    if (error) {
                        return connection.rollback(() => {
                            throw error;
                        });
                    }
                });
            });

            // insert into settings table (many records per mower)

            settingSQLs.forEach((settingSQL) => {
                connection.query(settingSQL, (error) => {
                    if (error) {
                        return connection.rollback(() => {
                            throw error;
                        });
                    }
                });
            });

            // insert into forecasts table (8 records per mower)

            forecastSQLs.forEach((forecastSQL) => {
                connection.query(forecastSQL, (error) => {
                    if (error) {
                        return connection.rollback(() => {
                            throw error;
                        });
                    }
                });
            });

            connection.commit((error) => {
                if (error) {
                    return connection.rollback(() => {
                        throw error;
                    });
                }

                connection.end();
            });
        });
    } catch (error) {
        console.log(error);
    }
};

/**
 * Prepares a SQL statement for insertion into the mowers table.
 * 
 * @param {Object} data the values to be inserted
 * @returns the prepared SQL statement
 */

const prepareMowerSQL = (data) => {
    const sql = "INSERT INTO gnometrics.mowers VALUES (" +
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
        data.connected,
        data.weather[0].fetchTs,
        data.userId
    ];

    return mysql.format(sql, values);
};

/**
 * Prepares a SQL statement for insertion into the schedules table.
 * 
 * @param {Object} data the values to be inserted
 * @returns the prepared SQL statement
 */

const prepareScheduleSQLs = (data) => {
    const sql = "INSERT INTO gnometrics.schedules VALUES (" +
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

    return statements;
};

/**
 * Prepares a SQL statement for insertion into the locations table.
 * 
 * @param {Object} data the values to be inserted
 * @returns the prepared SQL statement
 */

const prepareLocationSQLs = (data) => {
    const sql = "INSERT INTO gnometrics.locations VALUES (" +
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

    return statements;
};

/**
 * Prepares a SQL statement for insertion into the settings table.
 * 
 * @param {Object} data the values to be inserted
 * @returns the prepared SQL statement
 */

const prepareSettingSQLs = (data) => {
    const sql = "INSERT INTO gnometrics.settings VALUES (" +
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

    return statements;
};

/**
 * Prepares a SQL statement for insertion into the forecasts table.
 * 
 * @param {Object} data the values to be inserted
 * @returns the prepared SQL statement
 */

const prepareForecastSQLs = (data) => {
    const sql = "INSERT INTO gnometrics.forecasts VALUES (" +
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

    return statements;
};

/**
 * Export functions.
 */

module.exports = {
    bulkInsert
};