const winston = require("winston");

const logger = winston.createLogger({
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.printf(({ level, message, timestamp }) => {
			return `[${timestamp}] ${level}: ${message}`;
		})
	),
	transports: [new winston.transports.File({ filename: "logs/app.log" })],
});

module.exports = logger;
