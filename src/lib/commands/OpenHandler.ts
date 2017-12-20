import { ServerlessNode, NodeKind } from "../ServerlessNode";
import * as _ from "lodash";
import * as path from "path";
import { existsSync } from "fs";
import { window, Uri, ExtensionContext } from "vscode";
import { Command } from "../CommandHandler";

export class OpenHandler implements Command {

	constructor(private context: ExtensionContext) {
	}

	invoke(node: ServerlessNode): Thenable<void> {
		if (node.kind !== NodeKind.FUNCTION) {
			return Promise.reject(new Error("Cannot open handler for non function"));
		}

		const handler = _.get(node.data, "handler", null);
		if (!handler) {
			return Promise.reject(new Error("Your function does not declare a valid handler"));
		}

		const handlerBase = /^(.*)\..*?$/.exec(handler);
		console.log(handlerBase);
		if (!handlerBase) {
			return Promise.reject(new Error("Your function handler is not formatted correctly"));
		}

		const root = node.documentRoot;
		// TODO: Support other handler types that are not supported directly with SLS.
		const handlerFile = path.join(root, handlerBase[1] + ".js");
		if (!existsSync(handlerFile)) {
			return Promise.reject(new Error("Could not load handler"));
		}

		return window.showTextDocument(Uri.file(handlerFile), {
			preview: true
		})
		.then(() => Promise.resolve());
	}
}
