import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as _ from "lodash";
import * as sinon from "sinon";
import {
	Position,
	Range,
	Selection,
	SnippetString,
	TextDocument,
	TextEditor,
	TextEditorDecorationType,
	TextEditorEdit,
	TextEditorOptions,
	TextEditorRevealType,
	ViewColumn,
	window,
	workspace,
} from "vscode";
import { CommandBase, ICommand } from "../../../src/lib/CommandBase";
import { Resolve } from "../../../src/lib/commands/Resolve";
import { Serverless } from "../../../src/lib/Serverless";
import { NodeKind, ServerlessNode } from "../../../src/lib/ServerlessNode";
import { TestContext } from "../TestContext";

// tslint:disable:no-unused-expression

// tslint:disable-next-line:no-var-requires
chai.use(chaiAsPromised);
const expect = chai.expect;

/**
 * Stubbed TextEditor.
 */
class TestEditor implements TextEditor {
	public document: TextDocument;
	public selection: Selection;
	public selections: Selection[];
	public options: TextEditorOptions;
	public viewColumn?: ViewColumn | undefined;

	public edit: sinon.SinonStub;
	public insertSnippet: sinon.SinonStub;
	public setDecorations: sinon.SinonStub;
	public revealRange: sinon.SinonStub;
	public show: sinon.SinonStub;
	public hide: sinon.SinonStub;

	constructor(sandbox: sinon.SinonSandbox) {
		this.edit = sandbox.stub();
		this.insertSnippet = sandbox.stub();
		this.setDecorations = sandbox.stub();
		this.revealRange = sandbox.stub();
		this.show = sandbox.stub();
		this.hide = sandbox.stub();
	}
}

const testDocument = _.join([
	"# Test serverless.yml (resolved)",
	"service: my-service",
	"provider:",
	"  name: aws",
	"# Nothing more here ;-)",
], "\n");

/**
 * Unit tests for the Resolve command
 */

describe("Resolve", () => {
	let sandbox: sinon.SinonSandbox;
	let resolveCommand: Resolve;
	let testEditor: TestEditor;
	let windowShowTextDocumentStub: sinon.SinonStub;
	let workspaceOpenTextDocumentStub: sinon.SinonStub;
	let commandBaseAskForStageStub: sinon.SinonStub;
	let serverlessInvokeWithResultStub: sinon.SinonStub;

	before(() => {
		sandbox = sinon.createSandbox();
	});

	beforeEach(() => {
		resolveCommand = new Resolve(new TestContext());
		windowShowTextDocumentStub = sandbox.stub(window, "showTextDocument");
		workspaceOpenTextDocumentStub = sandbox.stub(workspace, "openTextDocument");
		commandBaseAskForStageStub = sandbox.stub(CommandBase, "askForStage" as any);
		serverlessInvokeWithResultStub = sandbox.stub(Serverless, "invokeWithResult");

		testEditor = new TestEditor(sandbox);
		testEditor.edit.resolves();
		windowShowTextDocumentStub.resolves(testEditor);
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
				commandBaseAskForStageStub.resolves("stage");
				serverlessInvokeWithResultStub.resolves(testDocument);
				workspaceOpenTextDocumentStub.resolves();
				const expectation = expect(resolveCommand.invoke(testNode.node));
				if (testNode.shouldSucceed) {
					return expectation.to.be.fulfilled;
				}
				return expectation.to.be.rejected;
			});
		});
	});

	it("should ask for the stage", () => {
		commandBaseAskForStageStub.resolves("stage");
		serverlessInvokeWithResultStub.resolves(testDocument);
		workspaceOpenTextDocumentStub.resolves();
		return expect(resolveCommand.invoke(new ServerlessNode("testNode", NodeKind.CONTAINER)))
			.to.be.fulfilled
		.then(() => {
			expect(commandBaseAskForStageStub).to.have.been.calledOnce;
		});
	});

	it("should invoke Serverless", () => {
		commandBaseAskForStageStub.resolves("stage");
		serverlessInvokeWithResultStub.resolves();
		serverlessInvokeWithResultStub.resolves(testDocument);
		workspaceOpenTextDocumentStub.resolves();
		return expect(resolveCommand.invoke(new ServerlessNode("testNode", NodeKind.CONTAINER)))
			.to.be.fulfilled
		.then(() => {
			expect(serverlessInvokeWithResultStub).to.have.been.calledOnce;
			expect(serverlessInvokeWithResultStub).to.have.been.calledWithExactly("print", {
				cwd: "",
				stage: "stage",
			});
			expect(workspaceOpenTextDocumentStub).to.have.been.calledOnce;
			expect(windowShowTextDocumentStub).to.have.been.calledOnce;
			expect(testEditor.edit).to.have.been.calledOnce;
		});
	});

	it("should propagate Serverless error", () => {
		commandBaseAskForStageStub.resolves("stage");
		serverlessInvokeWithResultStub.rejects(new Error("Serverless error"));
		return expect(resolveCommand.invoke(new ServerlessNode("testNode", NodeKind.CONTAINER)))
			.to.be.rejectedWith("Serverless error");
	});
});
