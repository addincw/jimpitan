"use strict";

const { faker } = require("@faker-js/faker/locale/id_ID");

const db = require("../models/index.cjs");
const { UserResident, UserFunctionary } = db;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const currentDate = 23; // limit dues for each user
		const residentAssocDues = [];

		const userFunctionaries = await UserFunctionary.findAll({ raw: true });
		const userResidents = await UserResident.findAll({ raw: true });

		userFunctionaries.forEach((user) => {
			// get resident in same resident_assoc
			const matchedResidenIds = userResidents
				.filter((userFunc) => {
					return userFunc.resident_assoc_id === user.resident_assoc_id;
				})
				.map(({ id }) => id);

			// get random resident
			const user_resident_id = Math.floor(Math.random() * 2)
				? matchedResidenIds[
						Math.floor(Math.random() * matchedResidenIds.length)
				  ]
				: null;

			residentAssocDues.push({
				resident_assoc_id: user.resident_assoc_id,
				user_resident_id,
				user_functionary_id: user.id,
				description: user_resident_id
					? "Penyaluran Iuran"
					: faker.finance.transactionDescription(),
				amount: faker.finance.amount(5000, 100000),
				date: faker.date.between({
					from: "2024-01-01T00:00:00.000Z",
					to: `2024-01-${currentDate}T00:00:00.000Z`,
				}),
				type: 1,
				created_at: new Date(),
				updated_at: new Date(),
			});
		});

		await queryInterface.bulkInsert(
			"Resident_Assoc_Dues",
			residentAssocDues,
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete("Resident_Assoc_Dues", { type: 1 }, {});
	},
};
