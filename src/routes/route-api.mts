import { Request, Response, Router } from "express";

import * as CommunityAssocController from "../controllers/api/CommunityAssocController.mjs";
import * as ResidentAssocController from "../controllers/api/ResidentAssocController.mjs";

const router = Router();

// define local variable for this group routes
router.use((req: Request, res: Response, next) => {
	res.locals.layout = "front";
	res.locals.user = req.user;
	next();
});

router.get(
	"/community-assocs/:id/resident-assocs",
	CommunityAssocController.getResidentAssocsById
);

router.get(
	"/community-assocs/:id/resident-assocs/:residentAssocId",
	ResidentAssocController.findOne
);

export default router;
