"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("Resident_Assoc_Dues", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			description: {
				allowNull: false,
				type: Sequelize.STRING,
			},
			amount: {
				allowNull: false,
				type: Sequelize.INTEGER,
			},
			type: {
				type: Sequelize.INTEGER,
				defaultValue: 0, // 0 = in; 1 = out
			},
			resident_assoc_id: {
				allowNull: false,
				references: {
					key: "id",
					model: "resident_assocs",
				},
				type: Sequelize.INTEGER,
			},
			user_resident_id: {
				allowNull: false,
				references: {
					key: "id",
					model: "user_residents",
				},
				type: Sequelize.INTEGER,
			},
			user_functionary_id: {
				allowNull: false,
				references: {
					key: "id",
					model: "user_functionaries",
				},
				type: Sequelize.INTEGER,
			},
			date: {
				type: Sequelize.DATE,
			},
			created_at: {
				allowNull: false,
				type: Sequelize.DATE,
			},
			updated_at: {
				allowNull: false,
				type: Sequelize.DATE,
			},
		});
	},
	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable("Resident_Assoc_Dues");
	},
};
