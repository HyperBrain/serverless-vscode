import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import * as sinon from "sinon";
import { CommandBase, ICommand } from "../../../src/lib/CommandBase";
import { Deploy } from "../../../src/lib/commands/Deploy";
import { Serverless } from "../../../src/lib/Serverless";
import { NodeKind, ServerlessNode } from "../../../src/lib/ServerlessNode";
import { TestContext } from "../TestContext";

// tslint:disable:no-unused-expression

// tslint:disable-next-line:no-var-requires
chai.use(chaiAsPromised);
const expect = chai.expect;

/**
 * Unit tests for the Deploy command
 */

describe("Deploy", () => {
	let sandbox: sinon.SinonSandbox;
	let deployCommand: Deploy;
	let commandBaseAskForStageStub: sinon.SinonStub;
	let serverlessInvokeStub: sinon.SinonStub;

	before(() => {
		sandbox = sinon.createSandbox();
	});

	beforeEach(() => {
		deployCommand = new Deploy(new TestContext());
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
				shouldSucceed: false,
			},
			{
				node: new ServerlessNode("container node", NodeKind.CONTAINER),
				shouldSucceed: true,
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
				const expectation = expect(deployCommand.invoke(testNode.node));
				if (testNode.shouldSucceed) {
					return expectation.to.be.fulfilled;
				}
				return expectation.to.be.rejected;
			});
		});
	});

	it("should ask for the stage", () => {
		commandBaseAskForStageStub.resolves(["stage", "region"]);
		return expect(deployCommand.invoke(new ServerlessNode("testNode", NodeKind.CONTAINER)))
			.to.be.fulfilled
		.then(() => {
			expect(commandBaseAskForStageStub).to.have.been.calledOnce;
		});
	});

	it("should invoke Serverless", () => {
		commandBaseAskForStageStub.resolves(["stage", "region"]);
		serverlessInvokeStub.resolves();
		return expect(deployCommand.invoke(new ServerlessNode("testNode", NodeKind.CONTAINER)))
			.to.be.fulfilled
		.then(() => {
			expect(serverlessInvokeStub).to.have.been.calledOnce;
			expect(serverlessInvokeStub).to.have.been.calledWithExactly("deploy", {
				cwd: "",
				region: "region",
				stage: "stage",
			});
		});
	});

	it("should propagate Serverless error", () => {
		commandBaseAskForStageStub.resolves(["stage", "region"]);
		serverlessInvokeStub.rejects(new Error("Serverless error"));
		return expect(deployCommand.invoke(new ServerlessNode("testNode", NodeKind.CONTAINER)))
			.to.be.rejectedWith("Serverless error");
	});
});
