import { Router } from "express";
import passport from "passport";

import authLocalStrategy, {
	deserializeUser,
	serializeUser,
} from "../middlewares/authLocalStrategy.mjs";
import adminFilterAccess from "../middlewares/adminFilterAccess.mjs";

import * as AuthController from "../controllers/AuthController.mjs";
import * as DashboardController from "../controllers/admin/DashboardController.mjs";
import * as RoleController from "../controllers/admin/master/RoleController.mjs";

passport.use(authLocalStrategy());
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

const router = Router();

router.use(adminFilterAccess());

router.get("/login", AuthController.login);
router.post(
	"/login",
	passport.authenticate("local", {
		failureFlash: true,
		failureRedirect: "/admin/login",
	}),
	AuthController.authenticate
);

router.put("/logout", AuthController.logout);

router.get("/", DashboardController.index);

router.get("/master/roles", RoleController.index);

export default router;
