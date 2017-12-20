import { window, Uri, ExtensionContext } from "vscode";
import { Serverless } from "../Serverless";
import { ServerlessNode, NodeKind } from "../ServerlessNode";
import * as _ from "lodash";
import * as path from "path";
import { Command } from "../CommandHandler";

/**
 * Wrapper for Serverless invoke local.
 */

export class InvokeLocal implements Command {

	constructor(private context: ExtensionContext) {
	}

	invoke(node: ServerlessNode): Thenable<void> {
		console.log(`Invoke local`);

		if (node.kind !== NodeKind.FUNCTION) {
			return Promise.reject(new Error("Target must be a function"));
		}

		return window.showInputBox({
			prompt: "Stage (defaults to dev)",
			placeHolder: "dev"
		})
		.then(stage => stage || "dev")
		.then(stage => {
			return window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				openLabel: "Select event",
				filters: {
					'Event JSON': [ 'json' ]
				}
			})
			.then((files: Uri[] | undefined) => {
				if (!files || _.isEmpty(files)) {
					return Promise.resolve();
				}

				const filePath = path.relative(node.documentRoot, files[0].fsPath);
				const options = {
					stage,
					function: node.name,
					path: filePath,
					cwd: node.documentRoot
				};
				return Serverless.invoke(`invoke local`, options);
			});
		});
	}
}
