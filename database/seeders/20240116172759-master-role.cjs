"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.bulkInsert(
			"Roles",
			[
				{
					name: "Administrator",
					slug: "administrator",
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					name: "Functionary (Kolektor Iuran)",
					slug: "functionary",
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					name: "Resident",
					slug: "resident",
					created_at: new Date(),
					updated_at: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete("Roles", null, {});
	},
};
