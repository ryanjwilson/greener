const log4js = require("log4js");

/**
 * Logs a timestamped messaged to the console.
 * 
 * @param {string} message the message to be logged
 */

const log = (message, error) => {
	const dtf = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/New_York",
		weekday: "short",
		year: "numeric",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	});
	console.info(`[${dtf.format(new Date())}] ${message}`);
	
	if (error) {
		log4js.configure({
			appenders: {
				log4js: {
					type: "file",
					filename: `logs/${getFormattedDate(new Date())}.log`
				}
			},
			categories: {
				default: {
					appenders: [ "log4js" ],
					level: "error"
				}
			}
		});
		
		const logger = log4js.getLogger("log4js");	// writes the last
		logger.error(message);						// error message plus
		logger.error(error);						// the error to a file
	}
};

/**
 * Formats a date as YYYYMMDD.
 * 
 * @param {Date} date the date to be formatted
 * @returns a string-formatted date
 */

const getFormattedDate = (date) => {
	let mm = date.getMonth() + 1;
	let dd = date.getDate();

	return [
		date.getFullYear(),
		(mm > 9 ? "" : "0") + mm,
		(dd > 9 ? "" : "0") + dd
	].join("");
};
  
/**
 * Export functions.
 */

module.exports = {
	log
};