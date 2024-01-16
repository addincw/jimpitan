import handlebars from "handlebars";
import handlebarsLayouts from "handlebars-layouts";

import { engine } from "express-handlebars";

export const viewExtFile = ".hbs";
export const viewDir = "/views";

export const viewEngine = engine({
	defaultLayout: false,
	extname: viewExtFile,
	helpers: {
		...handlebarsLayouts(handlebars),
		stringify(value: any) {
			return JSON.stringify(value);
		},
	},
});

export default viewEngine;
