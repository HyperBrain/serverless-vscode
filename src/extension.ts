import * as _ from "lodash";
import { commands, ExtensionContext, window } from "vscode";

import { CommandHandler } from "./lib/CommandHandler";
import { Deploy } from "./lib/commands/Deploy";
import { DeployFunction } from "./lib/commands/DeployFunction";
import { InvokeLocal } from "./lib/commands/InvokeLocal";
import { Logs } from "./lib/commands/Logs";
import { OpenHandler } from "./lib/commands/OpenHandler";
import { Package } from "./lib/commands/Package";
import { Resolve } from "./lib/commands/Resolve";
import { ServerlessOutlineProvider } from "./lib/serverlessOutline";

/**
 * Activation entry point for the extension
 * @param context VSCode context
 */
export function activate(context: ExtensionContext) {
	// tslint:disable-next-line:no-console
	console.log("Loading Serverless extension");

	const serverlessOutlineProvider = new ServerlessOutlineProvider(context);
	context.subscriptions.push(window.registerTreeDataProvider("serverlessOutline", serverlessOutlineProvider));

	CommandHandler.registerCommand(OpenHandler, "serverless.openHandler", context);
	CommandHandler.registerCommand(Resolve, "serverless.resolve", context);
	CommandHandler.registerCommand(Logs, "serverless.logs", context);
	CommandHandler.registerCommand(InvokeLocal, "serverless.invokeLocal", context);
	CommandHandler.registerCommand(DeployFunction, "serverless.deployFunction", context);
	CommandHandler.registerCommand(Package, "serverless.package", context);
	CommandHandler.registerCommand(Deploy, "serverless.deploy", context);

	return null;
}

export function deactivate() {
	return;
}
