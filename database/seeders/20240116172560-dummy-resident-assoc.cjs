"use strict";

const { DataTypes } = require("sequelize");
const CommunityAssocsFactory = require("../models/community_assoc.cjs");

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
		const CommunityAssocs = CommunityAssocsFactory(sequelize, DataTypes);

		const communityAssocs = await CommunityAssocs.findAll();
		const communityAssocIds = communityAssocs.map((community) =>
			community.get("id")
		);

		const getRandomId = () => {
			const randomId = communityAssocIds[Math.floor(Math.random() * 2)];
			return randomId;
		};

		await queryInterface.bulkInsert(
			"Resident_Assocs",
			[
				{
					name: "RT 01",
					community_assoc_id: getRandomId(),
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					name: "RT 02",
					community_assoc_id: getRandomId(),
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					name: "RT 03",
					community_assoc_id: getRandomId(),
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					name: "RT 04",
					community_assoc_id: getRandomId(),
					created_at: new Date(),
					updated_at: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete("Resident_Assocs", null, {});
	},
};
