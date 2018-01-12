import * as _ from "lodash";
import { window, workspace } from "vscode";
import { ServerlessNode } from "./ServerlessNode";

/**
 * Base class for VSCode Serverless commands.
 */
export abstract class CommandBase {

	protected static askForStageAndRegion(): Thenable<string[]> {
		const configuration = workspace.getConfiguration();
		const defaultStage: string = configuration.get("serverless.aws.defaultStage") || "dev";
		const defaultRegion: string = configuration.get("serverless.aws.defaultRegion") || "us-east-1";
		const askForRegion: boolean = configuration.get("serverless.aws.askForRegion") || false;

		return window.showInputBox({
			placeHolder: defaultStage,
			prompt: `Stage (defaults to ${defaultStage})`,
		})
		.then(stage => {
			if (_.isNil(stage)) {
				throw new Error("Command cancelled");
			}
			if (askForRegion) {
				return window.showInputBox({
					placeHolder: defaultRegion,
					prompt: `Region (defaults to ${defaultRegion})`,
				})
				.then(region => {
					return [ stage || defaultStage, region || defaultRegion ];
				});
			}
			return [ stage || defaultStage, defaultRegion ];
		});
	}

	constructor(public readonly isExclusive: boolean = false) {
	}

	public abstract invoke(node: ServerlessNode): Thenable<void>;

}
