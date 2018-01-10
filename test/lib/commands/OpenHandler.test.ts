import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as fs from "fs";
import * as _ from "lodash";
import * as sinon from "sinon";
import { window } from "vscode";
import { CommandBase, ICommand } from "../../../src/lib/CommandBase";
import { OpenHandler } from "../../../src/lib/commands/OpenHandler";
import { Serverless } from "../../../src/lib/Serverless";
import { NodeKind, ServerlessNode } from "../../../src/lib/ServerlessNode";
import { TestContext } from "../TestContext";

// tslint:disable:no-unused-expression

// tslint:disable-next-line:no-var-requires
chai.use(chaiAsPromised);
const expect = chai.expect;

/**
 * Unit tests for the OpenHandler command
 */

describe("OpenHandler", () => {
	let sandbox: sinon.SinonSandbox;
	let openHandlerCommand: OpenHandler;
	let windowShowTextDocumentStub: sinon.SinonStub;
	let existsSyncStub: sinon.SinonStub;

	before(() => {
		sandbox = sinon.createSandbox();
	});

	beforeEach(() => {
		openHandlerCommand = new OpenHandler(new TestContext());
		windowShowTextDocumentStub = sandbox.stub(window, "showTextDocument");
		existsSyncStub = sandbox.stub(fs, "existsSync");
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe("with different node types", () => {
		const testNodes: Array<{ node: ServerlessNode, shouldSucceed: boolean }> = [
			{
				node: new ServerlessNode("function node", NodeKind.FUNCTION, {
					handler: "myHandler.handle",
				}),
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
				windowShowTextDocumentStub.resolves();
				existsSyncStub.returns(true);
				const expectation = expect(openHandlerCommand.invoke(testNode.node));
				if (testNode.shouldSucceed) {
					return expectation.to.be.fulfilled;
				}
				return expectation.to.be.rejected;
			});
		});
	});

	it("should reject if handler is not declared", () => {
		const functionDefinition = {};
		windowShowTextDocumentStub.resolves();
		existsSyncStub.returns(true);
		return expect(openHandlerCommand.invoke(new ServerlessNode("myFunc", NodeKind.FUNCTION, functionDefinition)))
			.to.been.rejectedWith(/does not declare a valid handler/)
		.then(() => {
			expect(existsSyncStub).to.not.have.been.called;
			expect(windowShowTextDocumentStub).to.not.have.been.called;
		});
	});

	it("should reject if handler is malformed", () => {
		const functionDefinition = {
			handler: "myInvalidHandler",
		};
		windowShowTextDocumentStub.resolves();
		existsSyncStub.returns(true);
		return expect(openHandlerCommand.invoke(new ServerlessNode("myFunc", NodeKind.FUNCTION, functionDefinition)))
			.to.been.rejectedWith(/is not formatted correctly/)
		.then(() => {
			expect(existsSyncStub).to.not.have.been.called;
			expect(windowShowTextDocumentStub).to.not.have.been.called;
		});
	});

	it("should reject if handler source is not found", () => {
		const functionDefinition = {
			handler: "myHandler.handle",
		};
		windowShowTextDocumentStub.resolves();
		existsSyncStub.returns(false);
		return expect(openHandlerCommand.invoke(new ServerlessNode("myFunc", NodeKind.FUNCTION, functionDefinition)))
			.to.been.rejectedWith(/Could not load handler/)
		.then(() => {
			expect(existsSyncStub).to.have.been.calledOnce;
			expect(windowShowTextDocumentStub).to.not.have.been.called;
		});
	});
});
