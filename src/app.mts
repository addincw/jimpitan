import "dotenv/config";
import { fileURLToPath } from "url";
import express, { Response } from "express";
import path from "path";

import routeAdmins from "./routes/route-admin.mjs";
import routeFronts from "./routes/route-front.mjs";
import viewEngine, { viewDir, viewExtFile } from "./config/view.mjs";

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

app.use(express.static("public"));

// define routes
app.use("/", routeFronts);
app.use("/admin", routeAdmins);

app.listen(process.env.APP_PORT, () => {
	console.log(
		`${process.env.APP_NAME} app is running on ${process.env.APP_URL}:${process.env.APP_PORT}`
	);
});
