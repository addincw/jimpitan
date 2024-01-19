import handlebars from "handlebars";
import handlebarsLayouts from "handlebars-layouts";

import { engine } from "express-handlebars";

export const viewExtFile = ".hbs";
export const viewDir = "/views";

interface Breadcrumb {
	name: string;
	href?: string;
	active: boolean;
}

export const viewEngine = engine({
	defaultLayout: false,
	extname: viewExtFile,
	helpers: {
		...handlebarsLayouts(handlebars),
		breadcrumbs(breadcrumbs: Array<Breadcrumb>) {
			const mapped = breadcrumbs.map((breadcrumb: Breadcrumb) => {
				const cssClasses = ["breadcrumb-item"];

				if (breadcrumb.active) cssClasses.push("active");

				if (breadcrumb.href) {
					return `
						<li class="${cssClasses.join(" ")}">
							<a href="${breadcrumb.href}">${breadcrumb.name}</a>
						</li>
					`;
				}
				return `<li class="${cssClasses.join(" ")}">${breadcrumb.name}</li>`;
			});

			return `<ol class="breadcrumb float-sm-right">${mapped.join("")}</ol>`;
		},
		eq(value1: any, value2: any) {
			return value1 === value2;
		},
		method(method: string) {
			return `<input type="hidden" name="_method" value="${method.toUpperCase()}">`;
		},
		stringify(value: any) {
			return JSON.stringify(value);
		},
	},
});

export default viewEngine;
