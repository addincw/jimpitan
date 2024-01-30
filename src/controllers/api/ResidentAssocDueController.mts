import { Request, Response } from "express";

import { Op } from "sequelize";
import moment from "moment";

import * as DuesReportService from "../../services/DuesReportService.mjs";

import db from "../../../database/models/index.cjs";
const { Sequelize, CommunityAssoc, ResidentAssoc, ResidentAssocDue, User, UserResident } = db;

export async function getReportMonthly(req: Request, res: Response) {
	let whereFilters: Record<string, any> = {};
	if (req.query.cai) {
		whereFilters["$resident_assoc.community_assoc.id$"] = req.query.cai;
	}
	if (req.query.rai) {
		whereFilters["$resident_assoc.id$"] = req.query.rai;
	}

	try {
		const result = await ResidentAssocDue.findAll({
			attributes: [
				[Sequelize.fn("month", Sequelize.col("date")), "month"],
				[Sequelize.fn("SUM", Sequelize.col("amount")), "total_amount"],
			],
			include: [
				{
					model: ResidentAssoc,
					as: "resident_assoc",
					attributes: ["id", "name", "color_code"],
					include: [
						{
							model: CommunityAssoc,
							as: "community_assoc",
							attributes: ["id", "name"],
						},
					],
				},
			],
			where: {
				...whereFilters,
				type: 0,
			},
			group: ["resident_assoc_id", Sequelize.fn("month", Sequelize.col("date"))],
			order: [[Sequelize.fn("month", Sequelize.col("date")), "ASC"]],
			raw: true,
		});

		return res.json(result);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function getReportPerUser(req: Request, res: Response) {
	let whereFilters: Record<string, any> = {};
	if (req.query["f.cai"]) {
		whereFilters["$resident_assoc.community_assoc.id$"] = req.query["f.cai"];
	}
	if (req.query["f.rai"]) {
		whereFilters["$resident_assoc.id$"] = req.query["f.rai"];
	}
	if (req.query["f.q"]) {
		whereFilters = {
			...whereFilters,
			[Op.or]: {
				"$user.firstname$": {
					[Op.like]: `%${req.query["f.q"]}%`,
				},
				"$user.lastname$": {
					[Op.like]: `%${req.query["f.q"]}%`,
				},
			},
		};
	}

	const perPage = req.query.pp ? parseInt(req.query.pp as string) : 10;
	const page = req.query.p ? parseInt(req.query.p as string) : 1;

	const offset = (page - 1) * perPage;

	try {
		const userResidents = await UserResident.findAndCountAll({
			where: {
				...whereFilters,
				"$user.role_id$": 3,
			},
			include: [
				{ model: User, as: "user", attributes: ["firstname", "lastname"] },
				{
					model: ResidentAssoc,
					as: "resident_assoc",
					attributes: ["id", "name"],
					include: [
						{
							model: CommunityAssoc,
							as: "community_assoc",
							attributes: ["id", "name"],
						},
					],
				},
			],
			limit: perPage,
			offset,
		});

		const residentAssocDues = await ResidentAssocDue.findAll({
			attributes: ["user_resident_id", [Sequelize.fn("date", Sequelize.col("date")), "date_dues"]],
			where: {
				[Op.and]: [
					Sequelize.literal(`EXTRACT(YEAR FROM date) = '${moment().format("YYYY")}'`),
					Sequelize.literal(`MONTH(date) = '${req.query["f.month"] ?? 1}'`),
				],
				type: 0,
				user_resident_id: {
					[Op.in]: userResidents.rows.map((user) => user.toJSON().id as number),
				},
			},
			order: [["date", "ASC"]],
		});

		const pageData = userResidents.rows.length;
		const pageTotal = Math.ceil(userResidents.count / perPage);

		return res.json({
			data: userResidents.rows.map((user) => {
				const userFlatten = user.toJSON();

				const userDues = residentAssocDues.filter((dues) => {
					return dues.toJSON().user_resident_id === userFlatten.id;
				});
				const userDuesFormatted = userDues.map((dues) => {
					const dateDues = dues.toJSON()["date_dues"];
					return dateDues.substring(5);
				});

				return { ...userFlatten, dues: userDuesFormatted };
			}),
			data_total: userResidents.count,
			data_show: {
				from: page * perPage - (perPage - 1),
				to: (page - 1) * perPage + pageData,
			},
			pagination: {
				per_page: perPage,
				page,
				page_total: pageTotal,
				page_next: page < pageTotal ? page + 1 : null,
				page_prev: page > 1 ? page - 1 : null,
			},
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
}

export async function getReportInOut(req: Request, res: Response) {
	const perPage = req.query.pp ? parseInt(req.query.pp as string) : 10;
	const page = req.query.p ? parseInt(req.query.p as string) : 1;

	const offset = (page - 1) * perPage;

	try {
		const result = await DuesReportService.getReportInOut({
			limit: perPage,
			offset,
		});

		return res.json(result);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}
