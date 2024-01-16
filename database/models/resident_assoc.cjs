"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class ResidentAssoc extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			ResidentAssoc.belongsTo(models.CommunityAssoc);
			ResidentAssoc.hasMany(models.ResidentAssocDue);
		}
	}
	ResidentAssoc.init(
		{
			name: DataTypes.STRING,
			color_code: DataTypes.STRING,
			community_assoc_id: DataTypes.INTEGER,
		},
		{
			sequelize,
			modelName: "ResidentAssoc",
			underscored: true,
		}
	);
	return ResidentAssoc;
};
