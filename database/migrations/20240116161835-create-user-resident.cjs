"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("User_Residents", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			user_id: {
				allowNull: false,
				references: {
					key: "id",
					model: "users",
				},
				type: Sequelize.INTEGER,
			},
			resident_assoc_id: {
				allowNull: false,
				references: {
					key: "id",
					model: "resident_assocs",
				},
				type: Sequelize.INTEGER,
			},
			address: {
				type: Sequelize.STRING,
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
		await queryInterface.dropTable("User_Residents");
	},
};
