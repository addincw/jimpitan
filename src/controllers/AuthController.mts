import { NextFunction, Request, Response } from "express";

export function login(req: Request, res: Response) {
	res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
	res.header("Expires", "-1");
	res.header("Pragma", "no-cache");
	res.render("admin/login", { layout: false, title: "Login" });
}

export function authenticate(req: Request, res: Response) {
	res.redirect("/admin");
}

export function logout(req: Request, res: Response, next: NextFunction) {
	// TODO: session still not removing from db
	req.session.destroy((err) => {
		if (err) return next(err);

		res.redirect("admin/login");
	});
}
