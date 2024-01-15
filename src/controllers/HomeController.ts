import { Request, Response } from "express";
import moment from "moment";

export function index(req: Request, res: Response) {
	const year = new Date().getFullYear(); // YYYY. ex: 2024
	const yearMonths = moment.monthsShort(); // MMM. ex: jan, feb, etc

	const daysEachMonths = yearMonths.map((month) => {
		const monthYear = `${month} ${year}`;
		const monthDays = moment(monthYear, "MMM YYYY").daysInMonth();

		return { month: monthYear, days: monthDays };
	});

	res.render("front/home", {
		title: "Home",
		daysEachMonths,
	});
}
