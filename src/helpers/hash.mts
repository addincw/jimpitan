import bcrypt from "bcrypt";

export function make(text: string) {
	const saltRounds = 10;
	const salt = bcrypt.genSaltSync(saltRounds);

	return bcrypt.hashSync(text, salt);
}

export function check(text: string, textHashed: string) {
	return bcrypt.compareSync(text, textHashed);
}
