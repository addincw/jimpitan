"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class ResidentAssocDue extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			ResidentAssocDue.belongsTo(models.UserResident, {
				as: "user_resident",
				foreignKey: "user_resident_id",
			});
			ResidentAssocDue.belongsTo(models.UserFunctionary, {
				as: "user_functionary",
				foreignKey: "user_functionary_id",
			});
		}
	}
	ResidentAssocDue.init(
		{
			description: DataTypes.STRING,
			amount: DataTypes.INTEGER,
			type: DataTypes.INTEGER,
			resident_assoc_id: DataTypes.INTEGER,
			user_resident_id: DataTypes.INTEGER,
			user_functionary_id: DataTypes.INTEGER,
			date: DataTypes.DATE,
		},
		{
			sequelize,
			modelName: "ResidentAssocDue",
			underscored: true,
		}
	);
	return ResidentAssocDue;
};
