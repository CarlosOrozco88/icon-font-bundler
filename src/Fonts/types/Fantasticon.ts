import { generateFonts } from '@twbs/fantasticon';
import { workspace, Uri, Progress } from 'vscode';
import path from 'path';
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
    assert(!!oFontOptions.inputDir, `Property 'inputDir' is mandatory`);

    let message = Log.fantasticon(`Generating font with fantasticon...`);
    progress?.report({ increment: 30 * multiplier, message });
    const oFantasticonOptions: any = { ...oFontOptions };
    delete oFantasticonOptions.type;
    await generateFonts(oFantasticonOptions);
    Log.fantasticon(`Fontfiles generated succesfully`, Level.SUCCESS);

    message = Log.fantasticon(`Writing codepoints...`);
    progress?.report({ increment: 10 * multiplier, message: message });
    // Transform int10 to string16
    const oCodePointsUri = Uri.file(path.join(oFontOptions.outputDir, `${oFontOptions.name}.json`));
    const oCodePointsBuffer = await workspace.fs.readFile(oCodePointsUri);
    const oCodePointsString = oCodePointsBuffer.toString();
    const oCodePoints = JSON.parse(oCodePointsString);
    const oNewCodePoints: Record<string, string> = {};
    for (const code in oCodePoints) {
      oNewCodePoints[code] = oCodePoints[code].toString(16);
    }
    const oNewCodePointsString = JSON.stringify(oNewCodePoints, null, 2);
    Log.fantasticon(`Codepoints generated succesfully`, Level.SUCCESS);

    Log.fantasticon(`Writing codepoints file...`);
    await workspace.fs.writeFile(oCodePointsUri, Buffer.from(oNewCodePointsString));
    Log.fantasticon(`Codepoints writed succesfully`, Level.SUCCESS);
  },
};
