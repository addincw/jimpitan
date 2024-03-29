import { Request, Response } from "express";
import { z } from "zod";

import db from "../../../../database/models/index.cjs";

const { CommunityAssoc } = db;

const communityAssocFormSchema = z.object({
	name: z.string().min(1),
});

export async function index(req: Request, res: Response) {
	const page = req.query.p ? parseInt(req.query.p as string) : 1;
	const perPage = req.query.pp ? parseInt(req.query.pp as string) : 10;

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

export function create(req: Request, res: Response) {
	res.render("admin/residential/community-assocs/create", {
		title: "Tambah Rukun Warga (RW)",
	});
}

export async function store(req: Request, res: Response) {
	try {
		const validFormData = communityAssocFormSchema.parse(req.body);

		await CommunityAssoc.create(validFormData);

		req.flash("success", "data berhasil tersimpan");
		res.redirect("/admin/residential/community-assocs");
	} catch (error) {
		if (error instanceof z.ZodError) {
			req.flash("error", `gagal menyimpan data, periksa ulang form`);
			req.flash("errorPayload", JSON.stringify(error.flatten()));
		} else {
			req.flash("error", `gagal menyimpan data: ${error.message}`);
		}

		res.redirect("/admin/residential/community-assocs/create");
	}
}

export async function edit(req: Request, res: Response) {
	const { id } = req.params;

	const data = await CommunityAssoc.findByPk(id);

	res.render("admin/residential/community-assocs/edit", {
		title: "Edit Rukun Warga (RW): " + data.get("name"),
		data: data.toJSON(),
	});
}

export async function update(req: Request, res: Response) {
	const { id } = req.params;

	try {
		const data = await CommunityAssoc.findByPk(id);

		const validFormData = communityAssocFormSchema.parse(req.body);

		await data.update(validFormData);

		req.flash("success", "data berhasil tersimpan");
		res.redirect("/admin/residential/community-assocs");
	} catch (error) {
		req.flash("old", JSON.stringify(req.body));

		if (error instanceof z.ZodError) {
			req.flash("error", `gagal menyimpan data, periksa ulang form`);
			req.flash("errorPayload", JSON.stringify(error.flatten()));
		} else {
			req.flash("error", `gagal menyimpan data: ${error.message}`);
		}

		res.redirect(`/admin/residential/community-assocs/${id}`);
	}
}

export async function destroy(req: Request, res: Response) {
	const { id } = req.params;

	try {
		const data = await CommunityAssoc.findByPk(id);

		if (data) data.destroy();

		req.flash("success", "data berhasil dihapus");
	} catch (error) {
		req.flash("error", `gagal menghapus data: ${error.message}`);
	}

	res.redirect("/admin/residential/community-assocs");
}
