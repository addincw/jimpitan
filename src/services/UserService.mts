import { UserAttributes } from "../../database/models/models";
import db from "../../database/models/index.cjs";

const { ResidentAssoc, UserFunctionary } = db;

export const ROLE_ADMINISTRATOR = 1;
export const ROLE_FUNCTIONARY = 2;
export const ROLE_RESIDENT = 3;

export async function getUserFunctionaryLoggedIn(userLoggedIn: Record<string, any>) {
	const userFunctionary = await UserFunctionary.findOne({
		where: { user_id: (userLoggedIn as UserAttributes).id },
		include: [
			{
				model: ResidentAssoc,
				as: "resident_assoc",
				include: ["community_assoc"],
			},
		],
	});
	return userFunctionary.toJSON();
}
