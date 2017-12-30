import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import * as sinon from "sinon";
import { ExtensionContext, Memento } from "vscode";
import { CommandBase, ICommand } from "../../../src/lib/CommandBase";
import { DeployFunction } from "../../../src/lib/commands/DeployFunction";
import { Serverless } from "../../../src/lib/Serverless";
import { NodeKind, ServerlessNode } from "../../../src/lib/ServerlessNode";

// tslint:disable:no-unused-expression

// tslint:disable-next-line:no-var-requires
chai.use(chaiAsPromised);
const expect = chai.expect;

class TestContext implements ExtensionContext {
	public subscriptions: Array<{ dispose(): any; }> = [];
	public workspaceState: Memento;
	public globalState: Memento;
	public extensionPath: string = "myExtensionPath";
	public asAbsolutePath: sinon.SinonStub = sinon.stub();
	public storagePath: string = "myStoragePath";
}

/**
 * Unit tests for the DeployFunction command
 */

describe("DeployFunction", () => {
	let sandbox: sinon.SinonSandbox;
	let deployFunctionCommand: DeployFunction;
	let commandBaseAskForStageStub: sinon.SinonStub;
	let serverlessInvokeStub: sinon.SinonStub;

	before(() => {
		sandbox = sinon.createSandbox();
	});

	beforeEach(() => {
		deployFunctionCommand = new DeployFunction(new TestContext());
		commandBaseAskForStageStub = sandbox.stub(CommandBase, "askForStage" as any);
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
				const expectation = expect(deployFunctionCommand.invoke(testNode.node));
				if (testNode.shouldSucceed) {
					return expectation.to.be.fulfilled;
				}
				return expectation.to.be.rejected;
			});
		});
	});

	it("should ask for the stage", () => {
		commandBaseAskForStageStub.resolves("stage");
		return expect(deployFunctionCommand.invoke(new ServerlessNode("testNode", NodeKind.FUNCTION)))
			.to.be.fulfilled
		.then(() => {
			expect(commandBaseAskForStageStub).to.have.been.calledOnce;
		});
	});

	it("should invoke Serverless", () => {
		commandBaseAskForStageStub.resolves("stage");
		serverlessInvokeStub.resolves();
		return expect(deployFunctionCommand.invoke(new ServerlessNode("testNode", NodeKind.FUNCTION)))
			.to.be.fulfilled
		.then(() => {
			expect(serverlessInvokeStub).to.have.been.calledOnce;
			expect(serverlessInvokeStub).to.have.been.calledWithExactly("deploy function", {
				cwd: "",
				function: "testNode",
				stage: "stage",
			});
		});
	});

	it("should propagate Serverless error", () => {
		commandBaseAskForStageStub.resolves("stage");
		serverlessInvokeStub.rejects(new Error("Serverless error"));
		return expect(deployFunctionCommand.invoke(new ServerlessNode("testNode", NodeKind.FUNCTION)))
			.to.be.rejectedWith("Serverless error");
	});
});
