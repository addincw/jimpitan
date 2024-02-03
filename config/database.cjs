require("dotenv/config");

const logger = require("./logger.cjs");

module.exports = {
	development: {
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_DATABASE,
		host: process.env.DB_HOST,
		dialect: process.env.DB_CONNECTION ?? "mysql",
	},
	test: {
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_DATABASE,
		host: process.env.DB_HOST,
		dialect: process.env.DB_CONNECTION ?? "mysql",
	},
	production: {
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_DATABASE,
		host: process.env.DB_HOST,
		dialect: process.env.DB_CONNECTION ?? "mysql",
		logging: (msg) => logger.info(msg),
	},
};
