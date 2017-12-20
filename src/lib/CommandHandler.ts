import { ExtensionContext, Disposable, commands, window } from "vscode";
import { ServerlessNode } from "./ServerlessNode";
import * as _ from "lodash";

export interface Command {
	invoke(node: ServerlessNode): Thenable<void>;
}

/**
 * Wrap commands that process ServerlessNode objects and
 * provide a common UX.
 */

export class CommandHandler<T extends Command> {

	private handler: T;

	private constructor(private context: ExtensionContext, handlerClass: { new (context: ExtensionContext): T; }) {
		this.handler = new handlerClass(context);
		this.invoke = this.invoke.bind(this);
	}

	invoke(node: ServerlessNode): Thenable<void> {
		return this.handler.invoke(node)
		.then(_.noop, err => {
			return window.showErrorMessage(`Serverless: ${err.message}`);
		});
	}

	static registerCommand<T extends Command>(commandClass: { new (context: ExtensionContext): T; }, name: string, context: ExtensionContext) {
		const handler = new CommandHandler(context, commandClass);
		context.subscriptions.push(commands.registerCommand(name, handler.invoke));
	}
}
