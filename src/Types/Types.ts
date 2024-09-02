import { FontAssetType, OtherAssetType } from '@twbs/fantasticon';

export interface Templates {
  css: string;
  html: string;
}

export interface IconFontBundlerFontConfig {
  type: IconFontBundlerType;
  family?: string;
  // version?: string;
  inputDir: string;
  outputDir: string;
  assetTypes?: OtherAssetType[];
  fontTypes?: FontAssetType[];
  prefix?: string;
  name: string;
  formatOptions?: Record<string, any>;
  normalize?: boolean;
  templates?: Templates;
  codepoints?: Record<string, any>;
  assets?: Record<string, any>;
  fontHeight?: number;
  round?: number;
  descent?: number;
  selector?: string;
  tag?: string;
  fontsUrl?: string;
}

export type IconFontBundlerConfigFile = Array<IconFontBundlerFontConfig>;

export interface IconFontBundlerFileData {
  configFile: IconFontBundlerConfigFile;
  fsPath: string;
  baseFsPath: string;
  folderName: string;
}

export type IconFontBundlerFileDataArray = Array<IconFontBundlerFileData>;

export interface IconFontBundlerItem extends IconFontBundlerFileData {
  font: IconFontBundlerFontConfig;
}
export type IconFontBundlerList = Array<IconFontBundlerItem>;

export enum IconFontBundlerType {
  fantasticon = 'fantasticon',
  fontawesome = 'fontawesome',
}
export interface Log {
  log(sMessage: string): void;
  logVerbose(sMessage: string): void;
  debug(sMessage: string): void;
  info(sMessage: string): void;
  warn(sMessage: string): void;
  error(sMessage: string): void;
}

export enum Level {
  LOG = 'LOG',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
}
