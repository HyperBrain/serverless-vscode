import * as _ from "lodash";
import * as path from "path";
import { ExtensionContext, Position, TextDocument, TextEditor, Uri, window, workspace } from "vscode";
import { CommandBase } from "../CommandBase";
import { Serverless } from "../Serverless";
import { NodeKind, ServerlessNode } from "../ServerlessNode";

/**
 * Wrapper for Serverless logs.
 */

export class Resolve extends CommandBase {

	constructor(private context: ExtensionContext) {
		super();
	}

	public invoke(node: ServerlessNode): Thenable<void> {
		if (node.kind !== NodeKind.CONTAINER) {
			return Promise.reject(new Error("Target must be a container"));
		}

		return CommandBase.askForStageAndRegion()
		.then(result => {
			const options = {
				cwd: node.documentRoot,
				region: result[1],
				stage: result[0],
			};
			return Serverless.invokeWithResult("print", options);
		})
		.then((resolvedYaml: string) => {
			return workspace.openTextDocument(Uri.parse("untitled:" + path.join(node.documentRoot, "resolved.yml")))
			.then((doc: TextDocument) => window.showTextDocument(doc))
			.then((editor: TextEditor) => {
				return editor.edit(edit => edit.insert(new Position(0, 0), resolvedYaml));
			});
		})
		.then(_.noop);
	}
}
