import "dotenv/config";
import express, { Response } from "express";
import handlebars from "handlebars";
import handlebarsLayouts from "handlebars-layouts";
import path from "path";

import { engine as exphbs } from "express-handlebars";
import { fileURLToPath } from "url";

import frontRoutes from "./routes/front.mjs";
import adminRoutes from "./routes/admin.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// define template engine
app.engine(
	".hbs",
	exphbs({
		defaultLayout: false,
		extname: ".hbs",
		helpers: {
			...handlebarsLayouts(handlebars),
			stringify(value: any) {
				return JSON.stringify(value);
			},
		},
	})
);
app.set("view engine", ".hbs");
app.set("views", path.join(__dirname + "/views"));

// define global variables
app.use((_, res: Response, next) => {
	res.locals.appName = process.env.APP_NAME;
	next();
});

app.use(express.static("public"));

// define routes
app.use("/", frontRoutes);
app.use("/admin", adminRoutes);

app.listen(process.env.NODE_PORT, () => {
	console.log(
		`${process.env.APP_NAME} app listening on port ${process.env.NODE_PORT}`
	);
});
