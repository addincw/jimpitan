import { Request, Response } from "express";
import { ResidentAssocAttributes } from "../../../database/models/models";

import db from "../../../database/models/index.cjs";
const { CommunityAssoc } = db;

export async function getResidentAssocsById(
	req: Request,
	res: Response<ResidentAssocAttributes[]>
) {
	const { id } = req.params;

	const communityAssoc = await CommunityAssoc.findByPk(id, {
		include: ["resident_assocs"],
	});

	const result = communityAssoc.toJSON();

	return res.send(result.resident_assocs);
}
