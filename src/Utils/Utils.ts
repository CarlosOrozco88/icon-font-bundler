import { workspace, RelativePattern, extensions, Uri } from 'vscode';
import path from 'path';
import https from 'https';
import http from 'http';

import Log from './Log';
import { IconFontBundlerFileArray, IconFontBundlerFileData } from '../Types/Types';

const CONFIG_FILE_NAME = 'icon-font-bundler.json';

const Utils = {
  async getAllConfigFiles(): Promise<IconFontBundlerFileData[]>{
    let aWorkspacesPromises = [];

    for (let wsUri of workspace.workspaceFolders) {
      let oWorkspacePromise = workspace.findFiles(
        new RelativePattern(wsUri, `**/icon-font-bundler.json`),
        new RelativePattern(wsUri, `**/{node_modules,.git}/`)
      );
      aWorkspacesPromises.push(oWorkspacePromise);
    }
    let aWorkspaces = await Promise.all(aWorkspacesPromises);

    let aPaths = new Set();
    aWorkspaces.forEach((aFilesWorkspace) => {
      aFilesWorkspace.forEach((oUri) => {
        aPaths.add(oUri.fsPath);
      });
    });

    let aFilesPromises = [];
    aPaths.forEach((sFsPath) => {
      aFilesPromises.push(this.getConfigFile(sFsPath));
    });

    let aFiles = await Promise.all(aFilesPromises);

    Log.general(`${aFiles.length} config files found!`);

    return aFiles;
  },

  async getConfigFile(sFsPath): Promise<IconFontBundlerFileData> {
    let oConfigFile: IconFontBundlerFileArray;
    if (sFsPath) {
      try {
        let oRawConfigFile = await workspace.fs.readFile(Uri.file(sFsPath));
        oConfigFile = JSON.parse(oRawConfigFile.toString());
      } catch (oError) {
        throw oError
      }
    }

    return {
      configFile: oConfigFile,
      fsPath: sFsPath,
      baseFsPath: sFsPath.replace(CONFIG_FILE_NAME, ''),
      folderName: sFsPath.replace(this.getWorkspaceRootPath(), '').replace(CONFIG_FILE_NAME, ''),
    };
  },

  getWorkspaceRootPath() {
    let baseDirWorkspace = '';
    let workspaceFileUri = workspace.workspaceFile;
    if (workspaceFileUri) {
      baseDirWorkspace = path.dirname(workspaceFileUri.fsPath);
    } else {
      // only 1 workspace folder
      let workspaceFolders = workspace.workspaceFolders;
      baseDirWorkspace = workspaceFolders[0].uri.fsPath;
    }
    return baseDirWorkspace;
  },

  getExtensionInfo() {
    return extensions.getExtension('carlosorozcojimenez.icon-font-bundler');
  },

  getExtensionPath() {
    return Utils.getExtensionInfo().extensionUri.fsPath;
  },

  async fetchFile(url: string, options = { timeout: 5000 }): Promise<string> {
    return new Promise((resolve, reject) => {
      url = url.split('//').join('/');

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
            let rawData = '';
            res.on('data', (chunk) => {
              rawData += chunk;
            });
            res.on('end', () => {
              try {
                resolve(rawData);
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
