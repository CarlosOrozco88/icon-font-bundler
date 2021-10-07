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
    assert(font.family, `Property 'family' [solid|regular|brands] is mandatory`);
    assert(['solid', 'regular', 'brands'].includes(font.family), `Property 'family' must match [solid|regular|brands]`);

    const oFileNames: Record<string, string> = {
      solid: 'fa-solid-900',
      regular: 'fa-regular-400',
      brands: 'fa-brands-400',
    };

    const sFileName = oFileNames[font.family];
    const sBaseUrl = 'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/master/FOLDER/FILENAME.EXTENSION';

    let message = Log.fontawesome(`Downloading fontawesome from github...`);
    progress?.report({ increment: 10, message });

    const aRemotePromises: Promise<Uint8Array>[] = [];
    oFontOptions.fontTypes?.forEach((sExtension) => {
      const sUrl = sBaseUrl
        .replace('FOLDER', 'webfonts')
        .replace('FILENAME', sFileName)
        .replace('EXTENSION', sExtension);

      aRemotePromises.push(Utils.fetchFile(sUrl));
      Log.fontawesome(`Fetching ${sUrl}`);
    });

    const aFiles = await Promise.all(aRemotePromises);
    Log.fontawesome(`All files donwloaded successfully`, Level.SUCCESS);

    const aLocalPromises = [];

    message = Log.fontawesome(`Creating files...`);
    progress?.report({ increment: 10, message });

    oFontOptions.fontTypes?.forEach((sExtension, i) => {
      const sPathFont = path.join(oFontOptions.outputDir, `${oFontOptions.name}.${sExtension}`);
      const uri = Uri.file(sPathFont);
      aLocalPromises.push(workspace.fs.writeFile(uri, aFiles[i]));
      Log.fontawesome(`Creating file ${sPathFont} file...`);
    });
    Log.fontawesome(`All files created successfully`, Level.SUCCESS);

    message = Log.fontawesome(`Creating codepoints...`);
    progress?.report({ increment: 10, message });

    const sCodePointsUrl = sBaseUrl
      .replace('FOLDER', 'metadata')
      .replace('FILENAME', 'icons')
      .replace('EXTENSION', 'json');
    const oCodePointsBuffer = await Utils.fetchFile(sCodePointsUrl);
    const sCodePoints = oCodePointsBuffer.toString();
    const oCodePointsRaw = JSON.parse(sCodePoints);
    const oCodePoints: Record<string, string> = {};
    oFontOptions.codepoints = {};
    oFontOptions.assets = {};
    for (const sIconCode in oCodePointsRaw) {
      const oIcon = oCodePointsRaw[sIconCode];
      if (oIcon.styles.indexOf(font.family) >= 0) {
        oCodePoints[sIconCode] = oIcon.unicode;
        oFontOptions.codepoints[sIconCode] = parseInt(oIcon.unicode, 16);
        oFontOptions.assets[sIconCode] = {
          id: sIconCode,
        };
      }
    }
    const sPathCodePoints = path.join(oFontOptions.outputDir, `${oFontOptions.name}.json`);
    const sNewCodepoints = JSON.stringify(oCodePoints, null, 2);
    Log.fontawesome(`Codepoints created`, Level.SUCCESS);

    message = Log.fontawesome(`Writing codepoints...`);
    progress?.report({ increment: 10, message });
    await workspace.fs.writeFile(Uri.file(sPathCodePoints), Buffer.from(sNewCodepoints));
    Log.fontawesome(`Codepoints file created`, Level.SUCCESS);

    await Generic.generateAssets(oFontOptions, oFontConfig, progress);
  },
};
