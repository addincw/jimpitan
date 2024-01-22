import { Op } from "sequelize";
import { Request, Response } from "express";
import { z } from "zod";
import moment from "moment";

import { generateRandomString } from "../../../helpers/string.mjs";
import { make as hashMake } from "../../../helpers/hash.mjs";
import db from "../../../../database/models/index.cjs";

const { sequelize, CommunityAssoc, ResidentAssoc, User, UserResident } = db;

const baseRoute = "/admin/residential/residents";
const baseRouteView = baseRoute.replace(new RegExp("^/"), "");

const residentFormSchema = z.object({
	firstname: z.string().min(3),
	lastname: z.string(),
	address: z.string().min(10),
	phone: z
		.string()
		.min(12)
		.refine((value) => /^[0-9]+$/.test(value), {
			message: "Value must be a number",
		}),
	resident_assoc_id: z.number().min(1),
});

export { baseRoute, baseRouteView };

function buildWhereCondition(filters: {
	communityAssocId: number;
	residentAssocId: number;
	q: string;
}) {
	let whereCondition: Record<string, any> = {};

	if (filters.communityAssocId) {
		whereCondition["$resident_assoc.community_assoc.id$"] =
			filters.communityAssocId;
	}

	if (filters.residentAssocId) {
		whereCondition.resident_assoc_id = {
			[Op.eq]: filters.residentAssocId,
		};
	}

	if (filters.q) {
		whereCondition = {
			...whereCondition,
			[Op.or]: [
				{ "$user.firstname$": { [Op.like]: `%${filters.q}%` } },
				{ "$user.lastname$": { [Op.like]: `%${filters.q}%` } },
			],
		};
	}

	return whereCondition;
}

export async function index(req: Request, res: Response) {
	const filters = {
		communityAssocId: req.query["f.cai"]
			? parseInt(req.query["f.cai"] as string)
			: 0,
		residentAssocId: req.query["f.rai"]
			? parseInt(req.query["f.rai"] as string)
			: 0,
		q: req.query["f.q"] ? (req.query["f.q"] as string) : "",
	};

	const page = req.query.p ? parseInt(req.query.p as string) : 1;
	const perPage = req.query.pp ? parseInt(req.query.pp as string) : 10;

	const perPageOpts = [10, 20];

	const offset = (page - 1) * perPage;

	const data = await UserResident.findAndCountAll({
		where: buildWhereCondition(filters),
		include: [
			"user",
			{
				model: ResidentAssoc,
				as: "resident_assoc",
				include: ["community_assoc"],
			},
		],
		order: [["created_at", "DESC"]],
		limit: perPage,
		offset,
	});

	const totalPages = Math.ceil(data.count / perPage);
	const currentPage = page;

	const communityAssocs = await CommunityAssoc.findAll();

	res.render(baseRouteView + "/index", {
		title: "Kepala Keluarga (KK)",
		communityAssocs: communityAssocs.map((row) => {
			return row.toJSON();
		}),
		data: data.rows.map((row) => {
			const flattenRow = row.toJSON();
			return {
				...flattenRow,
				createdAt: moment(flattenRow.createdAt).format("DD, MMM YYYY. HH:MM"),
				updatedAt: moment(flattenRow.updatedAt).format("DD, MMM YYYY. HH:MM"),
			};
		}),
		perPageOpts,
		pagination: {
			currentPage,
			totalPages,
			perPage,
			offset,
			showFrom: currentPage * perPage - (perPage - 1),
			showTo: (currentPage - 1) * perPage + data.rows.length,
			totalCount: data.count,
		},
		filters,
	});
}

export async function create(req: Request, res: Response) {
	const communityAssocs = await CommunityAssoc.findAll();

	res.render(baseRouteView + "/create", {
		title: "Tambah Kepala Keluarga (KK)",
		communityAssocs: communityAssocs.map((row) => {
			return row.toJSON();
		}),
	});
}

export async function store(req: Request, res: Response) {
	const dbTransaction = await sequelize.transaction();

	try {
		const validFormData = residentFormSchema.parse({
			...req.body,
			user_id: parseInt(req.body.user_id),
			resident_assoc_id: parseInt(req.body.resident_assoc_id),
		});

		const { firstname, lastname, phone, ...userResidentData } = validFormData;
		const genUsername = firstname.toLowerCase() + generateRandomString(4);
		const genPassword = hashMake(genUsername);

		const user = await User.create({
			firstname,
			lastname,
			phone,
			username: genUsername,
			password: genPassword,
			role_id: 3, // resident = 3
		});

		await UserResident.create({
			...userResidentData,
			user_id: user.get("id") as number,
		});

		await dbTransaction.commit();

		req.flash("success", "data berhasil tersimpan");
		res.redirect(baseRoute + "/");
	} catch (error) {
		await dbTransaction.rollback();

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

	const communityAssocs = await CommunityAssoc.findAll();
	const data = await UserResident.findByPk(id);

	res.render(baseRouteView + "/edit", {
		title: "Edit Rukun Tetangga (RT): " + data.get("name"),
		formData: data.toJSON(),
		communityAssocs: communityAssocs.map((row) => {
			return row.toJSON();
		}),
	});
}

export async function update(req: Request, res: Response) {
	const { id } = req.params;

	try {
		const data = await UserResident.findByPk(id);

		const validFormData = residentFormSchema.parse({
			...req.body,
			user_id: parseInt(req.body.user_id),
			resident_assoc_id: parseInt(req.body.resident_assoc_id),
		});

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
		const data = await UserResident.findByPk(id);

		if (data) data.destroy();

		req.flash("success", "data berhasil dihapus");
	} catch (error) {
		req.flash("error", `gagal menghapus data: ${error.message}`);
	}

	res.redirect(baseRoute + "/");
}
