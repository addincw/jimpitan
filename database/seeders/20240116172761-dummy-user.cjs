"use strict";
const { faker } = require("@faker-js/faker/locale/id_ID");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const usersAsFunctionary = [...Array(12).keys()].map((i) => {
			const pinAsUsername = (Math.random() + 1).toString(36).substring(8);
			const password = bcrypt.hashSync(pinAsUsername, 10);

			return {
				firstname: faker.person.firstName(),
				lastname: faker.person.lastName(),
				username: pinAsUsername,
				password,
				role_id: 2,
				created_at: new Date(),
				updated_at: new Date(),
			};
		});

		const usersAsResident = [...Array(35).keys()].map((i) => {
			const firstname = faker.person.firstName();
			const pinAsUsername = (Math.random() + 1).toString(36).substring(8);
			const password = bcrypt.hashSync(pinAsUsername, 10);

			return {
				firstname,
				lastname: faker.person.lastName(),
				username: `${firstname.toLowerCase()}@${pinAsUsername}`,
				password,
				role_id: 3,
				created_at: new Date(),
				updated_at: new Date(),
			};
		});

		queryInterface.bulkInsert(
			"Users",
			[...usersAsFunctionary, ...usersAsResident],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete(
			"Users",
			{
				username: { [Op.ne]: "administrator" },
			},
			{}
		);
	},
};
