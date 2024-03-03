import { Response, Router } from "express";
import passport from "passport";

import authLocalStrategy, { deserializeUser, serializeUser } from "../middlewares/authLocalStrategy.mjs";
import adminFilterAccess from "../middlewares/adminFilterAccess.mjs";

import * as AuthController from "../controllers/AuthController.mjs";
import * as CommunityAssocController from "../controllers/admin/residential/CommunityAssocController.mjs";
import * as DashboardController from "../controllers/admin/DashboardController.mjs";
import * as IncomeController from "../controllers/admin/dues/IncomeController.mjs";
import * as ExpenseController from "../controllers/admin/dues/ExpenseController.mjs";
import * as ResidentAssocController from "../controllers/admin/residential/ResidentAssocController.mjs";
import * as ResidentController from "../controllers/admin/residential/ResidentController.mjs";
import * as RoleController from "../controllers/admin/master/RoleController.mjs";
import * as UserController from "../controllers/admin/master/UserController.mjs";

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
router.get("/residential/community-assocs/create", CommunityAssocController.create);
router.post("/residential/community-assocs", CommunityAssocController.store);
router.get("/residential/community-assocs/:id", CommunityAssocController.edit);
router.put("/residential/community-assocs/:id", CommunityAssocController.update);
router.delete("/residential/community-assocs/:id", CommunityAssocController.destroy);

router.use((_, res: Response, next) => {
	res.locals.baseRoute = ResidentAssocController.baseRoute;
	res.locals.baseRouteView = ResidentAssocController.baseRouteView;
	next();
});
router.get("/residential/resident-assocs", ResidentAssocController.index);
router.get("/residential/resident-assocs/create", ResidentAssocController.create);
router.post("/residential/resident-assocs", ResidentAssocController.store);
router.get("/residential/resident-assocs/:id", ResidentAssocController.edit);
router.put("/residential/resident-assocs/:id", ResidentAssocController.update);
router.delete("/residential/resident-assocs/:id", ResidentAssocController.destroy);

router.use((_, res: Response, next) => {
	res.locals.baseRoute = ResidentController.baseRoute;
	res.locals.baseRouteView = ResidentController.baseRouteView;
	next();
});
router.get("/residential/residents", ResidentController.index);
router.get("/residential/residents/create", ResidentController.create);
router.post("/residential/residents", ResidentController.store);
router.get("/residential/residents/:id", ResidentController.edit);
router.put("/residential/residents/:id", ResidentController.update);
router.delete("/residential/residents/:id", ResidentController.destroy);

router.get("/master/roles", RoleController.index);

router.use((_, res: Response, next) => {
	res.locals.baseRoute = UserController.baseRoute;
	res.locals.baseRouteView = UserController.baseRouteView;
	next();
});
router.get("/master/users", UserController.index);
router.get("/master/users/create", UserController.create);
router.post("/master/users", UserController.store);
router.get("/master/users/:id", UserController.edit);
router.put("/master/users/:id", UserController.update);
router.delete("/master/users/:id", UserController.destroy);

router.use((_, res: Response, next) => {
	res.locals.baseRoute = IncomeController.baseRoute;
	res.locals.baseRouteView = IncomeController.baseRouteView;
	next();
});
router.get("/dues/income", IncomeController.index);
router.put("/dues/income/:id", IncomeController.store);
router.delete("/dues/income/:id", IncomeController.destroy);

router.use((_, res: Response, next) => {
	res.locals.baseRoute = ExpenseController.baseRoute;
	res.locals.baseRouteView = ExpenseController.baseRouteView;
	next();
});
router.get("/dues/expense", ExpenseController.index);
router.get("/dues/expense/create", ExpenseController.create);
router.post("/dues/expense", ExpenseController.store);
router.get("/dues/expense/:id", ExpenseController.edit);
router.put("/dues/expense/:id", ExpenseController.update);
router.delete("/dues/expense/:id", ExpenseController.destroy);

export default router;
