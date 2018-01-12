import * as _ from "lodash";
import { commands, Disposable, ExtensionContext, window } from "vscode";
import { CommandBase } from "./CommandBase";
import { ServerlessNode } from "./ServerlessNode";

/**
 * Wrap commands that process ServerlessNode objects and
 * provide a common UX.
 */

export class CommandHandler<T extends CommandBase> {

	public static isCommandRunning: boolean = false;

	public static registerCommand<T extends CommandBase>(
		commandClass: { new (context: ExtensionContext): T; },
		name: string,
		context: ExtensionContext,
	) {
		const handler = new CommandHandler(context, commandClass);
		context.subscriptions.push(commands.registerCommand(name, handler.invoke));
	}

	private handler: T;

	private constructor(private context: ExtensionContext, handlerClass: { new (context: ExtensionContext): T; }) {
		this.handler = new handlerClass(context);
		this.invoke = this.invoke.bind(this);
	}

	public invoke(node: ServerlessNode): Thenable<void> {
		const isExclusive = this.handler.isExclusive;
		if (isExclusive) {
			if (CommandHandler.isCommandRunning) {
				return window.showErrorMessage("Serverless: Another command is still in progress.")
				.then(_.noop);
			}
			CommandHandler.isCommandRunning = true;
		}

		return this.handler.invoke(node)
		.then(() => {
			if (isExclusive) {
				CommandHandler.isCommandRunning = false;
			}
		}, err => {
			if (isExclusive) {
				CommandHandler.isCommandRunning = false;
			}
			return window.showErrorMessage(`Serverless: ${err.message}`);
		});
	}

}
