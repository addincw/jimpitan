"use strict";

const { DataTypes, Op } = require("sequelize");
const { faker } = require("@faker-js/faker/locale/id_ID");

const ResidentAssocsFactory = require("../models/resident_assoc.cjs");
const UserFactory = require("../models/user.cjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const sequelize = new Sequelize(
			process.env.DB_DATABASE,
			process.env.DB_USERNAME,
			process.env.DB_PASSWORD,
			{
				host: process.env.DB_HOST,
				dialect: "mysql",
			}
		);
		const ResidentAssocs = ResidentAssocsFactory(sequelize, DataTypes);
		const User = UserFactory(sequelize, DataTypes);

		const residentAssocs = await ResidentAssocs.findAll();
		const residentAssocIds = residentAssocs.map((resident) =>
			resident.get("id")
		);

		const users = await User.findAll({
			where: {
				role_id: { [Op.eq]: 3 },
			},
		});
		const userIds = users.map((user) => user.get("id"));

		const getRandomId = () => {
			const randomId = residentAssocIds[Math.floor(Math.random() * 4)];
			return randomId;
		};

		await queryInterface.bulkInsert(
			"User_Residents",
			userIds.map((userId) => {
				return {
					user_id: userId,
					resident_assoc_id: getRandomId(),
					address: `${faker.location.buildingNumber()}/${faker.location.street()}`,
					created_at: new Date(),
					updated_at: new Date(),
				};
			}),
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete("User_Residents", null, {});
	},
};
