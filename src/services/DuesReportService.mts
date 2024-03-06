import { FindAndCountOptions, Op } from "sequelize";

import { toFormatCurrency } from "../helpers/string.mjs";
import { ResidentAssocDueAttributes } from "../../database/models/models";

import db from "../../database/models/index.cjs";
import moment from "moment";
const { Sequelize, CommunityAssoc, ResidentAssoc, ResidentAssocDue } = db;

export async function getReportInOut(options?: FindAndCountOptions<ResidentAssocDueAttributes>) {
	const perPage = options?.limit ?? 10;
	const page = options?.offset ? Math.ceil(options.offset / perPage) + 1 : 1;

	const rawqTotalIn = "SUM(CASE WHEN type = 0 THEN amount ELSE 0 END)";
	const rawqTotalOut = "SUM(CASE WHEN type = 1 THEN amount ELSE 0 END)";

	const result = await ResidentAssocDue.findAndCountAll({
		...options,
		attributes: [
			[Sequelize.literal(rawqTotalIn), "total_in"],
			[Sequelize.literal(rawqTotalOut), "total_out"],
			[Sequelize.literal(`${rawqTotalIn} - ${rawqTotalOut}`), "balance"],
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
		group: ["resident_assoc_id"],
		order: [[Sequelize.literal("resident_assoc.community_assoc_id"), "ASC"]],
	});

	const pageData = result.rows.length;
	const pageTotal = Math.ceil(result.count.length / perPage);

	return {
		data: result.rows.map((row) => {
			const item = row.toJSON();
			return {
				...item,
				total_in: toFormatCurrency(item["total_in"]),
				total_out: toFormatCurrency(item["total_out"]),
				balance: toFormatCurrency(item["balance"]),
			};
		}),
		data_total: result.count.length,
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
	};
}

export type GetReportUncollectedDateParams = {
	user_resident_id: string;
	duesrange?: string;
};

export async function getReportUncollectedDates(params: GetReportUncollectedDateParams) {
	const { user_resident_id, duesrange = moment().format("MM/DD/YYYY") } = params;

	const [duesfrom, duesto = moment()] = duesrange.split(" - ").map((date: string) => moment(date));
	const totalDays = duesto.diff(duesfrom, "days");

	const duesDates = [];
	for (let i = 0; i <= totalDays; i++) {
		duesDates.push(moment(duesfrom).add(i, "day").format("YYYY-MM-DD"));
	}

	const duesDatesFmt = duesDates.map((date) => `'${date}'`).join(", ");
	const duesCollecteds = await ResidentAssocDue.findAndCountAll({
		where: {
			user_resident_id,
			date: {
				[Op.and]: [Sequelize.literal(`DATE(date) in (${duesDatesFmt})`)],
			},
		},
	});

	const collectedDates = duesCollecteds.rows.map((dues) => {
		return moment(dues.toJSON().date).format("YYYY-MM-DD");
	});

	const uncollectedDates = duesDates.filter((duesDate) => {
		const duesCollected = collectedDates.find((collectedDate) => {
			return collectedDate === duesDate;
		});
		return !duesCollected;
	});

	return {
		daterange: duesDates,
		date_collected: collectedDates,
		date_uncollected: uncollectedDates,
	};
}
