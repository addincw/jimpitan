import { Identifier } from "sequelize";

export interface CommunityAssocAttributes {
	name: string;
	color_code: string;
	resident_assocs: ResidentAssocAttributes[];
}

export interface ResidentAssocAttributes {
	name: string;
	color_code: string;
	community_assoc_id: number;
	community_assoc: CommunityAssocAttributes;
}

export interface ResidentAssocDueAttributes {
	id: number;
	description: string;
	amount: number;
	type: number;
	resident_assoc_id: number;
	user_resident_id: number;
	user_functionary_id: number;
	date: string;
	createdAt: string;
	updatedAt: string;
	user_resident: UserResidentAttributes;
}

export interface RoleAttributes {
	id: Identifier;
	name: string;
	slug: string;
}

export interface UserAttributes {
	id: number;
	firstname: string;
	lastname: string;
	email: string;
	phone: string;
	role_id: number;
	username: string;
	password: string;
	createdAt: string;
	updatedAt: string;
	user_functionary: UserFunctionaryAttributes;
}

export interface UserResidentAttributes {
	id: Identifier;
	user_id: number;
	resident_assoc_id: number;
	address: string;
	createdAt: string;
	updatedAt: string;
	user: UserAttributes;
	resident_assoc: ResidentAssocAttributes;
}

export interface UserFunctionaryAttributes {
	id: number;
	user_id: number;
	resident_assoc_id: number;
	resident_assoc: ResidentAssocAttributes;
}
