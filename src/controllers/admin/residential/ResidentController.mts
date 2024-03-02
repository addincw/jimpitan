import { Identifier, Op } from "sequelize";
import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import moment from "moment";

import { generateRandomString } from "../../../helpers/string.mjs";
import { make as hashMake } from "../../../helpers/hash.mjs";
import { ROLE_FUNCTIONARY, ROLE_RESIDENT, getUserFunctionaryLoggedIn } from "../../../services/UserService.mjs";

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
		.min(11)
		.refine((value) => /^[0-9]+$/.test(value), {
			message: "Value must be a number",
		})
		.nullable(),
	resident_assoc_id: z.number().min(1),
});

export { baseRoute, baseRouteView };

async function genWhereByFilters(req: Request) {
	const { user, query } = req;

	const filters = {
		communityAssocId: query["f.cai"] ? parseInt(query["f.cai"] as string) : 0,
		residentAssocId: query["f.rai"] ? parseInt(query["f.rai"] as string) : 0,
		q: query["f.q"] ? (query["f.q"] as string) : "",
	};

	if (user.role_id === ROLE_FUNCTIONARY) {
		const userFunctionary = await getUserFunctionaryLoggedIn(user);

		filters.communityAssocId = userFunctionary.resident_assoc.community_assoc_id;
		filters.residentAssocId = userFunctionary.resident_assoc_id;
	}

	let whereCondition: Record<string, any> = {};

	if (filters.communityAssocId) {
		whereCondition["$resident_assoc.community_assoc.id$"] = filters.communityAssocId;
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

	return { filters, wheres: whereCondition };
}

export async function index(req: Request, res: Response, next: NextFunction) {
	const { filters, wheres: filterWheres } = await genWhereByFilters(req);

	const page = req.query.p ? parseInt(req.query.p as string) : 1;
	const perPage = req.query.pp ? parseInt(req.query.pp as string) : 10;

	const perPageOpts = [10, 20];

	const offset = (page - 1) * perPage;

	try {
		const data = await UserResident.findAndCountAll({
			where: filterWheres,
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
	} catch (error) {
		next(error);
	}
}

export async function create(req: Request, res: Response) {
	const communityAssocs = await CommunityAssoc.findAll();
	const editableResidentAssoc = req.user.role_id !== ROLE_FUNCTIONARY;

	res.render(baseRouteView + "/create", {
		title: "Tambah Kepala Keluarga (KK)",
		communityAssocs: communityAssocs.map((row) => {
			return row.toJSON();
		}),
		editableResidentAssoc,
	});
}

export async function store(req: Request, res: Response) {
	const dbTransaction = await sequelize.transaction();

	try {
		let inputResidentAssocId = req.body.resident_assoc_id;
		if (req.user.role_id === ROLE_FUNCTIONARY) {
			const userFunctionary = await getUserFunctionaryLoggedIn(req.user);
			inputResidentAssocId = userFunctionary.resident_assoc_id;
		}

		const validFormData = residentFormSchema.parse({
			...req.body,
			user_id: parseInt(req.body.user_id),
			resident_assoc_id: parseInt(inputResidentAssocId),
			phone: req.body.phone !== "" ? req.body.phone : null,
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
			role_id: ROLE_RESIDENT,
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
	const editableResidentAssoc = req.user.role_id !== ROLE_FUNCTIONARY;

	const data = await UserResident.findByPk(id, {
		include: [
			"user",
			{
				model: ResidentAssoc,
				as: "resident_assoc",
				include: ["community_assoc"],
			},
		],
	});

	const userResidentData = data.toJSON();
	const fullname = userResidentData.user.firstname + " " + userResidentData.user.lastname;

	res.render(baseRouteView + "/edit", {
		title: "Edit Kepala Keluarga (KK): " + fullname,
		formData: {
			id: userResidentData.id,
			community_assoc_id: userResidentData.resident_assoc.community_assoc_id,
			resident_assoc_id: userResidentData.resident_assoc_id,
			firstname: userResidentData.user.firstname,
			lastname: userResidentData.user.lastname,
			address: userResidentData.address,
			phone: userResidentData.user.phone,
		},
		communityAssocs: communityAssocs.map((row) => {
			return row.toJSON();
		}),
		editableResidentAssoc,
	});
}

export async function update(req: Request, res: Response) {
	const { id } = req.params;

	const dbTransaction = await sequelize.transaction();

	try {
		let inputResidentAssocId = req.body.resident_assoc_id;
		if (req.user.role_id === ROLE_FUNCTIONARY) {
			const userFunctionary = await getUserFunctionaryLoggedIn(req.user);
			inputResidentAssocId = userFunctionary.resident_assoc_id;
		}

		const data = await UserResident.findByPk(id);

		const validFormData = residentFormSchema.parse({
			...req.body,
			user_id: parseInt(req.body.user_id),
			resident_assoc_id: parseInt(inputResidentAssocId),
			phone: req.body.phone !== "" ? req.body.phone : null,
		});

		const { firstname, lastname, phone, ...userResidentData } = validFormData;
		const genUsername = firstname.toLowerCase() + generateRandomString(4);
		const genPassword = hashMake(genUsername);

		await data.update({ ...userResidentData });

		(await User.findByPk(data.get("user_id") as Identifier)).update({
			firstname,
			lastname,
			phone,
			username: genUsername,
			password: genPassword,
		});

		await dbTransaction.commit();

		req.flash("success", "data berhasil tersimpan");
		res.redirect(baseRoute + "/");
	} catch (error) {
		await dbTransaction.rollback();

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

	const dbTransaction = await sequelize.transaction();

	try {
		const data = await UserResident.findByPk(id);

		if (data) {
			await data.destroy();
			await User.destroy({ where: { id: data.toJSON().user_id } });
		}

		await dbTransaction.commit();

		req.flash("success", "data berhasil dihapus");
	} catch (error) {
		await dbTransaction.rollback();

		req.flash("error", `gagal menghapus data: kk memiliki riwayat iuran yang telah tercatat`);
	}

	res.redirect(baseRoute + "/");
}
