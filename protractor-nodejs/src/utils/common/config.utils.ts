let path = require('path');

class ConfigUtils {

  public getConfigFromFile(filePath: string) {
    return require(path.resolve(filePath));
  }

}
export let configUtils = new ConfigUtils();