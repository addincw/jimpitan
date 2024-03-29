"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class UserResident extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			UserResident.belongsTo(models.User, {
				as: "user",
				foreignKey: "user_id",
			});
			UserResident.belongsTo(models.ResidentAssoc, {
				as: "resident_assoc",
				foreignKey: "resident_assoc_id",
			});
			UserResident.hasMany(models.ResidentAssocDue, {
				as: "resident_assoc_dues",
				foreignKey: "user_resident_id",
			});
		}
	}
	UserResident.init(
		{
			user_id: DataTypes.INTEGER,
			resident_assoc_id: DataTypes.INTEGER,
			address: DataTypes.STRING,
		},
		{
			sequelize,
			modelName: "UserResident",
			underscored: true,
		}
	);
	return UserResident;
};
