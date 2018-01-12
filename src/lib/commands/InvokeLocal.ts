import * as _ from "lodash";
import * as path from "path";
import { ExtensionContext, Uri, window } from "vscode";
import { CommandBase } from "../CommandBase";
import { Serverless } from "../Serverless";
import { NodeKind, ServerlessNode } from "../ServerlessNode";

/**
 * Wrapper for Serverless invoke local.
 */

export class InvokeLocal extends CommandBase {

	constructor(private context: ExtensionContext) {
		super(true);
	}

	public invoke(node: ServerlessNode): Thenable<void> {
		if (node.kind !== NodeKind.FUNCTION) {
			return Promise.reject(new Error("Target must be a function"));
		}

		return CommandBase.askForStageAndRegion()
		.then(result => {
			return window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				filters: {
					"Event JSON": [ "json" ],
				},
				openLabel: "Select event",
			})
			.then((files: Uri[] | undefined) => {
				if (!files || _.isEmpty(files)) {
					return Promise.resolve();
				}

				const filePath = path.relative(node.documentRoot, files[0].fsPath);
				const options = {
					cwd: node.documentRoot,
					function: node.name,
					path: filePath,
					region: result[1],
					stage: result[0],
				};
				return Serverless.invoke("invoke local", options);
			});
		});
	}
}
