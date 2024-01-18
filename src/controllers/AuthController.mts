import { Request, Response } from "express";

export function login(req: Request, res: Response) {
	res.render("admin/login", { layout: false, title: "Login" });
}

export function authenticate(req: Request, res: Response) {
	res.redirect("/admin");
}

export function logout(req: Request, res: Response) {
	res.redirect("admin/login");
}
