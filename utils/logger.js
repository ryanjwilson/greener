/**
 * Logs a timestamped messaged to the console.
 * 
 * @param {string} message the message to be logged
 */

const log = (message) => {
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
  };
  
  /**
   * Export functions.
   */
  
  module.exports = {
    log
  };
  