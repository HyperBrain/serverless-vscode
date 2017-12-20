import { ExtensionContext, window, commands } from 'vscode';
import * as _ from 'lodash';

import { ServerlessOutlineProvider } from "./lib/serverlessOutline";
import { InvokeLocal } from "./lib/commands/InvokeLocal";
import { OpenHandler } from './lib/commands/OpenHandler';
import { Logs } from './lib/commands/Logs';
import { CommandHandler } from './lib/CommandHandler';
import { Resolve } from './lib/commands/Resolve';

/**
 * Activation entry point for the extension
 * @param context VSCode context
 */
export function activate(context: ExtensionContext) {
	console.log("Loading Serverless extension");

	const serverlessOutlineProvider = new ServerlessOutlineProvider(context);
	context.subscriptions.push(window.registerTreeDataProvider("serverlessOutline", serverlessOutlineProvider));

	CommandHandler.registerCommand(OpenHandler, "serverless.openHandler", context);
	CommandHandler.registerCommand(Resolve, "serverless.resolve", context);
	CommandHandler.registerCommand(Logs, "serverless.logs", context);
	CommandHandler.registerCommand(InvokeLocal, "serverless.invokeLocal", context);

	return null;
}

export function deactivate() {
	return;
}
