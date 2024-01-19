import { NextFunction, Request, RequestHandler, Response } from "express";

export default function flashParser(): RequestHandler {
	return (req: Request, res: Response, next: NextFunction): void => {
		let notification: {
			type: "success" | "info" | "warning" | "error";
			message: string;
		} = null;

		const { error } = req.flash();

		if (error && error.length) {
			notification = { type: "error", message: error[0] };
		}

		res.locals.notification = notification;
		next();
	};
}
