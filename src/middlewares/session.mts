import { RequestHandler } from "express";
import { default as expsess } from "express-session";
import sequelizeStoreFactory from "connect-session-sequelize";

import db from "../../database/models/index.cjs";
const { sequelize } = db;

const SequelizeStore = sequelizeStoreFactory(expsess.Store);

export default function session(): RequestHandler {
	const store = new SequelizeStore({ db: sequelize });
	store.sync();

	return expsess({
		secret: "candi",
		resave: false,
		saveUninitialized: false,
		store: store,
	});
}
