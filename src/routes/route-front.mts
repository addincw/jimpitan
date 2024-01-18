import { Response, Router } from "express";
import * as HomeController from "../controllers/HomeController.mjs";

const router = Router();

// define local variable for this group routes
router.use((_, res: Response, next) => {
	res.locals.layout = "front";
	next();
});

router.get("/", HomeController.index);

export default router;
