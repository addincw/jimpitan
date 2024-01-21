import { Response, Router } from "express";
import passport from "passport";

import authLocalStrategy, {
	deserializeUser,
	serializeUser,
} from "../middlewares/authLocalStrategy.mjs";
import adminFilterAccess from "../middlewares/adminFilterAccess.mjs";

import * as AuthController from "../controllers/AuthController.mjs";
import * as CommunityAssocController from "../controllers/admin/residential/CommunityAssocController.mjs";
import * as ResidentAssocController from "../controllers/admin/residential/ResidentAssocController.mjs";
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

router.get("/residential/community-assocs", CommunityAssocController.index);
router.get(
	"/residential/community-assocs/create",
	CommunityAssocController.create
);
router.post("/residential/community-assocs", CommunityAssocController.store);
router.get("/residential/community-assocs/:id", CommunityAssocController.edit);
router.put(
	"/residential/community-assocs/:id",
	CommunityAssocController.update
);
router.delete(
	"/residential/community-assocs/:id",
	CommunityAssocController.destroy
);

router.use((_, res: Response, next) => {
	res.locals.baseRoute = ResidentAssocController.baseRoute;
	res.locals.baseRouteView = ResidentAssocController.baseRouteView;

	next();
});
router.get("/residential/resident-assocs", ResidentAssocController.index);
router.get(
	"/residential/resident-assocs/create",
	ResidentAssocController.create
);
router.post("/residential/resident-assocs", ResidentAssocController.store);
router.get("/residential/resident-assocs/:id", ResidentAssocController.edit);
router.put("/residential/resident-assocs/:id", ResidentAssocController.update);
router.delete(
	"/residential/resident-assocs/:id",
	ResidentAssocController.destroy
);

router.get("/master/roles", RoleController.index);

export default router;
