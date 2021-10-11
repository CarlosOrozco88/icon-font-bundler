import { workspace, Uri, Progress } from 'vscode';
import path from 'path';

import Generic from '../Generic';
import Utils from '../../Utils/Utils';
import assert from 'assert';
import { IconFontBundlerFontConfig, IconFontBundlerItem, Level } from '../../Types/Types';
import Log from '../../Utils/Log';

export default {
  async build(
    oFontOptions: IconFontBundlerFontConfig,
    oFontConfig: IconFontBundlerItem,
    progress?: Progress<any>,
    multiplier = 1
  ) {
    const { font } = oFontConfig;
    const sBaseUrl = 'https://raw.githubusercontent.com/twbs/icons/main/font/fonts/FILENAME.EXTENSION';

    let message = Log.bootstrap(`Downloading bootstrap icons from github...`);
    progress?.report({ increment: 10 * multiplier, message });

    const sFileName = 'bootstrap-icons';
    const aRemotePromises: Promise<Uint8Array>[] = [];
    oFontOptions.fontTypes?.forEach((sExtension) => {
      assert(['woff', 'woff2'].includes(sExtension), 'Bootstrap only provides woff and woff2 font types');
      const sUrl = sBaseUrl.replace('FILENAME', sFileName).replace('EXTENSION', sExtension);

      aRemotePromises.push(Utils.fetchFile(sUrl));
      Log.bootstrap(`Fetching ${sUrl}`);
    });

    const aFiles = await Promise.all(aRemotePromises);
    Log.bootstrap(`All files donwloaded successfully`, Level.SUCCESS);

    const aLocalPromises = [];

    message = Log.bootstrap(`Creating files...`);
    progress?.report({ increment: 10 * multiplier, message });

    oFontOptions.fontTypes?.forEach((sExtension, i) => {
      const sPathFont = path.join(oFontOptions.outputDir, `${oFontOptions.name}.${sExtension}`);
      const uri = Uri.file(sPathFont);
      aLocalPromises.push(workspace.fs.writeFile(uri, aFiles[i]));
      Log.bootstrap(`Creating file ${sPathFont} file...`);
    });
    Log.bootstrap(`All files created successfully`, Level.SUCCESS);

    message = Log.bootstrap(`Getting codepoints...`);
    progress?.report({ increment: 10 * multiplier, message });

    // Transform int10 to string16
    const sCodePointsUrl = 'https://raw.githubusercontent.com/twbs/icons/main/font/bootstrap-icons.json';
    const oCodePointsBuffer = await Utils.fetchFile(sCodePointsUrl);
    const oCodePointsString = oCodePointsBuffer.toString();
    const oCodePoints = JSON.parse(oCodePointsString);
    const oNewCodePoints: Record<string, string> = {};
    oFontOptions.codepoints = {};
    oFontOptions.assets = {};
    for (const code in oCodePoints) {
      oNewCodePoints[code] = oCodePoints[code].toString(16);
      oFontOptions.codepoints[code] = oCodePoints[code];
      oFontOptions.assets[code] = {
        id: code,
      };
    }
    const oNewCodePointsString = JSON.stringify(oNewCodePoints, null, 2);
    Log.bootstrap(`Codepoints generated succesfully`, Level.SUCCESS);

    const sPathCodePoints = path.join(oFontOptions.outputDir, `${oFontOptions.name}.json`);
    message = Log.bootstrap(`Writing codepoints...`);
    progress?.report({ increment: 10 * multiplier, message });
    await workspace.fs.writeFile(Uri.file(sPathCodePoints), Buffer.from(oNewCodePointsString));
    Log.bootstrap(`Codepoints file created`, Level.SUCCESS);

    await Generic.generateAssets(oFontOptions, oFontConfig, progress);
  },
};
