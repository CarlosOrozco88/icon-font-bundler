import { workspace, Uri } from 'vscode';
import path from 'path';

import Generic from '../Generic';
import Utils from '../../Utils/Utils';
import assert from 'assert';

export default {
  async build(oFontOptions, oFontConfig, progress) {
    let { font } = oFontConfig;
    assert(font.family, `Property 'family' [solid|regular|brands] is mandatory`);
    assert(['solid', 'regular', 'brands'].includes(font.family), `Property 'family' must match [solid|regular|brands]`);

    let oFileNames = {
      solid: 'fa-solid-900',
      regular: 'fa-regular-400',
      brands: 'fa-brands-400',
    };

    let sFileName = oFileNames[font.family];
    let sBaseUrl = 'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/master/FOLDER/FILENAME.EXTENSION';

    progress?.report({ increment: 10, message: `Downloading fontawesome from github...` });
    let aRemotePromises = [];
    oFontOptions.fontTypes.forEach((sExtension) => {
      let sUrl = sBaseUrl.replace('FOLDER', 'webfonts').replace('FILENAME', sFileName).replace('EXTENSION', sExtension);

      aRemotePromises.push(Utils.fetchFile(sUrl));
    });

    let aFiles = await Promise.all(aRemotePromises);
    let aLocalPromises = [];

    progress?.report({ increment: 10, message: `Renaming font...` });
    oFontOptions.fontTypes.forEach((sExtension, i) => {
      let sPathFont = path.join(oFontOptions.outputDir, `${oFontOptions.name}.${sExtension}`);
      aLocalPromises.push(workspace.fs.writeFile(Uri.file(sPathFont), aFiles[i]));
    });

    progress?.report({ increment: 10, message: `Creating codepoints...` });
    let sCodePointsUrl = sBaseUrl
      .replace('FOLDER', 'metadata')
      .replace('FILENAME', 'icons')
      .replace('EXTENSION', 'json');
    let oCodePointsBuffer = await Utils.fetchFile(sCodePointsUrl);
    let sCodePoints = oCodePointsBuffer.toString();
    let oCodePointsRaw = JSON.parse(sCodePoints);
    let oCodePoints = {};
    oFontOptions.codepoints = {};
    oFontOptions.assets = {};
    for (let sIconCode in oCodePointsRaw) {
      let oIcon = oCodePointsRaw[sIconCode];
      if (oIcon.styles.indexOf(font.family) >= 0) {
        oCodePoints[sIconCode] = oIcon.unicode;
        oFontOptions.codepoints[sIconCode] = parseInt(oIcon.unicode, 16);
        oFontOptions.assets[sIconCode] = {
          id: sIconCode,
        };
      }
    }
    let sPathCodePoints = path.join(oFontOptions.outputDir, `${oFontOptions.name}.json`);
    let sNewCodepoints = JSON.stringify(oCodePoints, null, 2);
    await workspace.fs.writeFile(Uri.file(sPathCodePoints), Buffer.from(sNewCodepoints));

    progress?.report({ increment: 10, message: `Generating assets...` });
    await Generic.generateAssets(oFontOptions, oFontConfig);
  },
};
