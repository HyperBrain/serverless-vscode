import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import * as path from "path";
import * as sinon from "sinon";
import { Uri, window } from "vscode";
import { CommandBase, ICommand } from "../../../src/lib/CommandBase";
import { InvokeLocal } from "../../../src/lib/commands/InvokeLocal";
import { Serverless } from "../../../src/lib/Serverless";
import { NodeKind, ServerlessNode } from "../../../src/lib/ServerlessNode";
import { TestContext } from "../TestContext";

// tslint:disable:no-unused-expression

// tslint:disable-next-line:no-var-requires
chai.use(chaiAsPromised);
const expect = chai.expect;

/**
 * Unit tests for the InvokeLocal command
 */

describe("InvokeLocal", () => {
	let sandbox: sinon.SinonSandbox;
	let InvokeLocalCommand: InvokeLocal;
	let commandBaseAskForStageStub: sinon.SinonStub;
	let windowShowOpenDialogStub: sinon.SinonStub;
	let serverlessInvokeStub: sinon.SinonStub;

	before(() => {
		sandbox = sinon.createSandbox();
	});

	beforeEach(() => {
		InvokeLocalCommand = new InvokeLocal(new TestContext());
		commandBaseAskForStageStub = sandbox.stub(CommandBase, "askForStage" as any);
		windowShowOpenDialogStub = sandbox.stub(window, "showOpenDialog");
		serverlessInvokeStub = sandbox.stub(Serverless, "invoke");
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe("with different node types", () => {
		const testNodes: Array<{ node: ServerlessNode, shouldSucceed: boolean }> = [
			{
				node: new ServerlessNode("function node", NodeKind.FUNCTION),
				shouldSucceed: true,
			},
			{
				node: new ServerlessNode("container node", NodeKind.CONTAINER),
				shouldSucceed: false,
			},
			{
				node: new ServerlessNode("api method node", NodeKind.APIMETHOD),
				shouldSucceed: false,
			},
			{
				node: new ServerlessNode("api path node", NodeKind.APIPATH),
				shouldSucceed: false,
			},
			{
				node: new ServerlessNode("root node", NodeKind.ROOT),
				shouldSucceed: false,
			},
		];

		_.forEach(testNodes, testNode => {
			it(`should ${testNode.shouldSucceed ? "succeed" : "fail"} for ${testNode.node.name}`, () => {
				commandBaseAskForStageStub.resolves("stage");
				windowShowOpenDialogStub.resolves([
					Uri.file("/my/test/event.json"),
				]);
				const expectation = expect(InvokeLocalCommand.invoke(testNode.node));
				if (testNode.shouldSucceed) {
					return expectation.to.be.fulfilled;
				}
				return expectation.to.be.rejected;
			});
		});
	});

	it("should ask for the stage", () => {
		commandBaseAskForStageStub.resolves("stage");
		windowShowOpenDialogStub.resolves([
			Uri.file("/my/test/event.json"),
		]);
		return expect(InvokeLocalCommand.invoke(new ServerlessNode("testNode", NodeKind.FUNCTION)))
			.to.be.fulfilled
		.then(() => {
			expect(commandBaseAskForStageStub).to.have.been.calledOnce;
		});
	});

	it("should ask for an event json", () => {
		commandBaseAskForStageStub.resolves("stage");
		windowShowOpenDialogStub.resolves([
			Uri.file("/my/test/event.json"),
		]);
		return expect(InvokeLocalCommand.invoke(new ServerlessNode("testNode", NodeKind.FUNCTION)))
			.to.be.fulfilled
		.then(() => {
			expect(windowShowOpenDialogStub).to.have.been.calledOnce;
			expect(windowShowOpenDialogStub).to.have.been.calledWithExactly({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				filters: {
					"Event JSON": [ "json" ],
				},
				openLabel: "Select event",
			});
		});
	});

	describe("when event selection is cancelled", () => {
		it("should do nothing for empty array", () => {
			commandBaseAskForStageStub.resolves("stage");
			windowShowOpenDialogStub.resolves([]);
			return expect(InvokeLocalCommand.invoke(new ServerlessNode("testNode", NodeKind.FUNCTION)))
				.to.be.fulfilled
			.then(() => {
				expect(windowShowOpenDialogStub).to.have.been.calledOnce;
				expect(serverlessInvokeStub).to.not.have.been.called;
			});
		});

		it("should do nothing for undefined", () => {
			commandBaseAskForStageStub.resolves("stage");
			windowShowOpenDialogStub.resolves();
			return expect(InvokeLocalCommand.invoke(new ServerlessNode("testNode", NodeKind.FUNCTION)))
				.to.be.fulfilled
			.then(() => {
				expect(windowShowOpenDialogStub).to.have.been.calledOnce;
				expect(serverlessInvokeStub).to.not.have.been.called;
			});
		});
	});

	it("should invoke Serverless", () => {
		const testFilePath = "/my/test/event.json";
		commandBaseAskForStageStub.resolves("stage");
		windowShowOpenDialogStub.resolves([
			Uri.file(testFilePath),
		]);
		serverlessInvokeStub.resolves();
		return expect(InvokeLocalCommand.invoke(new ServerlessNode("testNode", NodeKind.FUNCTION)))
			.to.be.fulfilled
		.then(() => {
			expect(serverlessInvokeStub).to.have.been.calledOnce;
			expect(serverlessInvokeStub).to.have.been.calledWithExactly("invoke local", {
				cwd: "",
				function: "testNode",
				path: path.relative("", testFilePath),
				stage: "stage",
			});
		});
	});

	it("should propagate Serverless error", () => {
		commandBaseAskForStageStub.resolves("stage");
		windowShowOpenDialogStub.resolves([
			Uri.file("/my/test/event.json"),
		]);
		serverlessInvokeStub.rejects(new Error("Serverless error"));
		return expect(InvokeLocalCommand.invoke(new ServerlessNode("testNode", NodeKind.FUNCTION)))
			.to.be.rejectedWith("Serverless error");
	});
});
