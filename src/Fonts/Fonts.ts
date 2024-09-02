import { FontAssetType, OtherAssetType } from '@twbs/fantasticon';
import { window, workspace, Uri, ProgressLocation, QuickPickItem, Progress, RelativePattern } from 'vscode';
import path from 'path';
import fs from 'fs';

import Utils from '../Utils/Utils';
import { CONFIG_FILE_NAME } from '../Utils/Utils';
import Log from '../Utils/Log';
import assert from 'assert';

import FontTypes from './types';
import { IconFontBundlerFontConfig, IconFontBundlerItem, IconFontBundlerList, Level } from '../Types/Types';

export default {
  async askFontToGenerate() {
    let oFontConfig: IconFontBundlerItem;

    try {
      const aConfigFiles = await Utils.getAllConfigFiles();

      let aFonts: IconFontBundlerList = [];
      const qpOptions: Array<QuickPickItem> = [];
      aConfigFiles.forEach((oFile) => {
        const { configFile, folderName } = oFile;
        aFonts = aFonts.concat(
          configFile.map((font) => {
            qpOptions.push({
              label: `${font.name} | ${font.type}`,
              description: `${font.name} from ${folderName}`,
            });
            return {
              ...oFile,
              font: font,
            };
          })
        );
      });

      if (aFonts.length >= 1) {
        const fontToGenerate: QuickPickItem = await new Promise(async (resolve, reject) => {
          const fontToGenerateQp = await window.createQuickPick();
          fontToGenerateQp.title = 'Icon Font Bundler > Select font';
          fontToGenerateQp.items = qpOptions;
          fontToGenerateQp.placeholder = 'Select font to generate';
          fontToGenerateQp.canSelectMany = false;
          fontToGenerateQp.onDidAccept(async () => {
            if (fontToGenerateQp.selectedItems.length) {
              resolve(fontToGenerateQp.selectedItems[0]);
            } else {
              reject('No font selected');
            }
            fontToGenerateQp.hide();
          });
          fontToGenerateQp.show();
        });
        // fspath from selected project
        const selectedFont = aFonts.find((oFontApp) => {
          return `${oFontApp.font.name} from ${oFontApp.folderName}` == fontToGenerate.description;
        });

        if (selectedFont) {
          oFontConfig = selectedFont;
        } else {
          throw new Error(`No ${CONFIG_FILE_NAME} config files found`);
        }

        await window.withProgress(
          {
            location: ProgressLocation.Notification,
            title: `Icon Font Bundler > Generating font ${oFontConfig.font.name}`,
            cancellable: true,
          },
          async (progress) => {
            await this.generateFont(oFontConfig, progress);
            window.showInformationMessage(`Font ${oFontConfig.font.name} generated successfully`);
          }
        );
      }
    } catch (oError: any) {
      Log.general(oError.message, Level.ERROR);
      window.showErrorMessage(oError.message);
    }
  },

  async generateAllFonts() {
    try {
      const aConfigFiles = await Utils.getAllConfigFiles();
      assert(aConfigFiles.length > 0, `No ${CONFIG_FILE_NAME} config files found`);

      let aFonts: IconFontBundlerList = [];
      aConfigFiles.forEach((oFile) => {
        const { configFile } = oFile;
        aFonts = aFonts.concat(
          configFile.map((font) => {
            return {
              ...oFile,
              font: font,
            };
          })
        );
      });

      assert(aFonts.length > 0, `No fonts found in any ${CONFIG_FILE_NAME} config file`);

      await window.withProgress(
        {
          location: ProgressLocation.Notification,
          title: `Icon Font Bundler > Generating all fonts`,
          cancellable: true,
        },
        async (progress) => {
          const multiplier = 1 / aFonts.length;
          for (const oFontConfig of aFonts) {
            await this.generateFont(oFontConfig, progress, multiplier);
          }
          window.showInformationMessage(`All font bundles generated successfully`);
        }
      );
    } catch (oError: any) {
      Log.general(oError.message, Level.ERROR);
      window.showErrorMessage(oError.message);
    }
  },

  async generateFont(oFontConfig: IconFontBundlerItem, progress?: Progress<any>, multiplier = 1) {
    const { font, baseFsPath } = oFontConfig;

    assert(!!font.type, `Property 'type' is mandatory`);
    assert(!!font.name, `Property 'name' is mandatory`);
    assert(!!font.outputDir, `Property 'outputDir' is mandatory`);

    const aDefaultAssetTypes = [OtherAssetType.HTML, OtherAssetType.CSS, OtherAssetType.JSON];
    font.assetTypes = font.assetTypes || aDefaultAssetTypes;
    assert(Array.isArray(font.assetTypes), `Property 'assetTypes' must be an array`);

    font.fontTypes = font.fontTypes || [FontAssetType.TTF, FontAssetType.EOT, FontAssetType.WOFF2, FontAssetType.WOFF];
    assert(Array.isArray(font.fontTypes), `Property 'fontTypes' must be an array`);

    const aExcluded = font.assetTypes.filter((sAsset) => {
      return !aDefaultAssetTypes.includes(sAsset);
    });
    assert(!aExcluded.length, `Property 'assetTypes' only accept ${aDefaultAssetTypes.toString()} values`);

    const sTemplatePath = path.resolve(Utils.getExtensionPath(), 'templates');
    const oFontOptions: IconFontBundlerFontConfig = {
      inputDir: path.resolve(baseFsPath, font.inputDir || ''),
      outputDir: path.resolve(baseFsPath, font.outputDir),
      type: font.type,
      name: font.name,
      fontTypes: font.fontTypes,
      assetTypes: font.assetTypes,
      formatOptions: font.formatOptions || {},
      templates: {
        css: font.templates?.css || path.join(sTemplatePath, 'css.hbs'),
        html: font.templates?.html || path.join(sTemplatePath, 'html.hbs'),
      },
      // pathOptions: {},
      codepoints: font.codepoints || {},
      fontHeight: font.fontHeight || 300,
      round: font.round || 10e12,
      descent: font.descent || 0,
      normalize: font.normalize || false,
      selector: font.selector || '',
      tag: font.tag || 'i',
      prefix: font.prefix || 'icon',
      fontsUrl: font.fontsUrl || '',
    };

    await this.createFolder(oFontOptions, oFontConfig, progress, multiplier);
    await this.cleanFolder(oFontOptions, oFontConfig, progress, multiplier);
    await this.buildFont(oFontOptions, oFontConfig, progress, multiplier);

    Log.fonts(`Font ${oFontOptions.name} generated at successfully ${oFontOptions.outputDir}`, Level.SUCCESS);
  },

  async cleanFolder(
    oFontOptions: IconFontBundlerFontConfig,
    oFontConfig: IconFontBundlerItem,
    progress?: Progress<any>,
    multiplier = 1
  ) {
    let message = '';
    message = Log.fonts(`Cleaning destination folder...`);
    progress?.report({ increment: 10 * multiplier, message });

    const outputUri = Uri.file(oFontOptions.outputDir);

    const aFiles = await workspace.findFiles(new RelativePattern(outputUri, `${oFontOptions.name}.*`));
    for (const file of aFiles) {
      await workspace.fs.delete(file, {
        useTrash: true,
      });
    }
    message = aFiles.length ? `Destination folder cleaned successfully` : `Destination folder is already clean`;
    Log.fonts(message, Level.SUCCESS);
  },

  async createFolder(
    oFontOptions: IconFontBundlerFontConfig,
    oFontConfig: IconFontBundlerItem,
    progress?: Progress<any>,
    multiplier = 1
  ) {
    const message = Log.fonts(`Creating destination folder...`);
    progress?.report({ increment: 10 * multiplier, message });
    if (!fs.existsSync(oFontOptions.outputDir)) {
      const outputUri = Uri.file(oFontOptions.outputDir);
      await workspace.fs.createDirectory(outputUri);
      Log.fonts(`Destination folder created successfully`, Level.SUCCESS);
    } else {
      Log.fonts(`Destination folder already exists`, Level.SUCCESS);
    }
  },

  async buildFont(
    oFontOptions: IconFontBundlerFontConfig,
    oFontConfig: IconFontBundlerItem,
    progress?: Progress<any>,
    multiplier = 1
  ) {
    const { font } = oFontConfig;

    assert(FontTypes[font.type], `Property 'type' (${font.type}) is not supported`);

    const message = Log.fonts(`Begin font generation...`);
    progress?.report({ increment: 30 * multiplier, message });
    const FontGenerator = FontTypes[font.type];
    await FontGenerator.build(oFontOptions, oFontConfig, progress, multiplier);
  },
};
