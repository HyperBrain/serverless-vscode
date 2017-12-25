import { window, Uri, ExtensionContext } from "vscode";
import { Serverless } from "../Serverless";
import { ServerlessNode, NodeKind } from "../ServerlessNode";
import * as _ from "lodash";
import * as path from "path";
import { Command, CommandBase } from "../CommandHandler";

/**
 * Wrapper for Serverless deploy function.
 */

export class DeployFunction extends CommandBase {

	constructor(private context: ExtensionContext) {
		super();
	}

	invoke(node: ServerlessNode): Thenable<void> {
		if (node.kind !== NodeKind.FUNCTION) {
			return Promise.reject(new Error("Target must be a function"));
		}

		return CommandBase.askForStage()
		.then(stage => {
			const options = {
				stage,
				function: node.name,
				cwd: node.documentRoot
			};
			return Serverless.invoke("deploy function", options);
		});
	}

}
