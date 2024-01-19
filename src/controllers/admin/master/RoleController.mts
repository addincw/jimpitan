import { Request, Response } from "express";
import db from "../../../../database/models/index.cjs";

const { Role } = db;

export async function index(req: Request, res: Response) {
	const page = (req.query.page ?? 1) as number;
	const perPage = (req.query.perPage ?? 10) as number;

	const perPageOpts = [10, 20, "all"];

	const offset = (page - 1) * perPage;

	const data = await Role.findAndCountAll({
		order: [["created_at", "DESC"]],
		limit: perPage,
		offset,
	});

	const totalPages = Math.ceil(data.count / perPage);
	const currentPage = page;

	res.render("admin/master/roles/index", {
		title: "Role Pengguna",
		data: data.rows.map((row) => {
			return row.toJSON();
		}),
		perPageOpts,
		pagination: {
			currentPage,
			totalPages,
			perPage,
			offset,
			totalCount: data.count,
		},
	});
}
