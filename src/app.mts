import "dotenv/config";
import { fileURLToPath } from "url";
import express, { Response } from "express";
import flash from "connect-flash";
import path from "path";
import session from "express-session";

import viewEngine, { viewDir, viewExtFile } from "./config/view.mjs";

import flashParser from "./middlewares/flashParser.mjs";
import routeAdmins from "./routes/route-admin.mjs";
import routeFronts from "./routes/route-front.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// configure template engine
app.engine(viewExtFile, viewEngine);
app.set("view engine", viewExtFile);
app.set("views", path.join(__dirname + viewDir));

// define global variables
app.use((_, res: Response, next) => {
	res.locals.appName = process.env.APP_NAME;
	next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(session({ secret: "candi", resave: false, saveUninitialized: false }));
app.use(flash());
app.use(flashParser());

// define routes
app.use("/", routeFronts);
app.use("/admin", routeAdmins);

app.listen(process.env.APP_PORT, () => {
	console.log(
		`${process.env.APP_NAME} app is running on ${process.env.APP_URL}:${process.env.APP_PORT}`
	);
});
