import * as chai from "chai";
import * as _ from "lodash";
import * as sinon from "sinon";
import * as sinon_chai from "sinon-chai";
import { commands, ExtensionContext, Memento, window } from "vscode";
import { CommandBase } from "../../src/lib/CommandBase";
import { CommandHandler } from "../../src/lib/CommandHandler";
import { NodeKind, ServerlessNode } from "../../src/lib/ServerlessNode";
import { TestContext } from "./TestContext";

// tslint:disable:no-unused-expression
// tslint:disable:max-classes-per-file

chai.use(sinon_chai);
const expect = chai.expect;

class TestCommand extends CommandBase {
	constructor(public context: ExtensionContext) {
		super();
		this.invoke = sinon.stub();
	}

	public invoke(node: ServerlessNode): Thenable<void> {
		throw new Error("TestCommand: Method not implemented.");
	}
}

class TestCommandExclusive extends CommandBase {
	constructor(public context: ExtensionContext) {
		super(true);
	}

	public invoke(node: ServerlessNode): Thenable<void> {
		return new Promise(resolve => {
			setTimeout(() => {
				resolve();
			}, 200);
		});
	}
}

describe("CommandHandler", () => {
	let sandbox: sinon.SinonSandbox;
	let windowShowInputBoxStub: sinon.SinonStub;
	let windowShowErrorMessageStub: sinon.SinonStub;

	before(() => {
		sandbox = sinon.createSandbox();
	});

	beforeEach(() => {
		windowShowInputBoxStub = sandbox.stub(window, "showInputBox");
		windowShowErrorMessageStub = sandbox.stub(window, "showErrorMessage");
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe("registerCommand", () => {
		let testContext: ExtensionContext;
		let commandsRegisterCommandSpy: sinon.SinonSpy;

		beforeEach(() => {
			testContext = new TestContext();
			commandsRegisterCommandSpy = sandbox.spy(commands, "registerCommand");
		});

		it("should register command and keep subscription", async () => {
			CommandHandler.registerCommand(
				TestCommand,
				"serverless.test",
				testContext,
			);

			expect(testContext.subscriptions).to.have.length(1);
			expect(commandsRegisterCommandSpy).to.have.been.calledOnce;
			const registeredCommands = await commands.getCommands();
			expect(registeredCommands).to.include("serverless.test");
		});

		it("should invoke registered command", async () => {
			const registeredCommands = await commands.getCommands();
			if (!_.includes(registeredCommands, "serverless.test")) {
				CommandHandler.registerCommand(
					TestCommand,
					"serverless.test",
					testContext,
				);
			}

			return commands.executeCommand("serverless.test")
			.then(
				() => expect(true).to.be.false,
				_.noop,
			);
		});
	});

	describe("Commands", () => {
		let testContext: ExtensionContext;

		before(() => {
			testContext = new TestContext();
			CommandHandler.registerCommand(
				TestCommandExclusive,
				"serverless.testexclusive",
				testContext,
			);
		});

		it("should execute exclusively alone", async () => {
			return expect(commands.executeCommand("serverless.testexclusive"))
				.to.been.fulfilled
			.then(() => {
				expect(windowShowErrorMessageStub).to.not.have.been.called;
			});
		});

		it("should execute only one exclusive command", async () => {
			CommandHandler.isCommandRunning = true;
			return expect(commands.executeCommand("serverless.testexclusive"))
				.to.been.rejected
			.then(() => {
				expect(windowShowErrorMessageStub).to.have.been.called;
			});
		});
	});
});
