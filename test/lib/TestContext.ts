import * as sinon from "sinon";
import { commands, ExtensionContext, Memento } from "vscode";

export class TestContext implements ExtensionContext {
	public subscriptions: Array<{ dispose(): any; }> = [];
	public workspaceState: Memento;
	public globalState: Memento;
	public extensionPath: string = "myExtensionPath";
	public asAbsolutePath: sinon.SinonStub = sinon.stub();
	public storagePath: string = "myStoragePath";
}
