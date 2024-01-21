import { Request, Response } from "express";
import { z } from "zod";

import db from "../../../../database/models/index.cjs";

const { CommunityAssoc, ResidentAssoc } = db;

const baseRoute = "/admin/residential/resident-assocs";
const baseRouteView = baseRoute.replace(new RegExp("^/"), "");

const residentAssocFormSchema = z.object({
	name: z.string().min(1),
	community_assoc_id: z.number().min(1),
});

export { baseRoute, baseRouteView };

export async function index(req: Request, res: Response) {
	const page = req.query.p ? parseInt(req.query.p as string) : 1;
	const perPage = req.query.pp ? parseInt(req.query.pp as string) : 10;

	const perPageOpts = [10, 20];

	const offset = (page - 1) * perPage;

	const data = await ResidentAssoc.findAndCountAll({
		include: ["community_assoc"],
		order: [["created_at", "DESC"]],
		limit: perPage,
		offset,
	});

	const totalPages = Math.ceil(data.count / perPage);
	const currentPage = page;

	res.render(baseRouteView + "/index", {
		title: "Rukun Tetangga (RT)",
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

export async function create(req: Request, res: Response) {
	const communityAssocs = await CommunityAssoc.findAll();

	res.render(baseRouteView + "/create", {
		title: "Tambah Rukun Tetangga (RT)",
		communityAssocs: communityAssocs.map((row) => {
			return row.toJSON();
		}),
	});
}

export async function store(req: Request, res: Response) {
	try {
		const validFormData = residentAssocFormSchema.parse({
			...req.body,
			community_assoc_id: parseInt(req.body.community_assoc_id),
		});

		await ResidentAssoc.create(validFormData);

		req.flash("success", "data berhasil tersimpan");
		res.redirect(baseRoute + "/");
	} catch (error) {
		if (error instanceof z.ZodError) {
			req.flash("error", `gagal menyimpan data, periksa ulang form`);
			req.flash("errorPayload", JSON.stringify(error.flatten()));
		} else {
			req.flash("error", `gagal menyimpan data: ${error.message}`);
		}

		res.redirect(baseRoute + "/create");
	}
}

export async function edit(req: Request, res: Response) {
	const { id } = req.params;

	const data = await ResidentAssoc.findByPk(id);

	res.render(baseRouteView + "/edit", {
		title: "Edit Rukun Tetangga (RT): " + data.get("name"),
		data: data.toJSON(),
	});
}

export async function update(req: Request, res: Response) {
	const { id } = req.params;

	try {
		const data = await ResidentAssoc.findByPk(id);

		const validFormData = residentAssocFormSchema.parse(req.body);

		await data.update(validFormData);

		req.flash("success", "data berhasil tersimpan");
		res.redirect(baseRoute + "/");
	} catch (error) {
		req.flash("old", JSON.stringify(req.body));

		if (error instanceof z.ZodError) {
			req.flash("error", `gagal menyimpan data, periksa ulang form`);
			req.flash("errorPayload", JSON.stringify(error.flatten()));
		} else {
			req.flash("error", `gagal menyimpan data: ${error.message}`);
		}

		res.redirect(baseRoute + `/${id}`);
	}
}

export async function destroy(req: Request, res: Response) {
	const { id } = req.params;

	try {
		const data = await ResidentAssoc.findByPk(id);

		if (data) data.destroy();

		req.flash("success", "data berhasil dihapus");
	} catch (error) {
		req.flash("error", `gagal menghapus data: ${error.message}`);
	}

	res.redirect(baseRoute + "/");
}
