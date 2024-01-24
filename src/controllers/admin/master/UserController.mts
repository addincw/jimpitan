import { Identifier, Op } from "sequelize";
import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import moment from "moment";

import { generateRandomString } from "../../../helpers/string.mjs";
import { make as hashMake } from "../../../helpers/hash.mjs";
import db from "../../../../database/models/index.cjs";

const {
	sequelize,
	CommunityAssoc,
	ResidentAssoc,
	Role,
	User,
	UserResident,
	UserFunctionary,
} = db;

const baseRoute = "/admin/master/users";
const baseRouteView = baseRoute.replace(new RegExp("^/"), "");

const userFormSchema = z.object({
	firstname: z.string().min(3),
	lastname: z.string(),
	phone: z
		.string()
		.min(12)
		.refine((value) => /^[0-9]+$/.test(value), {
			message: "Value must be a number",
		}),
	role_id: z.number().min(1),
});

export { baseRoute, baseRouteView };

function buildWhereCondition(filters: {
	roleId: number;
	communityAssocId: number;
	residentAssocId: number;
	q: string;
}) {
	let whereCondition: Record<string, any> = {
		role_id: [1, 2],
	};

	if (filters.roleId) {
		whereCondition.role_id = filters.roleId;
	}

	if (filters.communityAssocId) {
		whereCondition["$user_functionary.resident_assoc.community_assoc.id$"] =
			filters.communityAssocId;
	}

	if (filters.residentAssocId) {
		whereCondition["$user_functionary.resident_assoc_id$"] =
			filters.residentAssocId;
	}

	if (filters.q) {
		whereCondition = {
			...whereCondition,
			[Op.or]: [
				{ firstname: { [Op.like]: `%${filters.q}%` } },
				{ lastname: { [Op.like]: `%${filters.q}%` } },
			],
		};
	}

	return whereCondition;
}

function getAccessByRole(roleId: number, fields: Record<string, any>) {
	let username = fields.username;
	let password = fields.password;
	if (roleId === 2) {
		username = generateRandomString(4);
		password = username;
	}
	return { username, password };
}

function validateByRole(roleId: number, fields: Record<string, any>) {
	if (roleId === 1 && (!fields.username || !fields.password)) {
		const errors = [];

		if (!fields.username) {
			errors.push({
				code: "custom",
				message: "username is required for administrator",
				path: ["username"],
			});
		}
		if (
			!fields.password &&
			(!fields.id || (fields.id && fields.req_change_password))
		) {
			errors.push({
				code: "custom",
				message: "password is required for administrator",
				path: ["password"],
			});
		}

		if (errors.length) {
			throw new z.ZodError(errors);
		}
	}

	if (roleId === 2 && !fields.resident_assoc_id) {
		throw new z.ZodError([
			{
				code: "custom",
				message: "RT is required for functionary",
				path: ["resident_assoc_id"],
			},
		]);
	}
}

export async function index(req: Request, res: Response, next: NextFunction) {
	const filters = {
		roleId: req.query["f.ri"] ? parseInt(req.query["f.ri"] as string) : 0,
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

	try {
		const data = await User.findAndCountAll({
			where: buildWhereCondition(filters),
			include: [
				"role",
				{
					model: UserFunctionary,
					as: "user_functionary",
					required: false,
					include: [
						{
							model: ResidentAssoc,
							as: "resident_assoc",
							include: ["community_assoc"],
						},
					],
				},
			],
			order: [["created_at", "DESC"]],
			limit: perPage,
			offset,
		});

		const totalPages = Math.ceil(data.count / perPage);
		const currentPage = page;

		const communityAssocs = await CommunityAssoc.findAll();
		const roles = await Role.findAll({
			where: { id: [1, 2] },
		});

		res.render(baseRouteView + "/index", {
			title: "Pengguna",
			roles: roles.map((row) => row.toJSON()),
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
	const roles = await Role.findAll({
		where: { id: [1, 2] },
	});

	res.render(baseRouteView + "/create", {
		title: "Tambah Pengguna",
		roles: roles.map((row) => row.toJSON()),
		communityAssocs: communityAssocs.map((row) => {
			return row.toJSON();
		}),
	});
}

export async function store(req: Request, res: Response) {
	const dbTransaction = await sequelize.transaction();

	try {
		const validFormData = userFormSchema.parse({
			...req.body,
			role_id: parseInt(req.body.role_id),
		});

		validateByRole(validFormData.role_id, req.body);

		const { firstname, lastname, phone, role_id } = validFormData;
		const { username, password } = getAccessByRole(role_id, req.body);

		const user = await User.create({
			firstname,
			lastname,
			phone,
			username,
			password: hashMake(password),
			role_id,
		});

		if (role_id === 2) {
			await UserFunctionary.create({
				resident_assoc_id: parseInt(req.body.resident_assoc_id),
				user_id: user.get("id") as number,
			});
		}

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
	const roles = await Role.findAll({
		where: { id: [1, 2] },
	});

	const data = await User.findByPk(id, {
		include: [
			"role",
			{
				model: UserFunctionary,
				as: "user_functionary",
				required: false,
				include: [
					{
						model: ResidentAssoc,
						as: "resident_assoc",
						include: ["community_assoc"],
					},
				],
			},
		],
	});

	const user = data.toJSON();
	const userFunctionary = user.user_functionary;
	const fullname = user.firstname + " " + user.lastname;

	res.render(baseRouteView + "/edit", {
		title: "Edit Pengguna: " + fullname,
		formData: {
			id: user.id,
			firstname: user.firstname,
			lastname: user.lastname,
			phone: user.phone,
			role_id: user.role_id,
			username: user.username,
			community_assoc_id: userFunctionary?.resident_assoc?.community_assoc_id,
			resident_assoc_id: userFunctionary?.resident_assoc_id,
		},
		roles: roles.map((row) => row.toJSON()),
		communityAssocs: communityAssocs.map((row) => {
			return row.toJSON();
		}),
	});
}

export async function update(req: Request, res: Response) {
	const { id } = req.params;

	const dbTransaction = await sequelize.transaction();

	try {
		const data = await User.findByPk(id);

		const validFormData = userFormSchema.parse({
			...req.body,
			role_id: parseInt(req.body.role_id),
		});

		validateByRole(validFormData.role_id, req.body);

		const { firstname, lastname, phone, role_id } = validFormData;
		const { username, password } = getAccessByRole(role_id, req.body);

		const dataWillUpdate: Record<string, any> = {
			firstname,
			lastname,
			phone,
			role_id,
		};

		if (role_id == 1) dataWillUpdate.username = username;

		if (req.body.req_change_password) {
			dataWillUpdate.password = hashMake(password);
			if (role_id == 2) {
				dataWillUpdate.username = username;
			}
		}

		await data.update(dataWillUpdate);

		if (role_id == 2) {
			const userFunctionary = await UserFunctionary.findOne({
				where: { user_id: data.get("id") as number },
			});
			userFunctionary.update({
				resident_assoc_id: parseInt(req.body.resident_assoc_id),
			});
		}

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
		const data = await User.findByPk(id);

		if (data) {
			if (data.get("role_id") == 2) {
				const userFunctionary = await UserFunctionary.findOne({
					where: { user_id: data.get("id") as number },
				});

				if (userFunctionary) userFunctionary.destroy();
			}

			data.destroy();
		}

		await dbTransaction.commit();

		req.flash("success", "data berhasil dihapus");
	} catch (error) {
		await dbTransaction.rollback();

		req.flash("error", `gagal menghapus data: ${error.message}`);
	}

	res.redirect(baseRoute + "/");
}
