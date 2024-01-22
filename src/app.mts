import "dotenv/config";
import { fileURLToPath } from "url";
import express, { Request, Response } from "express";
import flash from "connect-flash";
import passport from "passport";
import path from "path";
import session from "express-session";

import viewEngine, { viewDir, viewExtFile } from "./config/view.mjs";

import flashParser from "./middlewares/flashParser.mjs";
import methodOverride from "./middlewares/methodOverride.mjs";
import routeAdmins from "./routes/route-admin.mjs";
import routeAPIs from "./routes/route-api.mjs";
import routeFronts from "./routes/route-front.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// configure template engine
app.engine(viewExtFile, viewEngine);
app.set("view engine", viewExtFile);
app.set("views", path.join(__dirname + viewDir));

app.use(express.urlencoded({ extended: false }));
app.use(methodOverride());
app.use(express.static("public"));
app.use(session({ secret: "candi", resave: false, saveUninitialized: false }));
app.use(flash());
app.use(flashParser());
app.use(passport.authenticate("session"));

// define global variables
app.use((req: Request, res: Response, next) => {
	if (["POST", "PUT"].includes(req.method) && Object.keys(req.body).length) {
		req.session.old = JSON.stringify(req.body);
	} else if (req.session.old) {
		res.locals.old = JSON.parse(req.session.old);
		delete req.session.old;
	}

	res.locals.appName = process.env.APP_NAME;
	next();
});

// define routes
app.use("/", routeFronts);
app.use("/api", routeAPIs);
app.use("/admin", routeAdmins);

app.listen(process.env.APP_PORT, () => {
	console.log(
		`${process.env.APP_NAME} app is running on ${process.env.APP_URL}:${process.env.APP_PORT}`
	);
});
