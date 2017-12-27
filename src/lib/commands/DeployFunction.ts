import * as _ from "lodash";
import * as path from "path";
import { ExtensionContext, Uri, window } from "vscode";
import { CommandBase } from "../CommandBase";
import { Serverless } from "../Serverless";
import { NodeKind, ServerlessNode } from "../ServerlessNode";

/**
 * Wrapper for Serverless deploy function.
 */

export class DeployFunction extends CommandBase {

	constructor(private context: ExtensionContext) {
		super();
	}

	public invoke(node: ServerlessNode): Thenable<void> {
		if (node.kind !== NodeKind.FUNCTION) {
			return Promise.reject(new Error("Target must be a function"));
		}

		return CommandBase.askForStage()
		.then(stage => {
			const options = {
				cwd: node.documentRoot,
				function: node.name,
				stage,
			};
			return Serverless.invoke("deploy function", options);
		});
	}

}
