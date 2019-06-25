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
 * Inserts data into the mowers, schedules, locations, settings, and forecasts tables
 * in a single transaction.
 * 
 * @param {Object} records the records to be inserted into the database
 * @throws a SQL error if there is a connection, transcation, or query error
 */

const bulkInsert = (records) => {
    logger.log("establishing connection to database.");

    records.forEach((record) => {
        try {
            const connection = getConnection();

            connection.beginTransaction((error) => {
                if (error) {
                    return logger.log("database connection refused.", error);
                }

                const mowerStmt = prepareMowerSQL(record);
                const schedulesStmt = prepareScheduleSQL(record);
                const locationsStmt = prepareLocationSQL(record);
                const settingsStmt = prepareSettingSQL(record);
                const forecastsStmt = prepareForecastSQL(record);
    
                connection.query(mowerStmt, (error) => {
                    if (error) {
                        logger.log("error in SQL statement.");
                        logger.log("rolling back and writing error to logs.", error);
    
                        connection.rollback();
                        return connection.end();
                    }

                    connection.query(schedulesStmt, (error) => {
                        if (error) {
                            logger.log("error in SQL statment.");
                            logger.log("rolling back and writing error to logs.", error);
        
                            connection.rollback();
                            return connection.end();
                        }

                        connection.query(locationsStmt, (error) => {
                            if (error) {
                                logger.log("error in SQL statement.");
                                logger.log("rolling back and writing error to logs.", error);

                                connection.rollback();
                                return connection.end();
                            }

                            connection.query(settingsStmt, (error) => {
                                if (error) {
                                    logger.log("error in SQL statement.");
                                    loggler.log("rolling back and writing error to logs.", error);

                                    connection.rollback();
                                    return connection.end();
                                }

                                connection.query(forecastsStmt, (error) => {
                                    if (error) {
                                        logger.log("error in SQL statement.");
                                        loggler.log("rolling back and writing error to logs.", error);

                                        connection.rollback();
                                        return connection.end();
                                    }

                                    connection.commit((error) => {
                                        if (error) {
                                            logger.log("failed to commit transaction.");
                                            logger.log("rolling back and writing error to logs.", error);

                                            connection.rollback();
                                            return connection.end();
                                        }

                                        connection.end();
                                        logger.log("successfully inserted records into database.");
                                    });
                                });
                            });
                        });
                    });
                });
            });
        } catch (error) {
            console.error(error);
        }
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
        data.connected ? 1: 0,
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

const prepareScheduleSQL = (data) => {
    const sql = `INSERT INTO schedules1 VALUES (` +
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

    return statements.join(";");
};

/**
 * Prepares a SQL statement for insertion into the locations table.
 * 
 * @param {Object} data the values to be inserted
 * @returns the prepared SQL statement
 */

const prepareLocationSQL = (data) => {
    const sql = `INSERT INTO locations VALUES (` +
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

    return statements.join(";");
};

/**
 * Prepares a SQL statement for insertion into the settings table.
 * 
 * @param {Object} data the values to be inserted
 * @returns the prepared SQL statement
 */

const prepareSettingSQL = (data) => {
    const sql = `INSERT INTO settings VALUES (` +
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

    return statements.join(";");
};

/**
 * Prepares a SQL statement for insertion into the forecasts table.
 * 
 * @param {Object} data the values to be inserted
 * @returns the prepared SQL statement
 */

const prepareForecastSQL = (data) => {
    const sql = `INSERT INTO forecasts VALUES (` +
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

    return statements.join(";");
};

/**
 * Export functions.
 */

module.exports = {
    bulkInsert
};