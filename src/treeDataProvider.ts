import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import SSHConfig from 'ssh-config';

export class treeViewProvider implements vscode.TreeDataProvider<Dependency> {
    constructor(private sshConfigPath: string) { }

    getTreeItem(element: Dependency): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Dependency): Thenable<Dependency[]> {
        if (!this.sshConfigPath) {
            vscode.window.showInformationMessage('No dependency in empty workspace');
            return Promise.resolve([]);
        }

        // Read sshConfig file, and set Host as tree item name
        // const sshConfigContent = fs.readFileSync(this.sshConfigPath, 'utf-8');
        if (element) {

        } else {
            let hostItems: any[] = [];
            const sshConfigContent = fs.readFileSync(this.sshConfigPath, 'utf-8');
            SSHConfig.parse(sshConfigContent).forEach(
                line => {
                    if ('param' in line && 'value' in line) {
                        if (line.param === 'Host') {
                            if (typeof line.value === 'string') {
                                const host = line.value;
                                const hostItem = new Dependency(host, '', vscode.TreeItemCollapsibleState.None);
                                hostItem.tooltip = `${host}`;
                                hostItems.push(hostItem);
                            }
                        }
                    }
            });
            return Promise.resolve(hostItems);
        }


        return Promise.resolve([]);
    }

    sshConnectAction(node: Dependency) {
        vscode.window.showInformationMessage(`Connect to ${node}`);
        const config = vscode.workspace.getConfiguration('quick-ssh-on-terminal');
        const openSSHInEditor = config.get<boolean>('openSSHInEditor', false);
        const terminalName = `${node}`;

        const terminal = vscode.window.createTerminal(
            {
                name: terminalName,
                location: openSSHInEditor ?
                    vscode.TerminalLocation.Editor : vscode.TerminalLocation.Panel,
                isTransient: true,
            }
        );

        terminal.sendText(`ssh ${node}`);
        terminal.show();
        return Promise.resolve([]);
    }
}

class Dependency extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private version: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}-${this.version}`;
        this.description = this.version;
    }

    iconPath = new vscode.ThemeIcon('server');
}