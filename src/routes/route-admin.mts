import { Request, Response, Router } from "express";
import passport from "passport";

import authLocalStrategy, {
	deserializeUser,
	serializeUser,
} from "../middlewares/authLocalStrategy.mjs";

import * as AuthController from "../controllers/AuthController.mjs";
import * as DashboardController from "../controllers/admin/DashboardController.mjs";
import * as RoleController from "../controllers/admin/master/RoleController.mjs";

const noAuthRoutes = ["/login"];

passport.use(authLocalStrategy());
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

const router = Router();

// define local variable for this group routes
router.use((req: Request, res: Response, next) => {
	if (noAuthRoutes.includes(req.url)) {
		return next();
	}

	res.locals.layout = "admin";
	res.locals.breadcrumbs = [
		{
			name: "Home",
			href: req.url != "/" && "/admin",
			active: req.url == "/",
		},
	];
	next();
});

router.get("/login", AuthController.login);
router.post(
	"/login",
	passport.authenticate("local", {
		failureFlash: true,
		failureRedirect: "/admin/login",
	}),
	AuthController.authenticate
);

router.get("/", DashboardController.index);

router.get("/master/roles", RoleController.index);

export default router;
