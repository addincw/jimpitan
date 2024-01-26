import { Request, Response } from "express";
import db from "../../../database/models/index.cjs";
const { Sequelize, CommunityAssoc, ResidentAssoc, ResidentAssocDue } = db;

export async function getReportMonthly(req: Request, res: Response) {
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
				type: 0,
			},
			group: [
				"resident_assoc_id",
				Sequelize.fn("month", Sequelize.col("date")),
			],
			order: [[Sequelize.fn("month", Sequelize.col("date")), "ASC"]],
			raw: true,
		});

		return res.json(result);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}
