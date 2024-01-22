"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class CommunityAssoc extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			CommunityAssoc.hasMany(models.ResidentAssoc, { as: "resident_assocs" });
		}
	}
	CommunityAssoc.init(
		{
			name: DataTypes.STRING,
			color_code: DataTypes.STRING,
		},
		{
			sequelize,
			modelName: "CommunityAssoc",
			underscored: true,
		}
	);
	return CommunityAssoc;
};
