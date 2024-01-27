import { NextFunction, Request, Response } from "express";
import moment from "moment";

import db from "../../database/models/index.cjs";
const { CommunityAssoc, ResidentAssoc, UserResident } = db;

export async function index(req: Request, res: Response, next: NextFunction) {
	try {
		const communityAssocs = await CommunityAssoc.findAndCountAll({ raw: true });

		const year = new Date().getFullYear(); // YYYY. ex: 2024
		const yearMonths = moment.monthsShort(); // MMM. ex: jan, feb, etc
		const daysEachMonths = yearMonths.map((month) => {
			const monthYear = `${month} ${year}`;
			const monthDays = moment(monthYear, "MMM YYYY").daysInMonth();

			return { month: monthYear, days: monthDays };
		});

		res.render("front/home", {
			title: "Home",
			statResidential: {
				totalCommunityAssocs: communityAssocs.count,
				totalResidentAssocs: await ResidentAssoc.count(),
				totalUserResident: await UserResident.count(),
			},
			communityAssocs: communityAssocs.rows,
			daysEachMonths,
		});
	} catch (error) {
		next(error);
	}
}
