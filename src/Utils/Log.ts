import { window } from 'vscode';
import { Level } from '../Types/Types';

const iconFontBundlerOutput = window.createOutputChannel(`icon-font-bundler`);

const Log = {
  showOutput(): void {
    iconFontBundlerOutput.show();
  },

  log(sText: string, sLevel: Level = Level.LOG): void {
    let oDate = new Date();
    let sDate = oDate.toLocaleTimeString();
    let sNewLine = `[${sLevel} - ${sDate}] ${sText}`;
    iconFontBundlerOutput.appendLine(sNewLine);
    return console.log(sNewLine);
  },

  general(sText: string, sLevel?: Level): void {
    return Log.log(`General: ${sText}`, sLevel);
  },

  fontastic(sText: string, sLevel?: Level): void {
    return Log.log(`Fontastic: ${sText}`, sLevel);
  },

  fontawesome(sText: string, sLevel?: Level): void {
    return Log.log(`FontAwesome: ${sText}`, sLevel);
  },
};

export default Log;
