import { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";
import moment from "moment";

import { UserAttributes } from "../../../../database/models/models";
import db from "../../../../database/models/index.cjs";

const {
	Sequelize,
	ResidentAssoc,
	ResidentAssocDue,
	UserFunctionary,
	UserResident,
} = db;

const baseRoute = "/admin/dues/income";
const baseRouteView = baseRoute.replace(new RegExp("^/"), "");

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
	const status = query["f.status"] ? (query["f.status"] as string) : "";

	const filters = { q, status };

	let wheres: Record<string, any> = {};

	if (q) {
		wheres = {
			...wheres,
			[Op.or]: [
				{ "$user.firstname$": { [Op.like]: `%${q}%` } },
				{ "$user.lastname$": { [Op.like]: `%${q}%` } },
			],
		};
	}

	return { filters, wheres };
}

export async function index(req: Request, res: Response, next: NextFunction) {
	const userFunctionary = await getUserFunctionaryLoggedIn(req.user);

	const residentAssoc = userFunctionary.resident_assoc;
	const communityAssoc = userFunctionary.resident_assoc.community_assoc;

	const { filters, wheres: filterWheres } = genWhereByFilters(req.query);

	const page = req.query.p ? parseInt(req.query.p as string) : 1;
	const perPage = req.query.pp ? parseInt(req.query.pp as string) : 10;

	const perPageOpts = [10, 20];

	const offset = (page - 1) * perPage;

	try {
		// TODO: timezone client (+7) and server different, need some adjustment for querying data
		const data = await UserResident.findAndCountAll({
			subQuery: false,
			where: {
				...filterWheres,
				resident_assoc_id: userFunctionary.resident_assoc_id,
			},
			include: [
				"user",
				{
					model: ResidentAssoc,
					as: "resident_assoc",
					include: ["community_assoc"],
				},
				{
					model: ResidentAssocDue,
					as: "resident_assoc_dues",
					required: filters.status === "1",
					where: {
						date: {
							[Op.and]: [
								Sequelize.literal(
									`DATE(date) = '${moment().format("YYYY-MM-DD")}'`
								),
							],
						},
					},
				},
			],
			order: [["created_at", "DESC"]],
			limit: perPage,
			offset,
		});

		const totalPages = Math.ceil(data.count / perPage);
		const currentPage = page;

		res.render(baseRouteView + "/index", {
			title: `Kepala Keluarga ${residentAssoc.name}, ${communityAssoc.name}`,
			data: data.rows.map((row) => {
				const flattenRow = row.toJSON();
				return {
					...flattenRow,
					collectAt: moment().format("DD, MMM YYYY"),
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

export async function store(req: Request, res: Response) {
	const { id } = req.params;

	const userFunctionary = await getUserFunctionaryLoggedIn(req.user);

	try {
		const todayDues = await ResidentAssocDue.findOne({
			where: {
				resident_assoc_id: userFunctionary.resident_assoc_id,
				user_resident_id: id,
				date: {
					[Op.and]: [
						Sequelize.literal(
							`DATE(date) = '${moment().format("YYYY-MM-DD")}'`
						),
					],
				},
			},
			raw: true,
		});

		if (!todayDues) {
			const date = moment().format("YYYY-MM-DD HH:mm:ss");

			// TODO: timezone client (+7) and server different, need some adjustment for storing data
			const dueCreated = await ResidentAssocDue.create({
				resident_assoc_id: userFunctionary.resident_assoc_id,
				user_resident_id: parseInt(id),
				user_functionary_id: userFunctionary.id,
				amount: 500,
				description: "iuran jimpitan",
				type: 0, // in,
				date: moment().format("YYYY-MM-DD HH:mm:ss"),
			});

			console.log("due time", date, dueCreated.get("date"));
		}

		req.flash("success", "data berhasil tersimpan");
		res.redirect(baseRoute + "/");
	} catch (error) {
		req.flash("error", `gagal menyimpan data: ${error.message}`);
		res.redirect(baseRoute + "/");
	}
}
