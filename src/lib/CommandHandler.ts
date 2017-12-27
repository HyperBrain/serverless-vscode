import * as _ from "lodash";
import { commands, Disposable, ExtensionContext, window } from "vscode";
import { ICommand } from "./CommandBase";
import { ServerlessNode } from "./ServerlessNode";

/**
 * Wrap commands that process ServerlessNode objects and
 * provide a common UX.
 */

export class CommandHandler<T extends ICommand> {

	public static registerCommand<T extends ICommand>(
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
		return this.handler.invoke(node)
		.then(_.noop, err => {
			return window.showErrorMessage(`Serverless: ${err.message}`);
		});
	}

}
