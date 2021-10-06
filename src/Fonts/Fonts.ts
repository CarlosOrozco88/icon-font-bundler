import { FontAssetType, OtherAssetType } from 'fantasticon';
import { window, workspace, Uri, ProgressLocation, QuickPickItem } from 'vscode';
import path from 'path';

import Utils from '../Utils/Utils';
import Log from '../Utils/Log';
import assert from 'assert';

import FontTypes from './types';
import { IconFontBundlerList, Level } from '../Types/Types';

export default {
  async askFontToGenerate() {
    let oFontConfig = undefined;

    try {
      let aConfigFiles = await Utils.getAllConfigFiles();

      let aFonts: IconFontBundlerList = [];
      let qpOptions = [];
      aConfigFiles.forEach((oFile) => {
        let { configFile, folderName } = oFile;
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
        let fontToGenerate: QuickPickItem = await new Promise(async (resolve, reject) => {
          let fontToGenerateQp = await window.createQuickPick();
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
        oFontConfig = aFonts.find((oFontApp) => {
          return `${oFontApp.font.name} from ${oFontApp.folderName}` == fontToGenerate.description;
        });
      }
    } catch (e) {
      oFontConfig = undefined;
    }
    try {
      await this.generateFont(oFontConfig);
    } catch (oError) {
      Log.general(oError.message, Level.ERROR);
      window.showErrorMessage(oError.message);
    }
  },

  async generateFont(oFontConfig) {
    let { font, baseFsPath, folderName } = oFontConfig;

    assert(!!font.type, `Property 'type' is mandatory`);
    assert(!!font.name, `Property 'name' is mandatory`);
    assert(!!font.outputDir, `Property 'outputDir' is mandatory`);

    let aDefaultAssetTypes = [OtherAssetType.HTML, OtherAssetType.CSS, OtherAssetType.JSON];
    font.assetTypes = font.assetTypes || aDefaultAssetTypes;
    assert(Array.isArray(font.assetTypes), `Property 'assetTypes' must be an array`);

    font.fontTypes = font.fontTypes || [FontAssetType.TTF, FontAssetType.EOT, FontAssetType.WOFF2, FontAssetType.WOFF];
    assert(Array.isArray(font.fontTypes), `Property 'fontTypes' must be an array`);

    let aExcluded = font.assetTypes.filter((sAsset) => {
      return !aDefaultAssetTypes.includes(sAsset);
    });
    assert(!aExcluded.length, `Property 'assetTypes' only accept ${aDefaultAssetTypes.toString()} values`);

    let sTemplatePath = path.resolve(Utils.getExtensionPath(), 'templates');
    let oFontOptions = {
      inputDir: path.join(baseFsPath, font.inputDir || ''),
      outputDir: path.join(baseFsPath, font.outputDir, font.name),
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

    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: `ui5-tools > Generating font ${oFontOptions.name}`,
        cancellable: true,
      },
      async (progress, token) => {
        progress?.report({ increment: 10, message: `Cleaning destination folder...` });

        let outputUri = Uri.file(oFontOptions.outputDir);
        try {
          await workspace.fs.delete(outputUri, {
            recursive: true,
            useTrash: true,
          });
        } catch (oError) {}

        progress?.report({ increment: 10, message: `Creating destination folder...` });
        await workspace.fs.createDirectory(outputUri);

        progress?.report({ increment: 30, message: `Generating folder...` });
        await this.generate(oFontOptions, oFontConfig, progress);
      }
    );

    window.showInformationMessage(`Font ${oFontOptions.name} generated in project ${folderName} at ${font.outputDir}`);
  },

  async generate(oFontOptions, oFontConfig, progress) {
    let { font } = oFontConfig;

    assert(FontTypes[font.type], `Property 'type' (${font.type}) is not supported`);

    let FontGenrator = FontTypes[font.type];
    await FontGenrator.build(oFontOptions, oFontConfig, progress);
  },

  generateAllFonts() {},
};
