import { Response, Router } from "express";
import * as AuthController from "../controllers/AuthController.js";

const router = Router();

// define local variable for this group routes
router.use((_, res: Response, next) => {
	res.locals.layout = "admin";
	next();
});

router.get("/login", AuthController.login);

export default router;
