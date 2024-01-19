import { Request } from "express";
import { default as methodOverrideLibrary } from "method-override";

export default function methodOverride(overrideField = "_method") {
	return methodOverrideLibrary((req: Request, _) => {
		if (req.body && typeof req.body === "object" && overrideField in req.body) {
			// look in urlencoded POST bodies and delete it
			var method = req.body._method;
			delete req.body._method;

			return method;
		}
	});
}
