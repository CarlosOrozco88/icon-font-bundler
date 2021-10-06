import { commands } from 'vscode';

// Fonts
import Fonts from './Fonts/Fonts';
import Log from './Utils/Log';

export async function activate(context) {
  const { registerCommand } = commands;
  const { subscriptions } = context;

  // Configure commands

  subscriptions.push(registerCommand('icon-font-bundler.generate', () => Fonts.askFontToGenerate()));
  subscriptions.push(registerCommand('icon-font-bundler.generateAll', () => Fonts.generateAllFonts()));

  subscriptions.push(registerCommand('icon-font-bundler.showOutput', () => Log.showOutput()));
}

export function deactivate() {}
