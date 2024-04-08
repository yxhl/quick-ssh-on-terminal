import path from 'path';
import * as vscode from 'vscode';
import { treeViewProvider } from './treeDataProvider';
import * as os from 'os';
import * as fs from 'fs';
import SSHConfig from 'ssh-config';

export class sshCommandParser {
	constructor(private command: string) { }
	parse(): {} | null {
		var usernameHostPort: string;
		if (this.command.includes('ssh')) {
			// ssh user@host:port
			usernameHostPort = this.command.split(' ')[1];
		} else {
			// user@host:port
			usernameHostPort = this.command.split(' ')[0];
		}
		if (!usernameHostPort.includes('@')) {
			return null; // 非法格式
		}

		const [username, hostAndPort] = usernameHostPort.split('@');
		const [host, portStr] = hostAndPort.split('-p');

		let port: number | undefined = undefined;
		if (portStr !== '' && portStr !== undefined) {
			const parsedPort = parseInt(portStr, 10);
			if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
				vscode.window.showErrorMessage(`Invalid port number: ${portStr}`);
				return null; // 非法端口
			}
			port = parsedPort;
		} else {
			port = 22;
		}

		return {
			Host: usernameHostPort,
			Hostname: host,
			User: username,
			Port: port,
		};
	}
}