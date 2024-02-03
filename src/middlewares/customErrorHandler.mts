import { ErrorRequestHandler, NextFunction, Request, Response } from "express";

export default function customErrorHandler(): ErrorRequestHandler {
	return (err: Error, req: Request, res: Response, next: NextFunction) => {
		if (process.env.NODE_ENV === "production") {
			req.logger.error(err.stack);
			res.status(500).render("front/error", { layout: false, title: "Kesalahan Server" });
			return;
		}
		next(err);
	};
}
