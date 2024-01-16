import * as Handlebars from "handlebars";

interface LayoutsOptions {
	fn?: (context: Object) => string;
	hash?: Object;
}

interface LayoutHelpers {
	extend: (
		name: string,
		customContext: Object | null,
		options: LayoutsOptions
	) => string;
	embed: () => string;
	block: (
		name: string,
		options: { fn?: (context: Object) => string; data?: Object }
	) => string;
	content: (
		name: string,
		options: {
			fn?: (context: Object) => string;
			data?: Object;
			hash?: { mode?: string };
		}
	) => void;
}

declare module "handlebars-layouts" {
	export default function layouts(hbs: typeof Handlebars): LayoutHelpers;
}
