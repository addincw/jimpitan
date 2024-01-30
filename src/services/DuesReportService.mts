import { FindAndCountOptions } from "sequelize";

import { toFormatCurrency } from "../helpers/string.mjs";
import { ResidentAssocDueAttributes } from "../../database/models/models";

import db from "../../database/models/index.cjs";
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
