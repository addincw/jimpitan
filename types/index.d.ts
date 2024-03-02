import { Request } from "express";
import { Session, SessionData } from "express-session";
import winston from "winston";

import { UserAttributes } from "../database/models/models";

declare module "express" {
	interface Request {
		logger: winston.Logger;
		session: Session &
			Partial<SessionData> & {
				old?: string;
			};
		user: UserAttributes;
	}
}
