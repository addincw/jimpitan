"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class UserFunctionary extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			UserFunctionary.belongsTo(models.User);
			UserFunctionary.hasMany(models.ResidentAssocDue);
		}
	}
	UserFunctionary.init(
		{
			user_id: DataTypes.INTEGER,
			resident_assoc_id: DataTypes.INTEGER,
		},
		{
			sequelize,
			modelName: "UserFunctionary",
			underscored: true,
		}
	);
	return UserFunctionary;
};
