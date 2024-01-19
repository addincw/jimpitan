import { Model, ModelStatic, Sequelize } from "sequelize";

interface CommunityAssocAttributes {
	name: string;
	color_code: string;
}

interface ResidentAssocAttributes {
	name: string;
	color_code: string;
	community_assoc_id: number;
}

interface ResidentAssocDueAttributes {
	description: string;
	amount: number;
	type: number;
	resident_assoc_id: number;
	user_resident_id: number;
	user_functionary_id: number;
	date: string;
}

interface RoleAttributes {
	name: string;
	slug: string;
}

interface UserAttributes {
	id: number;
	firstname: string;
	lastname: string;
	email: string;
	phone: string;
	role_id: number;
	username: string;
	password: string;
}

interface UserResidentAttributes {
	user_id: number;
	resident_assoc_id: number;
	address: string;
}

interface UserFunctionaryAttributes {
	user_id: number;
	resident_assoc_id: number;
}

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
