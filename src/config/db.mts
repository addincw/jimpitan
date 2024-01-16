import { Dialect, Sequelize } from "sequelize";

const sequelize = new Sequelize(
	process.env.DB_DATABASE,
	process.env.DB_USERNAME,
	process.env.DB_PASSWORD,
	{
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT),
		dialect: process.env.DB_CONNECTION as Dialect,
	}
);

export default sequelize;
