import { window } from "vscode";
import { ServerlessNode } from "./ServerlessNode";

/**
 * Interface for all commands.
 */
export interface ICommand {
	invoke(node: ServerlessNode): Thenable<void>;
}

/**
 * Base class for VSCode Serverless commands.
 */
export class CommandBase implements ICommand {

	protected static askForStage(): Thenable<string> {
		return window.showInputBox({
			placeHolder: "dev",
			prompt: "Stage (defaults to dev)",
		})
		.then(stage => stage || "dev");
	}

	public invoke(node: ServerlessNode): Thenable<void> {
		throw new Error("Must be overridden.");
	}

}
