import { window, Uri, ExtensionContext } from "vscode";
import { Serverless } from "../Serverless";
import { ServerlessNode, NodeKind } from "../ServerlessNode";
import * as _ from "lodash";
import * as path from "path";
import { Command } from "../CommandHandler";

/**
 * Wrapper for Serverless logs.
 */

export class Logs implements Command {

	constructor(private context: ExtensionContext) {
	}

	invoke(node: ServerlessNode): Thenable<void> {
		console.log(`Logs`);

		if (node.kind !== NodeKind.FUNCTION) {
			return Promise.reject(new Error("Target must be a function"));
		}

		return window.showInputBox({
			prompt: "Stage (defaults to dev)",
			placeHolder: "dev"
		})
		.then(stage => stage || "dev")
		.then(stage => {
			const options = {
				stage,
				function: node.name,
				cwd: node.documentRoot
			};
			return Serverless.invoke(`logs`, options);
		});
	}

}
