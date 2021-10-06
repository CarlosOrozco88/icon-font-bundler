import { FontAssetType } from 'fantasticon';
import { workspace, Uri } from 'vscode';
import path from 'path';
import fs from 'fs';

import Handlebars from 'handlebars';

export default {
  async generateAssets(oFontOptions, oFontConfig) {
    oFontOptions.assetTypes.forEach(async (sExtension) => {
      let sTemplatePath = oFontOptions.templates[sExtension];
      if (sTemplatePath) {
        let sTemplate;
        sTemplate = fs.readFileSync(sTemplatePath, { encoding: 'utf8' });

        try {
          let sFile = Handlebars.compile(sTemplate)(oFontOptions, {
            helpers: {
              fontSrc: this.renderSrcAttribute(oFontOptions),
              codepoint(codepoint) {
                return codepoint.toString(16);
              },
            },
          });
          let oCodePointsUri = Uri.file(path.join(oFontOptions.outputDir, `${oFontOptions.name}.${sExtension}`));
          workspace.fs.writeFile(oCodePointsUri, Buffer.from(sFile));
        } catch (oError) {
          debugger;
        }
      }
    });
  },

  renderSrcOptions: {
    [FontAssetType.EOT]: {
      formatValue: 'embedded-opentype',
      getSuffix: () => '#iefix',
    },
    [FontAssetType.WOFF2]: { formatValue: 'woff2' },
    [FontAssetType.WOFF]: { formatValue: 'woff' },
    [FontAssetType.TTF]: { formatValue: 'truetype' },
    [FontAssetType.SVG]: { formatValue: 'svg', getSuffix: (name) => `#${name}` },
  },

  renderSrcAttribute({ name, fontTypes, fontsUrl }) {
    return fontTypes
      .map((fontType) => {
        const { formatValue, getSuffix } = this.renderSrcOptions[fontType];
        const suffix = getSuffix ? getSuffix(name) : '';
        return `url("${fontsUrl || '.'}/${name}.${fontType}?${suffix}") format("${formatValue}")`;
      })
      .join(',\n');
  },
};
