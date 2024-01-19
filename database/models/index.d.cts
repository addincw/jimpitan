import { Model, ModelStatic, Sequelize } from "sequelize";
import {
	CommunityAssocAttributes,
	ResidentAssocAttributes,
	ResidentAssocDueAttributes,
	RoleAttributes,
	UserAttributes,
	UserFunctionaryAttributes,
	UserResidentAttributes,
} from "./models";

type Db = {
	sequelize: Sequelize;
	Sequelize: typeof Sequelize;
	CommunityAssoc: ModelStatic<
		Model<CommunityAssocAttributes, CommunityAssocAttributes>
	>;
	ResidentAssoc: ModelStatic<
		Model<ResidentAssocAttributes, ResidentAssocAttributes>
	>;
	ResidentAssocDue: ModelStatic<
		Model<ResidentAssocDueAttributes, ResidentAssocDueAttributes>
	>;
	Role: ModelStatic<Model<RoleAttributes, RoleAttributes>>;
	User: ModelStatic<Model<UserAttributes, UserAttributes>>;
	UserFunctionary: ModelStatic<
		Model<UserFunctionaryAttributes, UserFunctionaryAttributes>
	>;
	UserResident: ModelStatic<
		Model<UserResidentAttributes, UserResidentAttributes>
	>;
};

declare const db: Db;

export = db;
