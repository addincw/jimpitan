"use strict";

const moment = require("moment");
const db = require("../models/index.cjs");

const { UserResident, UserFunctionary } = db;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const currentDate = 23; // limit dues for each user
		const residentAssocDues = [];

		const userFunctionaries = await UserFunctionary.findAll({ raw: true });
		const userResidents = await UserResident.findAll({ raw: true });

		userResidents.forEach((user) => {
			// get functionary in same resident_assoc
			const matchedFunctionaryIds = userFunctionaries
				.filter((userFunc) => {
					return userFunc.resident_assoc_id === user.resident_assoc_id;
				})
				.map(({ id }) => id);

			// get random functionary
			const user_functionary_id =
				matchedFunctionaryIds[
					Math.floor(Math.random() * matchedFunctionaryIds.length)
				];

			// range of date each user pay dues
			[...Array(currentDate + 1).keys()].map((i) => {
				if (i === 0) return;

				const timestamp = moment().format("HH:MM:SS");
				const yearMonth = moment().format("YYYY-MM");
				const date = i < 10 ? `0${i}` : `${i}`;

				// simulate is user pay dues or not
				if (Math.floor(Math.random() * 2)) {
					residentAssocDues.push({
						resident_assoc_id: user.resident_assoc_id,
						user_resident_id: user.id,
						user_functionary_id,
						description: "iuran jimpitan",
						amount: 500,
						date: `${yearMonth}-${date} ${timestamp}`,
						created_at: new Date(),
						updated_at: new Date(),
					});
				}
			});
		});

		await queryInterface.bulkInsert(
			"Resident_Assoc_Dues",
			residentAssocDues,
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete("Resident_Assoc_Dues", { type: 0 }, {});
	},
};
