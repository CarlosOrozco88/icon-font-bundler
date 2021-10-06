import { generateFonts } from 'fantasticon';
import { workspace, Uri } from 'vscode';
import path from 'path';
import assert from 'assert';

export default {
  async build(oFontOptions, oFontConfig, progress) {
    try {
      assert(!!oFontOptions.inputDir, `Property 'inputDir' is mandatory`);

      progress?.report({ increment: 30, message: `Generating font with fontasticon...` });
      let sIcons = await generateFonts(oFontOptions);

      progress?.report({ increment: 10, message: `Writing codepoints...` });
      // Transform int10 to string16
      let oCodePointsUri = Uri.file(path.join(oFontOptions.outputDir, `${oFontOptions.name}.json`));
      let oCodePointsBuffer = await workspace.fs.readFile(oCodePointsUri);
      let oCodePointsString = oCodePointsBuffer.toString();
      let oCodePoints = JSON.parse(oCodePointsString);
      let oNewCodePoints = {};
      for (let code in oCodePoints) {
        oNewCodePoints[code] = oCodePoints[code].toString(16);
      }
      let oNewCodePointsString = JSON.stringify(oNewCodePoints, null, 2);
      await workspace.fs.writeFile(oCodePointsUri, Buffer.from(oNewCodePointsString));
    } catch (oError) {
      console.error(oError);
    }
  },
};
