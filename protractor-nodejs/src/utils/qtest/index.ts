import { configUtils } from '../common/config.utils';
import { Consts } from '../../consts';
import { browser } from 'protractor';

export let mainConf = configUtils.getConfigFromFile('configs/main.json');
export let parametersConf = configUtils.getConfigFromFile('configs/parameters.json');
// Get qTest package and browser type from Shell Agent job
let packageName = process.argv[3].split('=')[1].toLowerCase();
let browserName = process.argv[4].split('=')[1].toLowerCase();
export let packageConf = mainConf.packages[packageName];