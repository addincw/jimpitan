import { Router } from "express";

import * as CommunityAssocController from "../controllers/api/CommunityAssocController.mjs";
import * as ResidentAssocController from "../controllers/api/ResidentAssocController.mjs";
import * as ResidentAssocDueController from "../controllers/api/ResidentAssocDueController.mjs";

const router = Router();

router.get("/community-assocs/:id/resident-assocs", CommunityAssocController.getResidentAssocsById);

router.get("/community-assocs/:id/resident-assocs/:residentAssocId", ResidentAssocController.findOne);

router.get("/dues/income/monthly", ResidentAssocDueController.getReportMonthly);
router.get("/dues/income/peruser", ResidentAssocDueController.getReportPerUser);

export default router;
