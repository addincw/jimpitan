const winston = require("winston");

const logger = winston.createLogger({
	transports: [new winston.transports.File({ filename: "logs/app.log" })],
});

module.exports = logger;
