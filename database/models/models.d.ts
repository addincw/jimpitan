export interface CommunityAssocAttributes {
	name: string;
	color_code: string;
}

export interface ResidentAssocAttributes {
	name: string;
	color_code: string;
	community_assoc_id: number;
}

export interface ResidentAssocDueAttributes {
	description: string;
	amount: number;
	type: number;
	resident_assoc_id: number;
	user_resident_id: number;
	user_functionary_id: number;
	date: string;
}

export interface RoleAttributes {
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
}

export interface UserResidentAttributes {
	user_id: number;
	resident_assoc_id: number;
	address: string;
}

export interface UserFunctionaryAttributes {
	user_id: number;
	resident_assoc_id: number;
}
