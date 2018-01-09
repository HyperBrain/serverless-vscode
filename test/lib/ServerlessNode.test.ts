import * as chai from "chai";
import * as _ from "lodash";
import * as sinon from "sinon";
import { NodeKind, ServerlessNode } from "../../src/lib/ServerlessNode";

// tslint:disable:no-unused-expression

const expect = chai.expect;

describe("ServerlessNode", () => {
	it("should provide hasChildren property", () => {
		const root = new ServerlessNode("root", NodeKind.ROOT);
		const noChildren = new ServerlessNode("root", NodeKind.ROOT);

		root.children.push(new ServerlessNode("Child", NodeKind.CONTAINER));

		expect(root.hasChildren).to.be.true;
		expect(noChildren.hasChildren).to.be.false;
	});

	it("should set document root resursively", () => {
		const docRoot = "myRoot";
		const root = new ServerlessNode("root", NodeKind.ROOT);

		// Add some child nodes
		for (let n = 0; n < 5; n++) {
			const childNode = new ServerlessNode(`child ${n}`, NodeKind.CONTAINER);
			for (let m = 0; m < 2; m++) {
				childNode.children.push(new ServerlessNode(`func ${m}`, NodeKind.FUNCTION));
			}
			root.children.push(childNode);
		}

		expect(root.setDocumentRoot(docRoot)).to.not.throw;

		// Check all child nodes
		const allChildren = _.flatMap(root.children, child => {
			const result = [ child.documentRoot ];
			if (child.hasChildren) {
				const childDocRoots = _.flatMap(child.children, subChild => subChild.documentRoot);
				Array.prototype.push.apply(result, childDocRoots);
			}
			return result;
		});
		expect(allChildren).to.been.of.length(15);
		expect(_.every(allChildren, (childDocRoot: string) => _.isEqual(childDocRoot, docRoot)))
			.to.been.true;
	});
});
