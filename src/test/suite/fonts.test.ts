import assert from 'assert';
import path from 'path';
import fs from 'fs';

import Fonts from '../../Fonts/Fonts';
import { CONFIG_FILE_NAME } from '../../Utils/Utils';
import { IconFontBundlerConfigFile, IconFontBundlerItem } from '../../Types/Types';

const pathTest = path.resolve(__dirname, '../../../test/');

suite('Generating fonts', () => {
  const pathTestConfig = path.resolve(pathTest, CONFIG_FILE_NAME);
  if (fs.statSync(pathTestConfig).isFile()) {
    const testConfigFile: IconFontBundlerConfigFile = JSON.parse(fs.readFileSync(pathTestConfig).toString());

    testConfigFile.forEach((fontConfig) => {
      const fontFile: IconFontBundlerItem = {
        configFile: testConfigFile,
        fsPath: pathTestConfig,
        baseFsPath: pathTest,
        folderName: 'test',
        font: fontConfig,
      };
      test(`Generating font ${fontConfig.name}`, async () => {
        const font = {
          ...fontFile,
          font: fontConfig,
        };

        await Fonts.generateFont(font);

        const filesExpectedUri = path.resolve(pathTest, fontConfig.outputDir.replace('created', 'expected'));
        const filesCreatedUri = path.resolve(pathTest, fontConfig.outputDir);

        const filesExpected = fs.readdirSync(filesExpectedUri);
        const filesCreated = fs.readdirSync(filesCreatedUri);

        // Check the same files quantity
        assert(filesExpected.length === filesCreated.length);

        for (let i = 0; i < filesExpected.length; i++) {
          const fileNameExpected = filesExpected[i];

          // Check for the same file name
          assert(filesCreated.includes(fileNameExpected));

          const fileExpected = fs.readFileSync(path.resolve(filesExpectedUri, fileNameExpected));
          const fileCreated = fs.readFileSync(path.resolve(filesCreatedUri, fileNameExpected));

          // Check same content
          assert.strictEqual(fileCreated.toString(), fileExpected.toString());
        }
      });
    });
  }
});
