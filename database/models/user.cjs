"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class User extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			User.belongsTo(models.Role, { as: "role" });
			User.hasOne(models.UserFunctionary, {
				as: "user_functionary",
				foreignKey: "user_id",
			});
			User.hasOne(models.UserResident, {
				as: "user_resident",
				foreignKey: "user_id",
			});
		}
	}
	User.init(
		{
			firstname: DataTypes.STRING,
			lastname: DataTypes.STRING,
			email: DataTypes.STRING,
			phone: DataTypes.STRING,
			role_id: DataTypes.INTEGER,
			username: DataTypes.STRING,
			password: DataTypes.STRING,
		},
		{
			sequelize,
			modelName: "User",
			underscored: true,
		}
	);
	return User;
};
