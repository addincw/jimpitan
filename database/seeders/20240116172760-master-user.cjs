"use strict";

const { Op } = require("sequelize");
const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// administrator
		const password = await bcrypt.hash("rahasia", 10);

		queryInterface.bulkInsert("Users", [
			{
				firstname: "Administrator",
				username: "administrator",
				password,
				role_id: 1,
				created_at: new Date(),
				updated_at: new Date(),
			},
		]);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete(
			"Users",
			{
				username: { [Op.eq]: "administrator" },
			},
			{}
		);
	},
};
