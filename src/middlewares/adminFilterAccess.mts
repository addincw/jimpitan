import { NextFunction, Request, RequestHandler, Response } from "express";

export default function adminFilterAccess(): RequestHandler {
	const noAuthRoutes = ["/login"];

	return (req: Request, res: Response, next: NextFunction) => {
		// handle acceess no auth routes
		if (noAuthRoutes.includes(req.url)) {
			// authenticated user cannot re-access login page
			if (req.url === "/login" && req.user) {
				return res.redirect("back");
			}
			return next();
		}

		// unauthenticated user cannot access admin pages
		if (!req.user) {
			req.flash("error", "Unauthorize access, please login first");
			return res.redirect("/admin/login");
		}

		res.locals.layout = "admin";
		res.locals.breadcrumbs = [
			{
				name: "Home",
				href: req.url != "/" && "/admin",
				active: req.url == "/",
			},
		];
		next();
	};
}
