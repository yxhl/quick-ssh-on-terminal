// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import path from 'path';
import * as vscode from 'vscode';
import { treeViewProvider } from './treeDataProvider';
import * as os from 'os';
import * as fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

function findSSHConfigPaths(): string[] {
    const homeDir = os.homedir();
    const sshConfigPaths = [
        path.join(homeDir, '.ssh', 'config'),
        path.join(homeDir, '.ssh', 'config.d', '*.conf') // Include additional patterns if needed
    ];

    return sshConfigPaths;
}

function locationSSHConfigPath(): string|undefined {
    let rootPath: string|undefined;
    const sshConfigPaths = findSSHConfigPaths();
    sshConfigPaths.forEach(sshConfigPath => {
        try {
            const sshConfigContent = fs.readFileSync(sshConfigPath, 'utf-8');
            if (sshConfigContent.includes('Host')) {
                rootPath = sshConfigPath;
                return rootPath;
            };
        } catch (error) {
            // console.warn(`Error reading ${sshConfigPath}: ${error}`);
        }
    });
    return rootPath;
}
export function activate(context: vscode.ExtensionContext) {

    let rootPath = locationSSHConfigPath();
    if (rootPath !== undefined) {
        const sshHereTreeViewProvider = new treeViewProvider(rootPath);

        context.subscriptions.push(vscode.commands.registerCommand('quick-ssh-on-terminal.clickconnect', args => {
            if (args.label !== undefined) {
                sshHereTreeViewProvider.sshConnectAction(args.label);
            } else {
                vscode.window.showErrorMessage('No SSH host selected.');
            }
        }));

        context.subscriptions.push(vscode.window.registerTreeDataProvider('quick-ssh-on-terminal', sshHereTreeViewProvider));
    } else {
        vscode.window.showErrorMessage('No SSH config file found.');
    }
}

// This method is called when your extension is deactivated
export function deactivate() {}
