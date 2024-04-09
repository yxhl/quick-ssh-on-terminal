import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import SSHConfig from 'ssh-config';
import { sshCommandParser } from './sshCommandParser';
import { Dependency } from './dependency';
import { stringify } from 'querystring';

export class treeViewProvider implements vscode.TreeDataProvider<Dependency> {
    constructor(private sshConfigPath: string | undefined) {}
    private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | null | void> = new vscode.EventEmitter<Dependency | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | null | void> = this._onDidChangeTreeData.event;
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

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

        // var cmdjs = {hostname: '', port: '22', usr: ''};
        // if (this.sshConfigPath && node) {
        //     const config = SSHConfig.parse(fs.readFileSync(this.sshConfigPath, 'utf-8')).compute({ Host: `${node}` });
        //     cmdjs.hostname = config.Hostname.toString();
        //     cmdjs.usr = config.User.toString();
        //     if (config.Port === undefined) {
        //         cmdjs.port = '22';
        //     } else {
        //         cmdjs.port = config.Port.toString();
        //     }
        //     let cmd =  cmdjs.usr + '@' + cmdjs.hostname + ' -p ' + cmdjs.port;
        //     terminal.sendText(`ssh ${cmd}`);
        //     terminal.show();
        // }
        terminal.sendText(`ssh ${node}`);
        terminal.show();
        return Promise.resolve([]);
    }

    settingSshConfigPath(sshConfigPath: string) {
        this.sshConfigPath = sshConfigPath;
    }

    add() {
        if (!this.sshConfigPath) {
            vscode.window.showErrorMessage('Please select a config and try again.');
            return;
        }

        let a = vscode.window.showInputBox({
            placeHolder: 'root@host:port',
            prompt: 'Please input the ssh command'
        }).then(command => {
            if (command && this.sshConfigPath) {
                let sessJson = new sshCommandParser(command).parse();
                if (sessJson) {
                    const sshConfigContent = fs.readFileSync(this.sshConfigPath, 'utf-8');
                    const config = SSHConfig.parse(sshConfigContent);
                    config.append(sessJson);
                    fs.writeFileSync(this.sshConfigPath, SSHConfig.stringify(config));
                    this.refresh();
                }
            }
        });
    }

    openSshConfig() {
        if (this.sshConfigPath && fs.existsSync(this.sshConfigPath)) {
            vscode.window.showTextDocument(vscode.Uri.file(this.sshConfigPath));
        }
    }
}

