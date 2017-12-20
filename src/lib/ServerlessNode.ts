import { Command, ExtensionContext } from "vscode";
import * as _ from "lodash";

export const enum NodeKind {
	ROOT = "root",
	CONTAINER = "container",
	FUNCTION = "function",
	APIPATH = "apipath",
	APIMETHOD = "apimethod"
}

export class ServerlessNode {

	children: ServerlessNode[];
	name: string;
	kind: NodeKind;
	documentRoot: string;
	data?: any;

	constructor(name: string, kind: NodeKind, data?: Object) {
		this.children = [];
		this.name = name;
		this.kind = kind;
		this.documentRoot = "";
		this.data = data;
	}

	get hasChildren(): boolean {
		return !_.isEmpty(this.children);
	}

	getCommand(): Command | null {
		switch (this.kind) {

		}
		return null;
	}

	setDocumentRoot(documentRoot: string) {
		this.documentRoot = documentRoot;
		_.forEach(this.children, child => child.setDocumentRoot(documentRoot));
	}
}
