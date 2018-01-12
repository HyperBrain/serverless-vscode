import * as chai from "chai";
import * as sinon from "sinon";
import * as sinon_chai from "sinon-chai";
import { window, workspace, WorkspaceConfiguration } from "vscode";
import { CommandBase } from "../../src/lib/CommandBase";
import { NodeKind, ServerlessNode } from "../../src/lib/ServerlessNode";

// tslint:disable:no-unused-expression

chai.use(sinon_chai);
const expect = chai.expect;

class CommandBaseTester extends CommandBase {
	public static askForStageAndRegion() {
		return CommandBase.askForStageAndRegion();
	}

	public invoke(node: ServerlessNode): Thenable<void> {
		return Promise.resolve();
	}
}

describe("CommandBase", () => {
	let sandbox: sinon.SinonSandbox;
	let workspaceGetConfigurationStub: sinon.SinonStub;
	let configurationMock: any;
	let windowShowInputBoxStub: sinon.SinonStub;

	before(() => {
		sandbox = sinon.createSandbox();
		configurationMock = {
			get: sandbox.stub(),
		};
	});

	beforeEach(() => {
		windowShowInputBoxStub = sandbox.stub(window, "showInputBox");
		workspaceGetConfigurationStub = sandbox.stub(workspace, "getConfiguration");
		workspaceGetConfigurationStub.returns(configurationMock);
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe("askForStage", () => {
		describe("without asking for region", () => {
			it("should set prompt and placeholder", async () => {
				windowShowInputBoxStub.resolves("");
				configurationMock.get.withArgs("serverless.aws.askForRegion").returns(false);
				configurationMock.get.withArgs("serverless.aws.defaultStage").returns("dev");
				configurationMock.get.withArgs("serverless.aws.defaultRegion").returns("us-east-1");
				const result = await CommandBaseTester.askForStageAndRegion();
				expect(windowShowInputBoxStub).to.have.been.calledOnce;
				expect(windowShowInputBoxStub).to.have.been.calledWithExactly({
					placeHolder: "dev",
					prompt: "Stage (defaults to dev)",
				});
			});

			it("should use configured defaults", async () => {
				windowShowInputBoxStub.resolves("");
				configurationMock.get.withArgs("serverless.aws.askForRegion").returns(false);
				configurationMock.get.withArgs("serverless.aws.defaultStage").returns("myStage");
				configurationMock.get.withArgs("serverless.aws.defaultRegion").returns("us-east-1");
				const result = await CommandBaseTester.askForStageAndRegion();
				expect(result).to.deep.equal(["myStage", "us-east-1"]);
			});

			it("should set stage to user input", async () => {
				windowShowInputBoxStub.resolves("myStage");
				configurationMock.get.withArgs("serverless.aws.askForRegion").returns(false);
				configurationMock.get.withArgs("serverless.aws.defaultStage").returns("dev");
				configurationMock.get.withArgs("serverless.aws.defaultRegion").returns("us-east-1");
				const result = await CommandBaseTester.askForStageAndRegion();
				expect(result).to.deep.equal(["myStage", "us-east-1"]);
			});
		});

		describe("with asking for region", () => {
			it("should set prompt and placeholder", async () => {
				windowShowInputBoxStub.resolves("");
				configurationMock.get.withArgs("serverless.aws.askForRegion").returns(true);
				configurationMock.get.withArgs("serverless.aws.defaultStage").returns("dev");
				configurationMock.get.withArgs("serverless.aws.defaultRegion").returns("us-east-1");
				const result = await CommandBaseTester.askForStageAndRegion();
				expect(windowShowInputBoxStub).to.have.been.calledTwice;
				expect(windowShowInputBoxStub.firstCall).to.have.been.calledWithExactly({
					placeHolder: "dev",
					prompt: "Stage (defaults to dev)",
				});
				expect(windowShowInputBoxStub.secondCall).to.have.been.calledWithExactly({
					placeHolder: "us-east-1",
					prompt: "Region (defaults to us-east-1)",
				});
			});

			it("should use configured defaults", async () => {
				windowShowInputBoxStub.resolves("");
				configurationMock.get.withArgs("serverless.aws.askForRegion").returns(true);
				configurationMock.get.withArgs("serverless.aws.defaultStage").returns("myStage");
				configurationMock.get.withArgs("serverless.aws.defaultRegion").returns("us-west-1");
				const result = await CommandBaseTester.askForStageAndRegion();
				expect(result).to.deep.equal(["myStage", "us-west-1"]);
			});

			it("should set stage and region to user input", async () => {
				windowShowInputBoxStub.onFirstCall().resolves("myStage");
				windowShowInputBoxStub.onSecondCall().resolves("myRegion");
				configurationMock.get.withArgs("serverless.aws.askForRegion").returns(true);
				configurationMock.get.withArgs("serverless.aws.defaultStage").returns("dev");
				configurationMock.get.withArgs("serverless.aws.defaultRegion").returns("us-east-1");
				const result = await CommandBaseTester.askForStageAndRegion();
				expect(result).to.deep.equal(["myStage", "myRegion"]);
			});
		});
	});
});
