
export interface IconFontBundlerConfig {
  type: IconFontBundlerType;
  family?: string;
  version?: string;
  inputDir: string;
  outputDir: string;
  assetTypes: string[];
  fontTypes: string[];
  prefix?: string;
  name?: string;
  normalize?: boolean;
}

export interface IconFontBundlerFileArray extends Array<IconFontBundlerConfig>{}

export interface IconFontBundlerFileData {
  configFile: IconFontBundlerFileArray;
  fsPath: string;
  baseFsPath: string;
  folderName: string;
} 

export interface IconFontBundlerItem extends IconFontBundlerFileData {
  font: IconFontBundlerConfig
}
export interface IconFontBundlerList extends Array<IconFontBundlerItem> {} 

export enum IconFontBundlerType {
  fantasticon = "fantasticon",
  fontawesome = "fontawesome"
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

