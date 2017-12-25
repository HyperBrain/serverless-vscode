import { window, Uri, ExtensionContext, workspace, TextDocument, Position, TextEditor } from "vscode";
import { Serverless } from "../Serverless";
import { ServerlessNode, NodeKind } from "../ServerlessNode";
import * as _ from "lodash";
import * as path from "path";
import { Command, CommandBase } from "../CommandHandler";

/**
 * Wrapper for Serverless logs.
 */

export class Resolve extends CommandBase {

	constructor(private context: ExtensionContext) {
		super();
	}

	invoke(node: ServerlessNode): Thenable<void> {
		if (node.kind !== NodeKind.CONTAINER) {
			return Promise.reject(new Error("Target must be a function"));
		}

		return CommandBase.askForStage()
		.then(stage => {
			const options = {
				stage,
				cwd: node.documentRoot
			};
			return Serverless.invokeWithResult("print", options);
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
