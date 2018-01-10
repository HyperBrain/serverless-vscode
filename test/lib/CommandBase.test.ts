import * as chai from "chai";
import * as sinon from "sinon";
import * as sinon_chai from "sinon-chai";
import { window } from "vscode";
import { CommandBase } from "../../src/lib/CommandBase";
import { NodeKind, ServerlessNode } from "../../src/lib/ServerlessNode";

chai.use(sinon_chai);
const expect = chai.expect;

class CommandBaseTester extends CommandBase {
	public static askForStage() {
		return CommandBase.askForStageAndRegion();
	}
}

describe("CommandBase", () => {
	let sandbox: sinon.SinonSandbox;
	let windowShowInputBoxStub: sinon.SinonStub;
	const commandBase = new CommandBase();

	before(() => {
		sandbox = sinon.createSandbox();
	});

	beforeEach(() => {
		windowShowInputBoxStub = sandbox.stub(window, "showInputBox");
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe("askForStage", () => {
		it("should set prompt and placeholder", async () => {
			windowShowInputBoxStub.resolves("");
			const result = await CommandBaseTester.askForStage();
			expect(windowShowInputBoxStub).to.have.been.calledWithExactly({
				placeHolder: "dev",
				prompt: "Stage (defaults to dev)",
			});
		});

		it("should default to dev", async () => {
			windowShowInputBoxStub.resolves("");
			const result = await CommandBaseTester.askForStage();
			expect(result).to.equal("dev");
		});

		it("should set stage to user input", async () => {
			windowShowInputBoxStub.resolves("myStage");
			const result = await CommandBaseTester.askForStage();
			expect(result).to.equal("myStage");
		});
	});

	describe("invoke", () => {
		const testNode = new ServerlessNode("test", NodeKind.CONTAINER);

		it("should throw on invoke", () => {
			expect(() => commandBase.invoke(testNode)).to.throw("Must be overridden.");
		});
	});
});
