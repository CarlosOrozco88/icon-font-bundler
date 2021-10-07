import { FontAssetType } from 'fantasticon';
import { workspace, Uri, Progress } from 'vscode';
import path from 'path';
import fs from 'fs';

import Handlebars from 'handlebars';
import { IconFontBundlerFontConfig, IconFontBundlerItem } from '../Types/Types';
import Log from '../Utils/Log';

export default {
  async generateAssets(
    oFontOptions: IconFontBundlerFontConfig,
    oFontConfig: IconFontBundlerItem,
    progress?: Progress<any>,
    multiplier = 1
  ) {
    const message = Log.fonts(`Generating assets...`);
    progress?.report({ increment: 10 * multiplier, message });

    const templates: any = oFontOptions.templates || {};
    oFontOptions.assetTypes?.forEach(async (sExtension) => {
      const sTemplatePath = templates[sExtension];
      if (sTemplatePath) {
        const sTemplate = fs.readFileSync(sTemplatePath, { encoding: 'utf8' });

        try {
          const sFile = Handlebars.compile(sTemplate)(oFontOptions, {
            helpers: {
              // @ts-ignore
              fontSrc: this.renderSrcAttribute(oFontOptions),
              codepoint(codepoint: any) {
                return codepoint.toString(16);
              },
            },
          });
          const oCodePointsUri = Uri.file(path.join(oFontOptions.outputDir, `${oFontOptions.name}.${sExtension}`));
          workspace.fs.writeFile(oCodePointsUri, Buffer.from(sFile));
        } catch (oError) {
          //debugger;
        }
      }
    });
  },

  renderSrcOptions: {
    [FontAssetType.EOT]: {
      formatValue: 'embedded-opentype',
      getSuffix: () => '#iefix',
    },
    [FontAssetType.WOFF2]: { formatValue: 'woff2', getSuffix: null },
    [FontAssetType.WOFF]: { formatValue: 'woff', getSuffix: null },
    [FontAssetType.TTF]: { formatValue: 'truetype', getSuffix: null },
    [FontAssetType.SVG]: { formatValue: 'svg', getSuffix: (name: string | undefined) => `#${name}` },
  },

  renderSrcAttribute(oFontOptions: IconFontBundlerFontConfig) {
    const { name, fontTypes, fontsUrl } = oFontOptions;
    return (
      fontTypes
        ?.map((fontType) => {
          const { formatValue, getSuffix } = this.renderSrcOptions[fontType];
          const suffix = getSuffix ? getSuffix(name) : '';
          return `url("${fontsUrl || '.'}/${name}.${fontType}?${suffix}") format("${formatValue}")`;
        })
        .join(',\n') || ''
    );
  },
};
