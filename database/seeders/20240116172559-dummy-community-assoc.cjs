"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.bulkInsert(
			"Community_Assocs",
			[
				{
					name: "RW 01",
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					name: "RW 02",
					created_at: new Date(),
					updated_at: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete("Community_Assocs", null, {});
	},
};
