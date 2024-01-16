"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class ResidentAssocIncome extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			ResidentAssocIncome.belongsTo(models.UserResident);
			ResidentAssocIncome.belongsTo(models.UserFunctionary);
		}
	}
	ResidentAssocIncome.init(
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
			modelName: "ResidentAssocIncome",
			underscored: true,
		}
	);
	return ResidentAssocIncome;
};
