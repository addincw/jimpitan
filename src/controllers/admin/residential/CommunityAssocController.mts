import { Request, Response } from "express";
import db from "../../../../database/models/index.cjs";

const { CommunityAssoc } = db;

export async function index(req: Request, res: Response) {
	const page = req.query.p ? parseInt(req.query.p as string) : 1;
	const perPage = req.query.pp ? parseInt(req.query.pp as string) : 1;

	const perPageOpts = [10, 20];

	const offset = (page - 1) * perPage;

	const data = await CommunityAssoc.findAndCountAll({
		order: [["created_at", "DESC"]],
		limit: perPage,
		offset,
	});

	const totalPages = Math.ceil(data.count / perPage);
	const currentPage = page;

	res.render("admin/residential/community-assocs/index", {
		title: "Rukun Warga (RW)",
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
