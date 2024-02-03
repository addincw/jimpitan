import { Request } from "express";
import { Session, SessionData } from "express-session";
import winston from "winston";

declare module "express" {
	interface Request {
		logger: winston.Logger;
		session: Session &
			Partial<SessionData> & {
				old?: string;
			};
	}
}
