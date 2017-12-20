import { Terminal, window, TerminalOptions, workspace, OutputChannel } from "vscode";
import * as _ from "lodash";
import * as path from "path";
import { spawn } from "child_process";

export type ServerlessInvokeOptions = {
	stage?: string,
	cwd?: string
}

const ProcessingOptions = [
	"cwd"
];

export class Serverless {
	cwd: string;
	channel: OutputChannel;

	private constructor(cwd: string) {
		this.cwd = cwd;
	}

	private invokeCommandWithResult(command: string, options: string[]): Thenable<string> {
		this.channel = window.createOutputChannel("Serverless");
		this.channel.show();

		const serverlessCommand = `Running "serverless ${command} ${_.join(options, " ")}"`;
		this.channel.appendLine(serverlessCommand);

		return new Promise((resolve, reject) => {
			let result = "";
			const sls = spawn("node", _.concat(
				[ "node_modules/serverless/bin/serverless" ],
				_.split(command, " "),
				options
			), {
				cwd: this.cwd
			});

			sls.on("error", err => {
				reject(err);
			});

			sls.stdout.on("data", data => {
				result += data.toString();
			});

			sls.stderr.on('data', data => {
				this.channel.append(data.toString());
			});

			sls.on("exit", code => {
				if (code !== 0) {
					this.channel.append(result);
					reject(new Error(`Command exited with ${code}`));
				}
				resolve(result);
			});
		});
	}

	private invokeCommand(command: string, options: string[]): Thenable<void> {
		this.channel = window.createOutputChannel(command);
		this.channel.show();

		const serverlessCommand = `Running "serverless ${command} ${_.join(options, " ")}"`;
		this.channel.appendLine(serverlessCommand);

		return new Promise((resolve, reject) => {
			const sls = spawn("node", _.concat(
				[ "node_modules/serverless/bin/serverless" ],
				_.split(command, " "),
				options
			), {
				cwd: this.cwd
			});

			sls.on("error", err => {
				reject(err);
			});

			sls.stdout.on("data", data => {
				this.channel.append(data.toString());
			});

			sls.stderr.on('data', data => {
				this.channel.append(data.toString());
			});

			sls.on("exit", code => {
				resolve();
			});
		});
	}

	private static formatOptions(options?: ServerlessInvokeOptions): string[] {
		const _options = _.defaults({}, _.omitBy(options, (value, key) => _.includes(ProcessingOptions, key)), {
			stage: "dev"
		});
		const commandOptions = _.map(_options, (value: any, key: string) => {
			if (value === false) {
				return `--${key}`;
			}
			return `--${key}=${value}`;
		});

		return commandOptions;
	}

	static invoke(command: string, options?: ServerlessInvokeOptions): Thenable<void> {
		const commandOptions = Serverless.formatOptions(options);
		const cwd: string = _.get(options, "cwd") || __dirname;

		const serverless = new Serverless(cwd);
		return serverless.invokeCommand(command, commandOptions);
	}

	static invokeWithResult(command: string, options?: ServerlessInvokeOptions): Thenable<string> {
		const commandOptions = Serverless.formatOptions(options);
		const cwd: string = _.get(options, "cwd") || __dirname;

		const serverless = new Serverless(cwd);
		return serverless.invokeCommandWithResult(command, commandOptions);
	}
}
