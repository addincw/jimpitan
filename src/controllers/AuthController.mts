import { Request, Response } from "express";

export function login(req: Request, res: Response) {
	res.render("admin/login", { title: "Login" });
}
