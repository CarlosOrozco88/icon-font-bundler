import { window } from 'vscode';
import { Level } from '../Types/Types';

const iconFontBundlerOutput = window.createOutputChannel(`icon-font-bundler`);

const Log = {
  showOutput(): void {
    iconFontBundlerOutput.show();
  },

  log(sPrev: string, sText: string, sLevel: Level = Level.LOG): string {
    const oDate = new Date();
    const sDate = oDate.toLocaleTimeString();
    const sLevelExpanded = sLevel + '       '.slice(0, 7 - sLevel.length);
    const sNewLine = `[${sLevelExpanded} - ${sDate}] ${sPrev}: ${sText}`;
    iconFontBundlerOutput.appendLine(sNewLine);
    return sText;
  },

  general(sText: string, sLevel?: Level): string {
    return Log.log(`General`, sText, sLevel);
  },

  fonts(sText: string, sLevel?: Level): string {
    return Log.log(`Fonts`, sText, sLevel);
  },

  fantasticon(sText: string, sLevel?: Level): string {
    return Log.log(`Fantasticon`, sText, sLevel);
  },

  fontawesome(sText: string, sLevel?: Level): string {
    return Log.log(`FontAwesome`, sText, sLevel);
  },

  bootstrap(sText: string, sLevel?: Level): string {
    return Log.log(`Bootstrap`, sText, sLevel);
  },
};

export default Log;
