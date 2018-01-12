import * as chai from "chai";
import * as chai_as_promised from "chai-as-promised";
import * as child_process from "child_process";
import * as _ from "lodash";
import * as sinon from "sinon";
import * as sinon_chai from "sinon-chai";
import { commands, ExtensionContext, Memento, OutputChannel, window } from "vscode";
import { CommandHandler } from "../../src/lib/CommandHandler";
import { IServerlessInvokeOptions, Serverless } from "../../src/lib/Serverless";
import { NodeKind, ServerlessNode } from "../../src/lib/ServerlessNode";

// tslint:disable:max-classes-per-file
// tslint:disable:no-unused-expression

chai.use(chai_as_promised);
chai.use(sinon_chai);
const expect = chai.expect;

class TestOutputChannel implements OutputChannel {
	public static create(sandbox: sinon.SinonSandbox) {
		return new TestOutputChannel(sandbox);
	}

	public name: string;
	public append: sinon.SinonStub;
	public appendLine: sinon.SinonStub;
	public clear: sinon.SinonStub;
	public show: sinon.SinonStub;
	public hide: sinon.SinonStub;
	public dispose: sinon.SinonStub;

	private constructor(sandbox: sinon.SinonSandbox) {
		this.name = "";
		this.append = sandbox.stub();
		this.appendLine = sandbox.stub();
		this.clear = sandbox.stub();
		this.show = sandbox.stub();
		this.hide = sandbox.stub();
		this.dispose = sandbox.stub();
	}
}

describe("Serverless", () => {
	let sandbox: sinon.SinonSandbox;
	let testOutputChannel: TestOutputChannel;
	let testChildProcess: any;
	let windowCreateOutputChannelStub: sinon.SinonStub;
	let spawnStub: sinon.SinonStub;

	before(() => {
		sandbox = sinon.createSandbox();
	});

	beforeEach(() => {
		windowCreateOutputChannelStub = sandbox.stub(window, "createOutputChannel");
		testOutputChannel = TestOutputChannel.create(sandbox);
		windowCreateOutputChannelStub.returns(testOutputChannel);
		spawnStub = sandbox.stub(child_process, "spawn");
		testChildProcess = {
			on: sandbox.stub(),
			stderr: {
				on: sandbox.stub(),
			},
			stdout: {
				on: sandbox.stub(),
			},
		};
		spawnStub.returns(testChildProcess);
	});

	afterEach(() => {
		sandbox.resetHistory();
		sandbox.restore();
	});

	describe("invoke", () => {
		it("should spawn serverless", () => {
			testChildProcess.on.withArgs("exit").yields(0);
			return expect(Serverless.invoke("my command")).to.be.fulfilled
			.then(() => {
				expect(spawnStub).to.have.been.calledOnce;
				expect(spawnStub.firstCall.args[0]).to.equal("node");
				expect(spawnStub.firstCall.args[1]).to.deep.equal([
					"node_modules/serverless/bin/serverless",
					"my",
					"command",
					"--stage=dev",
				]);
				expect(spawnStub.firstCall.args[2]).to.be.an("object")
					.that.has.property("cwd");
			});
		});

		it("should use custom options", () => {
			const options = {
				cwd: "myCwd",
				myOpt: "myOption",
				stage: "myStage",
			};
			testChildProcess.on.withArgs("exit").yields(0);
			return expect(Serverless.invoke("my command", options)).to.be.fulfilled
			.then(() => {
				expect(spawnStub).to.have.been.calledOnce;
				expect(spawnStub.firstCall.args[0]).to.equal("node");
				expect(spawnStub.firstCall.args[1]).to.deep.equal([
					"node_modules/serverless/bin/serverless",
					"my",
					"command",
					"--myOpt=myOption",
					"--stage=myStage",
				]);
				expect(spawnStub.firstCall.args[2]).to.be.an("object")
					.that.has.property("cwd", "myCwd");
			});
		});

		it("should reject if spawn fails", () => {
			const options = {
				cwd: "myCwd",
				myOpt: "myOption",
				stage: "myStage",
			};
			testChildProcess.on.withArgs("error").yields(new Error("SPAWN FAILED"));
			return expect(Serverless.invoke("my command", options))
				.to.be.rejectedWith("SPAWN FAILED");
		});

		it("should log stdout to channel", () => {
			const testOutput = "My command output";
			const options = {
				cwd: "myCwd",
				myOpt: "myOption",
				stage: "myStage",
			};
			testChildProcess.stdout.on.withArgs("data").yields(testOutput);
			testChildProcess.on.withArgs("exit").yields(0);
			return expect(Serverless.invoke("my command", options))
				.to.be.fulfilled
			.then(() => {
				expect(testOutputChannel.append).to.have.been.calledWithExactly(testOutput);
			});
		});

		it("should log stderr to channel", () => {
			const testOutput = "My error output";
			const options = {
				cwd: "myCwd",
				myOpt: "myOption",
				stage: "myStage",
			};
			testChildProcess.stderr.on.withArgs("data").yields(testOutput);
			testChildProcess.on.withArgs("exit").yields(0);
			return expect(Serverless.invoke("my command", options))
				.to.be.fulfilled
			.then(() => {
				expect(testOutputChannel.append).to.have.been.calledWithExactly(testOutput);
			});
		});
	});

	describe("invokeWithResult", () => {
		it("should spawn serverless", () => {
			testChildProcess.on.withArgs("exit").yields(0);
			return expect(Serverless.invokeWithResult("my command")).to.be.fulfilled
			.then(() => {
				expect(spawnStub).to.have.been.calledOnce;
				expect(spawnStub.firstCall.args[0]).to.equal("node");
				expect(spawnStub.firstCall.args[1]).to.deep.equal([
					"node_modules/serverless/bin/serverless",
					"my",
					"command",
					"--stage=dev",
				]);
				expect(spawnStub.firstCall.args[2]).to.be.an("object")
					.that.has.property("cwd");
			});
		});

		it("should use custom options", () => {
			const options = {
				cwd: "myCwd",
				myOpt: "myOption",
				stage: "myStage",
			};
			testChildProcess.on.withArgs("exit").yields(0);
			return expect(Serverless.invokeWithResult("my command", options)).to.be.fulfilled
			.then(() => {
				expect(spawnStub).to.have.been.calledOnce;
				expect(spawnStub.firstCall.args[0]).to.equal("node");
				expect(spawnStub.firstCall.args[1]).to.deep.equal([
					"node_modules/serverless/bin/serverless",
					"my",
					"command",
					"--myOpt=myOption",
					"--stage=myStage",
				]);
				expect(spawnStub.firstCall.args[2]).to.be.an("object")
					.that.has.property("cwd", "myCwd");
			});
		});

		it("should reject if spawn fails", () => {
			const options = {
				cwd: "myCwd",
				myOpt: "myOption",
				stage: "myStage",
			};
			testChildProcess.on.withArgs("error").yields(new Error("SPAWN FAILED"));
			return expect(Serverless.invokeWithResult("my command", options))
				.to.be.rejectedWith("SPAWN FAILED");
		});

		it("should capture stdout and not log to channel", () => {
			const testOutput = "My command output";
			const options = {
				cwd: "myCwd",
				myOpt: "myOption",
				stage: "myStage",
			};
			testChildProcess.stdout.on.withArgs("data").yields(testOutput);
			testChildProcess.on.withArgs("exit").yields(0);
			return expect(Serverless.invokeWithResult("my command", options))
				.to.be.fulfilled
			.then(() => {
				expect(testOutputChannel.append).to.not.have.been.called;
			});
		});

		it("should log stderr to channel", () => {
			const testOutput = "My error output";
			const options = {
				cwd: "myCwd",
				myOpt: "myOption",
				stage: "myStage",
			};
			testChildProcess.stderr.on.withArgs("data").yields(testOutput);
			testChildProcess.on.withArgs("exit").yields(0);
			return expect(Serverless.invoke("my command", options))
				.to.be.fulfilled
			.then(() => {
				expect(testOutputChannel.append).to.have.been.calledWithExactly(testOutput);
			});
		});
	});
});
