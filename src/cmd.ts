import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Dependency } from './dependency';

export class cmdTreeViewProvider implements vscode.TreeDataProvider<Dependency> {
    config: ({cmd: string, tag: string}[])|undefined;

    private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | null | void> = new vscode.EventEmitter<Dependency | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | null | void> = this._onDidChangeTreeData.event;
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getChildren(element?: Dependency | undefined): vscode.ProviderResult<Dependency[]> {
        if (element) {
            return Promise.resolve([]);
        }
        if (vscode.workspace.getWorkspaceFolder === undefined) {
            vscode.window.showErrorMessage("From Please open a workspace first.");
            return Promise.resolve([]);
        }
        if (this.config === undefined) {
            this.syncCfg();
        }
        let cmdList = this.getCmdList();
        if (cmdList === undefined) {
            return Promise.resolve([]);
        }
        let hostItems: any[] = [];
        cmdList.find(function (cmd) {
            if (cmd['tag'] !== undefined) {
                const hostItem = new Dependency(cmd['tag'], '', vscode.TreeItemCollapsibleState.None);
                hostItems.push(hostItem);
            }
        });
        return Promise.resolve(hostItems);
    }

    getTreeItem(element: Dependency): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    syncCfg() {
        this.config = vscode.workspace.getConfiguration('quick-ssh-on-terminal').get<Array<{cmd: string, tag: string}>> ('cmdList');
    }

    getCmdList(): { cmd: string, tag: string }[]|undefined {
        return this.config;
        // return this.config.get<Array<{ cmd: string, tag: string }>>('cmdList');
    }

    sentToTerminal(node: Dependency) {
        if (vscode.workspace.getWorkspaceFolder === undefined) {
            vscode.window.showErrorMessage("Please open a workspace first.");
            return;
        }
        let cmdList = this.getCmdList();
        if (cmdList === undefined) {
            return;
        }
        cmdList.find(function (cmd) {
            if (cmd['tag'] === node.label) {
                vscode.window.activeTerminal?.sendText(cmd['cmd']);
                return;
            }
        });
    }

    async add() {
        if (vscode.workspace.getWorkspaceFolder === undefined) {
            vscode.window.showErrorMessage("Please open a workspace first.");
            return;
        }
        await vscode.window.showInputBox({
            prompt: "Please input command",
            placeHolder: "exmple: ls -al"
        }).then(async (cmd) => {
            if (cmd !== undefined) {
                await vscode.window.showInputBox({
                    prompt: "Please input command tag",
                    placeHolder: cmd,
                    value: cmd
                }).then(async (tag) => {
                    if (tag !== undefined) {
                        this.config?.push({
                            tag: tag,
                            cmd: cmd
                        });
                        vscode.workspace.getConfiguration('quick-ssh-on-terminal').update('cmdList', this.config);
                    }
                });
            }
        });
    }

    async remove(node: Dependency) {
        if (vscode.workspace.getWorkspaceFolder === undefined) {
            vscode.window.showErrorMessage("Please open a workspace first.");
            return;
        }
        this.config = this.config?.filter(cmd => cmd.tag !== node.label);
        vscode.workspace.getConfiguration('quick-ssh-on-terminal').update('cmdList', this.config);
    }

    async editCmd (node: Dependency) {
        if (vscode.workspace.getWorkspaceFolder === undefined) {
            vscode.window.showErrorMessage("Please open a workspace first.");
            return;
        }
        let cmdList = this.getCmdList();
        if (cmdList === undefined) {
            return;
        }
        let index = cmdList.findIndex( (cmd) => {
            if (cmd['tag'] === node.label) {
                return true;
            }
        });
        if (this.config) {
            await vscode.window.showInputBox(
                {
                    prompt: "Please input command",
                    placeHolder: cmdList[index]['cmd'],
                    value: cmdList[index]['cmd']
                },
            ).then(async (cmd) => {
                if (cmd !== undefined && this.config) {
                    this.config[index] = {
                        tag: node.label,
                        cmd: cmd
                    };
                    vscode.workspace.getConfiguration('quick-ssh-on-terminal').update('cmdList', this.config);
                }
            });
        };
    }

    async editTag (node: Dependency) {
        if (vscode.workspace.getWorkspaceFolder === undefined) {
            vscode.window.showErrorMessage("Please open a workspace first.");
            return;
        }
        let cmdList = this.getCmdList();
        if (cmdList === undefined) {
            return;
        }
        let index = cmdList.findIndex( (cmd) => {
            if (cmd['tag'] === node.label) {
                return true;
            }
        });
        if (this.config) {
            await vscode.window.showInputBox(
                {
                    prompt: "Please input tag",
                    placeHolder: node.label,
                    value: node.label
                },
            ).then(async (tag) => {
                if (tag !== undefined && this.config) {
                    this.config[index] = {
                        tag: tag,
                        cmd: cmdList[index]['cmd']
                    };
                    vscode.workspace.getConfiguration('quick-ssh-on-terminal').update('cmdList', this.config);
                }
            });
        };
    }
}