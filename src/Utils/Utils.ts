import { workspace, RelativePattern, extensions, Uri } from 'vscode';
import path from 'path';
import https from 'https';
import http from 'http';

import Log from './Log';
import { IconFontBundlerFileDataArray, IconFontBundlerFileData } from '../Types/Types';

export const CONFIG_FILE_NAME = 'icon-font-bundler.json';

const Utils = {
  async getAllConfigFiles(): Promise<IconFontBundlerFileDataArray> {
    const aWorkspacesPromises = [];
    const workspaceFolders = workspace.workspaceFolders || [];

    for (const wsUri of workspaceFolders) {
      const oWorkspacePromise = workspace.findFiles(
        new RelativePattern(wsUri, `**/${CONFIG_FILE_NAME}`),
        new RelativePattern(wsUri, `**/{node_modules,.git}/`)
      );
      aWorkspacesPromises.push(oWorkspacePromise);
    }
    const aWorkspaces = await Promise.all(aWorkspacesPromises);

    const aPaths: Set<string> = new Set();
    aWorkspaces.forEach((aFilesWorkspace) => {
      aFilesWorkspace.forEach((oUri) => {
        aPaths.add(oUri.fsPath);
      });
    });

    const aFilesPromises: Array<Promise<IconFontBundlerFileData>> = [];
    aPaths.forEach((sFsPath) => {
      aFilesPromises.push(this.getConfigFile(sFsPath));
    });

    const aFiles = await Promise.all(aFilesPromises);

    Log.general(`${aFiles.length} config files found!`);

    return aFiles;
  },

  async getConfigFile(fsPath: string): Promise<IconFontBundlerFileData> {
    let configFile = undefined;
    if (fsPath) {
      const oRawConfigFile = await workspace.fs.readFile(Uri.file(fsPath));
      configFile = JSON.parse(oRawConfigFile.toString());
    }

    const fileData: IconFontBundlerFileData = {
      configFile,
      fsPath,
      baseFsPath: fsPath.replace(CONFIG_FILE_NAME, ''),
      folderName: fsPath.replace(this.getWorkspaceRootPath(), '').replace(CONFIG_FILE_NAME, ''),
    };
    return fileData;
  },

  getWorkspaceRootPath() {
    let baseDirWorkspace = '';
    const workspaceFileUri = workspace.workspaceFile;
    if (workspaceFileUri) {
      baseDirWorkspace = path.dirname(workspaceFileUri.fsPath);
    } else {
      // only 1 workspace folder
      const workspaceFolders = workspace.workspaceFolders || [];
      baseDirWorkspace = workspaceFolders[0]?.uri?.fsPath || '';
    }
    return baseDirWorkspace;
  },

  getExtensionInfo() {
    return extensions.getExtension('carlosorozcojimenez.icon-font-bundler');
  },

  getExtensionPath(): string {
    return Utils.getExtensionInfo()?.extensionUri.fsPath || '';
  },

  async fetchFile(url: string, options = { timeout: 5000 }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const splitted = url.split('://');
      if (splitted.length > 1) {
        splitted[1] = splitted[1].split('//').join('/');
      }
      url = splitted.join('://');

      let httpModule;
      if (url.indexOf('https') == 0) {
        httpModule = https;
      } else {
        httpModule = http;
      }
      httpModule
        .get(url, options, (res) => {
          if (res.statusCode !== 200) {
            reject();
          } else {
            const aData: Uint8Array[] = [];
            res.on('data', (chunk) => {
              aData.push(chunk);
            });
            res.on('end', () => {
              try {
                resolve(Buffer.concat(aData));
              } catch (e: any) {
                reject(e.message);
              }
            });
          }
        })
        .on('error', (e) => {
          reject(e);
        });
    });
  },
};

export default Utils;
