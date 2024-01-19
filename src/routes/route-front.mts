import { Request, Response, Router } from "express";
import * as HomeController from "../controllers/HomeController.mjs";

const router = Router();

// define local variable for this group routes
router.use((req: Request, res: Response, next) => {
	res.locals.layout = "front";
	res.locals.user = req.user;
	next();
});

router.get("/", HomeController.index);

export default router;
