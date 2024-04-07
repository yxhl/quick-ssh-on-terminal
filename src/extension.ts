// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import path from 'path';
import * as vscode from 'vscode';
import { treeViewProvider } from './treeDataProvider';
import * as os from 'os';
import * as fs from 'fs';
import SSHConfig from 'ssh-config';

const qsotTreeViewProvider = new treeViewProvider(undefined);
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
export async function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('quick-ssh-on-terminal.setting', () => {
		settingSshPath(context);
	}));
	activateTreeViewProvider(context);

	let rootPath = locationSSHConfigPath();
	if (rootPath === undefined) {
		settingSshPath(context);
	} else {
		qsotTreeViewProvider.settingSshConfigPath(rootPath);
	}

	return;
}

// This method is called when your extension is deactivated
export function deactivate() {}

async function settingSshPath(context: vscode.ExtensionContext): Promise<string | undefined> {
	await vscode.window.showQuickPick(
		[
			{
				label: path.join(os.homedir(), '.ssh', 'config'),
				description: 'Default path'
			},
			{
				label: path.join(os.homedir(), '.ssh', 'config.d', 'qsot.config'),
				description: 'QSOT default path'
			},
			// {
			// 	label: 'Custom',
			// 	description: 'Please input the ssh config file path'
			// }
		],
		{
			placeHolder: 'Please select the ssh config file path'
		}
	).then(async (selected) => {
		if (selected?.label === 'Custom') {
			vscode.window.showInputBox({
				placeHolder: 'Please input the ssh config file path'
			}).then(async (value) => {
				if (value && fs.existsSync(value)) {
					this.qsotTreeViewProvider.settingSshConfigPath(value);
					return selected?.label;
				}
			});
		} else {
			if (selected?.label && !fs.existsSync(selected?.label)) {
				fs.mkdirSync(path.dirname(selected?.label));
				fs.writeFileSync(selected?.label, '');
			}
			if (selected?.label) {
				qsotTreeViewProvider.settingSshConfigPath(selected?.label);
				qsotTreeViewProvider.refresh();
			}
			return selected?.label;
		}
		return undefined;
	});
	return undefined;
}

function activateTreeViewProvider(context: vscode.ExtensionContext): treeViewProvider {
	context.subscriptions.push(vscode.commands.registerCommand('quick-ssh-on-terminal.refresh', () => 
		qsotTreeViewProvider.refresh())
	);

	context.subscriptions.push(vscode.commands.registerCommand('quick-ssh-on-terminal.add', () => 
		qsotTreeViewProvider.add())
	);

	context.subscriptions.push(vscode.commands.registerCommand('quick-ssh-on-terminal.clickconnect', args => {
		if (args.label !== undefined) {
			qsotTreeViewProvider.sshConnectAction(args.label);
		} else {
			vscode.window.showErrorMessage('No SSH host selected.');
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('quick-ssh-on-terminal.openSshConfig', () => {
		qsotTreeViewProvider.openSshConfig();
	}));

	context.subscriptions.push(vscode.window.registerTreeDataProvider('quick-ssh-on-terminal', qsotTreeViewProvider));
	return qsotTreeViewProvider;
}

function expect(config: any) {
	throw new Error('Function not implemented.');
}
