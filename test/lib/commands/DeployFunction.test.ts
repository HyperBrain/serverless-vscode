import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import * as sinon from "sinon";
import { CommandBase } from "../../../src/lib/CommandBase";
import { DeployFunction } from "../../../src/lib/commands/DeployFunction";
import { Serverless } from "../../../src/lib/Serverless";
import { NodeKind, ServerlessNode } from "../../../src/lib/ServerlessNode";
import { TestContext } from "../TestContext";

// tslint:disable:no-unused-expression

// tslint:disable-next-line:no-var-requires
chai.use(chaiAsPromised);
const expect = chai.expect;

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
		commandBaseAskForStageStub = sandbox.stub(CommandBase, "askForStageAndRegion" as any);
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
				commandBaseAskForStageStub.resolves(["stage", "region"]);
				const expectation = expect(deployFunctionCommand.invoke(testNode.node));
				if (testNode.shouldSucceed) {
					return expectation.to.be.fulfilled;
				}
				return expectation.to.be.rejected;
			});
		});
	});

	it("should ask for the stage", () => {
		commandBaseAskForStageStub.resolves(["stage", "region"]);
		return expect(deployFunctionCommand.invoke(new ServerlessNode("testNode", NodeKind.FUNCTION)))
			.to.be.fulfilled
		.then(() => {
			expect(commandBaseAskForStageStub).to.have.been.calledOnce;
		});
	});

	it("should invoke Serverless", () => {
		commandBaseAskForStageStub.resolves(["stage", "region"]);
		serverlessInvokeStub.resolves();
		return expect(deployFunctionCommand.invoke(new ServerlessNode("testNode", NodeKind.FUNCTION)))
			.to.be.fulfilled
		.then(() => {
			expect(serverlessInvokeStub).to.have.been.calledOnce;
			expect(serverlessInvokeStub).to.have.been.calledWithExactly("deploy function", {
				cwd: "",
				function: "testNode",
				region: "region",
				stage: "stage",
			});
		});
	});

	it("should propagate Serverless error", () => {
		commandBaseAskForStageStub.resolves(["stage", "region"]);
		serverlessInvokeStub.rejects(new Error("Serverless error"));
		return expect(deployFunctionCommand.invoke(new ServerlessNode("testNode", NodeKind.FUNCTION)))
			.to.be.rejectedWith("Serverless error");
	});
});
