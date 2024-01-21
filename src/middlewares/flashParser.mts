import { NextFunction, Request, RequestHandler, Response } from "express";

export default function flashParser(): RequestHandler {
	return (req: Request, res: Response, next: NextFunction): void => {
		let notification: {
			type: "success" | "info" | "warning" | "danger";
			icon: "fa-check" | "fa-info" | "fa-exclamation-triangle" | "fa-ban";
			title: string;
			message: string;
		};

		const { success, error, errorPayload } = req.flash();

		if (success && success.length) {
			notification = {
				type: "success",
				icon: "fa-check",
				title: "success",
				message: success[0],
			};
			res.locals.notification = notification;
		}

		if (error && error.length) {
			notification = {
				type: "danger",
				icon: "fa-ban",
				title: "terjadi kesalahan",
				message: error[0],
			};
			res.locals.notification = notification;
		}

		if (errorPayload && errorPayload.length) {
			res.locals.errors = JSON.parse(errorPayload[0]);
		}

		next();
	};
}
