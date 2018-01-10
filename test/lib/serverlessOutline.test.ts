import * as chai from "chai";
import * as yaml from "js-yaml";
import * as _ from "lodash";
import * as sinon from "sinon";
import * as sinon_chai from "sinon-chai";
import { window } from "vscode";
import { ServerlessOutlineProvider } from "../../src/lib/serverlessOutline";
import { TestContext } from "./TestContext";

// tslint:disable:no-unused-expression

chai.use(sinon_chai);
const expect = chai.expect;

const sampleYaml = `
# serverless.yml
provider:
  name: aws
functions:
  hello:
	handler: hello.handle
  wow:
	handler: wow.handle
	events:
	  - http:
		  path: api/v1/wow
		  method: get
`;

const TextEditorMock = {
	document: {
		fileName: "serverless.yml",
		getText: sinon.stub().returns(sampleYaml),
	},
};

describe("ServerlessOutlineProvider", () => {
	let sandbox: sinon.SinonSandbox;
	let yamlSafeLoadStub: sinon.SinonStub;

	before(() => {
		sandbox = sinon.createSandbox();
	});

	beforeEach(() => {
		// Set active editor mock
		sandbox.stub(window, "activeTextEditor").value(TextEditorMock);
		yamlSafeLoadStub = sandbox.stub(yaml, "safeLoad");
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe("constructor", () => {
		it("should parse service from active text editor", () => {
			yamlSafeLoadStub.returns({
				functions: {
					hello: {
						handler: "hello.handle",
					},
					wow: {
						events: [
							{
								http: {
									method: "get",
									path: "/api/v1/wow",
								},
							},
						],
						handler: "wow.handle",
					},
				},
				provider: {
					name: "aws",
				},
			});

			const provider = new ServerlessOutlineProvider(new TestContext());

			expect(yamlSafeLoadStub).to.have.been.calledOnce;
			expect(yamlSafeLoadStub).to.have.been.calledWithExactly(
				sampleYaml,
				{},
			);

			const children = provider.getChildren();
			expect(children).to.been.of.length(2);
			const functionsNode = _.find(children, [ "name", "Functions" ]);
			expect(functionsNode).to.have.property("children")
				.that.is.an("array").that.has.lengthOf(2);
		});
	});
});
