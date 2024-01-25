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
	description: z.string().min(3),
	amount: z.number().gte(500),
	date: z.string().length(10),
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

		res.render(baseRouteView + "/index", {
			title: "Pengeluaran Iuran",
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
	const userFunctionary = await getUserFunctionaryLoggedIn(req.user);

	const userResidents = await User.findAll({
		where: {
			role_id: 3,
			"$user_resident.resident_assoc_id$": userFunctionary.resident_assoc_id,
		},
		include: ["user_resident"],
	});

	res.render(baseRouteView + "/create", {
		title: "Catat Pengeluaran",
		userResidents: userResidents.map((user) => user.toJSON()),
	});
}

export async function store(req: Request, res: Response) {
	try {
		const validFormData = expenseFormSchema.parse({
			...req.body,
			amount: parseInt(req.body.amount),
		});
		const userResidentId =
			req.body.user_resident_id !== ""
				? parseInt(req.body.user_resident_id)
				: null;

		const userFunctionary = await getUserFunctionaryLoggedIn(req.user);

		await ResidentAssocDue.create({
			...validFormData,
			resident_assoc_id: userFunctionary.resident_assoc_id,
			user_functionary_id: userFunctionary.id,
			user_resident_id: userResidentId,
			type: 1,
		});

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

	const userFunctionary = await getUserFunctionaryLoggedIn(req.user);
	const userResidents = await User.findAll({
		where: {
			role_id: 3,
			"$user_resident.resident_assoc_id$": userFunctionary.resident_assoc_id,
		},
		include: ["user_resident"],
	});

	const data = await ResidentAssocDue.findByPk(id, {
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
	});

	const dataJSON = data.toJSON();

	res.render(baseRouteView + "/edit", {
		title: "Edit Pengeluaran: ",
		userResidents: userResidents.map((user) => user.toJSON()),
		formData: {
			id: dataJSON.id,
			description: dataJSON.description,
			amount: dataJSON.amount,
			date: moment(dataJSON.date).format("YYYY-MM-DD"),
			user_resident_id: dataJSON.user_resident_id,
		},
	});
}

export async function update(req: Request, res: Response) {
	const { id } = req.params;

	try {
		const data = await ResidentAssocDue.findByPk(id);

		const validFormData = expenseFormSchema.parse({
			...req.body,
			amount: parseInt(req.body.amount),
		});
		const userResidentId =
			req.body.user_resident_id !== ""
				? parseInt(req.body.user_resident_id)
				: null;

		await data.update({
			...validFormData,
			user_resident_id: userResidentId,
		});

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
