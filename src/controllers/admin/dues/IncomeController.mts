import { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";
import moment from "moment";

import { getUserFunctionaryLoggedIn } from "../../../services/UserService.mjs";

import db from "../../../../database/models/index.cjs";
const { Sequelize, ResidentAssoc, ResidentAssocDue, UserFunctionary, UserResident } = db;

const baseRoute = "/admin/dues/income";
const baseRouteView = baseRoute.replace(new RegExp("^/"), "");

export { baseRoute, baseRouteView };

function genWhereByFilters(query: Record<string, any>) {
	const q = query["f.q"] ? (query["f.q"] as string) : "";
	const status = query["f.status"] ? (query["f.status"] as string) : "";

	const filters = { q, status };

	let wheres: Record<string, any> = {};

	if (q) {
		wheres = {
			...wheres,
			[Op.or]: [{ "$user.firstname$": { [Op.like]: `%${q}%` } }, { "$user.lastname$": { [Op.like]: `%${q}%` } }],
		};
	}

	if (status) {
		const operation = status === "1" ? Op.ne : Op.eq;
		wheres["$resident_assoc_dues.date$"] = {
			[operation]: null,
		};
	}

	return { filters, wheres };
}

export async function index(req: Request, res: Response, next: NextFunction) {
	const userFunctionary = await getUserFunctionaryLoggedIn(req.user);

	const residentAssoc = userFunctionary.resident_assoc;
	const communityAssoc = userFunctionary.resident_assoc.community_assoc;

	const { filters, wheres: filterWheres } = genWhereByFilters(req.query);
	const relations = [
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
					[Op.and]: [Sequelize.literal(`DATE(date) = '${moment().format("YYYY-MM-DD")}'`)],
				},
			},
		},
	];

	const page = req.query.p ? parseInt(req.query.p as string) : 1;

	let perPage: number;
	if (!req.query.pp || req.query.pp === "all") {
		perPage = await UserResident.count({
			where: {
				...filterWheres,
				resident_assoc_id: userFunctionary.resident_assoc_id,
			},
			include: relations,
		});
	} else {
		perPage = parseInt(req.query.pp as string);
	}

	const perPageOpts = [10, 20, "all"];

	const offset = (page - 1) * perPage;

	try {
		// TODO: timezone client (+7) and server different, need some adjustment for querying data
		const data = await UserResident.findAndCountAll({
			subQuery: false,
			where: {
				...filterWheres,
				resident_assoc_id: userFunctionary.resident_assoc_id,
			},
			include: relations,
			order: [["created_at", "DESC"]],
			limit: perPage,
			offset,
		});

		const totalPages = Math.ceil(data.count / perPage);
		const currentPage = page;

		const residents = await UserResident.findAll({
			where: {
				resident_assoc_id: {
					[Op.eq]: userFunctionary.resident_assoc_id,
				},
			},
			include: ["user"],
		});

		res.render(baseRouteView + "/index", {
			title: `Kepala Keluarga ${residentAssoc.name}, ${communityAssoc.name}`,
			residents: residents.map((resident) => resident.toJSON()),
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
				perPage: !req.query.pp || req.query.pp === "all" ? "all" : perPage,
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
	const { user_resident_id, duesrange = moment().format("MM/DD/YYYY") } = req.body;

	const userFunctionary = await getUserFunctionaryLoggedIn(req.user);

	try {
		const [duesfrom, duesto = moment()] = duesrange.split(" - ").map((date: string) => moment(date));
		const totalDays = duesto.diff(duesfrom, "days");

		const duesDates = [];
		for (let i = 0; i <= totalDays; i++) {
			duesDates.push(moment(duesfrom).add(i, "day").format("YYYY-MM-DD"));
		}

		const duesDatesFmt = duesDates.map((date) => `'${date}'`).join(", ");
		const duesCollecteds = await ResidentAssocDue.findAndCountAll({
			where: {
				resident_assoc_id: userFunctionary.resident_assoc_id,
				user_resident_id,
				date: {
					[Op.and]: [Sequelize.literal(`DATE(date) in (${duesDatesFmt})`)],
				},
			},
		});

		if (duesCollecteds.count !== duesDates.length) {
			const uncollectedDates = duesDates.filter((dateToCollect) => {
				const duesCollected = duesCollecteds.rows.find((dues) => {
					const duesFlatten = dues.toJSON();
					const duesCollectedDate = moment(duesFlatten.date).format("YYYY-MM-DD");

					return duesCollectedDate === dateToCollect;
				});

				return !duesCollected;
			});

			// TODO: timezone client (+7) and server different, need some adjustment for storing data
			// temporary fix, with adding +7 before store
			const time = moment().add(7, "hours").format("HH:mm:ss");

			const duesCollectings = [];
			uncollectedDates.forEach((uncollectedDate) => {
				duesCollectings.push({
					resident_assoc_id: userFunctionary.resident_assoc_id,
					user_resident_id: parseInt(user_resident_id),
					user_functionary_id: userFunctionary.id,
					amount: 500,
					description: "iuran jimpitan",
					type: 0, // in,
					date: `${uncollectedDate} ${time}`,
				});
			});

			await ResidentAssocDue.bulkCreate(duesCollectings);
		}

		req.flash("success", "iuran telah tersimpan");
		res.redirect(baseRoute + "/");
	} catch (error) {
		req.flash("error", `gagal mencatat iuran: ${error.message}`);
		res.redirect(baseRoute + "/");
	}
}

export async function destroy(req: Request, res: Response) {
	const { id } = req.params;

	const userFunctionary = await getUserFunctionaryLoggedIn(req.user);

	try {
		const todayDues = await ResidentAssocDue.findOne({
			where: {
				resident_assoc_id: userFunctionary.resident_assoc_id,
				user_resident_id: id,
				date: {
					[Op.and]: [Sequelize.literal(`DATE(date) = '${moment().format("YYYY-MM-DD")}'`)],
				},
			},
		});

		if (todayDues) {
			todayDues.destroy();
		}

		req.flash("success", "pencatatan iuran dibatalkan");
		res.redirect(baseRoute + "/");
	} catch (error) {
		req.flash("error", `gagal membatalkan pencatatan iuran: ${error.message}`);
		res.redirect(baseRoute + "/");
	}
}
