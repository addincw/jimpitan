import { Request, Response } from "express";

import { ResidentAssocAttributes } from "../../../database/models/models";

import db from "../../../database/models/index.cjs";
const { ResidentAssoc } = db;

export async function findOne(
	req: Request,
	res: Response<ResidentAssocAttributes | {}>
) {
	const { residentAssocId } = req.params;

	const residentAssoc = await ResidentAssoc.findByPk(residentAssocId);
	if (residentAssoc) {
		const result = residentAssoc.toJSON();
		return res.send(result);
	}

	return res.send({});
}
