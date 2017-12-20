import { window, Uri, ExtensionContext, workspace, TextDocument, Position, TextEditor } from "vscode";
import { Serverless } from "../Serverless";
import { ServerlessNode, NodeKind } from "../ServerlessNode";
import * as _ from "lodash";
import * as path from "path";
import { Command } from "../CommandHandler";

/**
 * Wrapper for Serverless logs.
 */

export class Resolve implements Command {

	constructor(private context: ExtensionContext) {
	}

	invoke(node: ServerlessNode): Thenable<void> {
		console.log(`Resolve`);

		if (node.kind !== NodeKind.CONTAINER) {
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
				cwd: node.documentRoot
			};
			return Serverless.invokeWithResult(`print`, options);
		})
		.then((resolvedYaml: string) => {
			return workspace.openTextDocument(Uri.parse("untitled:" + path.join(node.documentRoot, "resolved.yml")))
			.then((doc: TextDocument) => window.showTextDocument(doc))
			.then((editor: TextEditor) => {
				return editor.edit(edit => edit.insert(new Position(0, 0), resolvedYaml))
			})
		})
		.then(_.noop);
	}
}
