import { Request, Response } from "express";

export function index(req: Request, res: Response) {
	res.render("admin/dashboard/index", {
		title: "Dashboard",
	});
}
