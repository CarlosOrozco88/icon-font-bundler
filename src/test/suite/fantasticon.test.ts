import { workspace, RelativePattern, Uri } from 'vscode';
import * as assert from 'assert';
import * as path from 'path';

import Fonts from '../../Fonts/Fonts';
import Utils, { CONFIG_FILE_NAME } from '../../Utils/Utils';

const fantasticonFilePath = path.resolve(__dirname, '../../../test/fantasticon/', CONFIG_FILE_NAME);

suite('Fantasticon tests', () => {
  test('Standard build', async () => {
    const uriConfigFile: Uri = Uri.parse(fantasticonFilePath);

    const fantasticonFile = await Utils.getConfigFile(uriConfigFile.fsPath);

    assert(fantasticonFile.configFile.length >= 1);

    const font = {
      ...fantasticonFile,
      font: fantasticonFile.configFile[0],
    };

    Fonts.generateFont(font);
    assert(true);
  });
});
