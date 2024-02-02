import * as winston from "winston";

// Define a custom type for the logger instance
export interface LoggerInstance extends winston.Logger {
	// You can add custom methods or properties if needed
}

// Export the logger instance with the custom type
declare const logger: LoggerInstance;
export default logger;
