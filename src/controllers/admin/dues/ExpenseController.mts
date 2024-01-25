import { Op } from "sequelize";
import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import moment from "moment";

import { make as hashMake } from "../../../helpers/hash.mjs";
import { UserAttributes } from "../../../../database/models/models";
import db from "../../../../database/models/index.cjs";

const {
	sequelize,
	CommunityAssoc,
	ResidentAssoc,
	ResidentAssocDue,
	Role,
	User,
	UserResident,
	UserFunctionary,
} = db;

const baseRoute = "/admin/dues/expense";
const baseRouteView = baseRoute.replace(new RegExp("^/"), "");

const expenseFormSchema = z.object({
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

async function getUserFunctionaryLoggedIn(userLoggedIn: Record<string, any>) {
	const userFunctionary = await UserFunctionary.findOne({
		where: { user_id: (userLoggedIn as UserAttributes).id },
		include: [
			{
				model: ResidentAssoc,
				as: "resident_assoc",
				include: ["community_assoc"],
			},
		],
	});
	return userFunctionary.toJSON();
}

function genWhereByFilters(query: Record<string, any>) {
	const q = query["f.q"] ? (query["f.q"] as string) : "";

	const filters = { q };

	const wheres: Record<string, any> = {};

	if (q) {
		wheres.description = {
			[Op.like]: `%${q}%`,
		};
	}
	return { filters, wheres };
}

export async function index(req: Request, res: Response, next: NextFunction) {
	const userFunctionary = await getUserFunctionaryLoggedIn(req.user);

	const { filters, wheres: filterWheres } = genWhereByFilters(req.query);

	const page = req.query.p ? parseInt(req.query.p as string) : 1;
	const perPage = req.query.pp ? parseInt(req.query.pp as string) : 10;

	const perPageOpts = [10, 20];

	const offset = (page - 1) * perPage;

	try {
		const data = await ResidentAssocDue.findAndCountAll({
			where: {
				...filterWheres,
				type: 1,
				resident_assoc_id: userFunctionary.resident_assoc_id,
			},
			include: [
				{
					model: UserFunctionary,
					as: "user_functionary",
					include: [
						"user",
						{
							model: ResidentAssoc,
							as: "resident_assoc",
							include: ["community_assoc"],
						},
					],
				},
				{
					model: UserResident,
					as: "user_resident",
					required: false,
					include: [
						"user",
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
			title: "Pengeluaran Iuran",
			roles: roles.map((row) => row.toJSON()),
			communityAssocs: communityAssocs.map((row) => {
				return row.toJSON();
			}),
			data: data.rows.map((row) => {
				const flattenRow = row.toJSON();
				return {
					...flattenRow,
					amount: new Intl.NumberFormat("id-ID", {
						maximumSignificantDigits: 2,
					}).format(flattenRow.amount),
					date: moment(flattenRow.date).format("DD, MMM YYYY. HH:MM"),
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
		title: "Catat Pengeluaran",
		roles: roles.map((row) => row.toJSON()),
		communityAssocs: communityAssocs.map((row) => {
			return row.toJSON();
		}),
	});
}

export async function store(req: Request, res: Response) {
	const dbTransaction = await sequelize.transaction();

	try {
		const validFormData = expenseFormSchema.parse({
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

		const validFormData = expenseFormSchema.parse({
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
