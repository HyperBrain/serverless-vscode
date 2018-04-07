import * as sinon from "sinon";
import { commands, ExtensionContext, Memento } from "vscode";

class MementoMock implements Memento {
	public get<T>(key: string): T | undefined;
	public get<T>(key: string, defaultValue: T): T;
	public get(key: any, defaultValue?: any) {
		throw new Error("Method not implemented.");
	}
	public update(key: string, value: any): Thenable<void> {
		throw new Error("Method not implemented.");
	}
}

// tslint:disable-next-line:max-classes-per-file
export class TestContext implements ExtensionContext {
	public subscriptions: Array<{ dispose(): any; }> = [];
	public workspaceState: Memento = new MementoMock();
	public globalState: Memento = new MementoMock();
	public extensionPath: string = "myExtensionPath";
	public asAbsolutePath: sinon.SinonStub = sinon.stub();
	public storagePath: string = "myStoragePath";
}
