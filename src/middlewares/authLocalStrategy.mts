import { Identifier, Op } from "sequelize";
import { DoneCallback } from "passport";
import { Strategy } from "passport-local";
import bcrypt from "bcrypt";

import { UserAttributes } from "../../database/models/models";
import db from "../../database/models/index.cjs";

const ADMIN_ID = 1;
const ADMIN = "administrator";

const { User } = db;

const localStrategy = () => {
	return new Strategy({ passReqToCallback: true }, async function verify(
		req,
		username,
		password,
		done
	) {
		try {
			const user = await User.findOne({
				where: { username: { [Op.eq]: username } },
			});

			let errMessage = "Incorrect username or password";

			const isAdministrator = req.body.role === ADMIN;

			if (!user) {
				if (!isAdministrator) errMessage = "Invalid PIN";
				return done(null, false, { message: errMessage });
			}

			if (
				user &&
				user.get("role_id") === ADMIN_ID &&
				!bcrypt.compareSync(password, user.get("password") as string)
			) {
				return done(null, false, { message: errMessage });
			}

			return done(null, user.get({ plain: true }));
		} catch (error) {
			return done(error, false, { message: "database connection error!" });
		}
	});
};

export const serializeUser = (user: UserAttributes, done: DoneCallback) => {
	done(null, user.id);
};

export const deserializeUser = (id: number, done: DoneCallback) => {
	User.findByPk(id as Identifier)
		.then((user) => done(null, user.get({ plain: true })))
		.catch((err) => done(err, false));
};

export default localStrategy;
