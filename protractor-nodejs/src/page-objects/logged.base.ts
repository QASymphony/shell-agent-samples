import { ElementFinderUtils } from '../utils/selenium/element.finder.utils';
import { browser, ElementFinder, ElementArrayFinder } from 'protractor';
import { logger } from '../utils/common/logger.utils';
import { pageFactory } from './page.factory';
import { packageConf } from '../utils/qtest/';

// qTest Manager page objects
import { LoginPage } from '../page-objects/pages/login.page';

export class LoggedBase {

  public async logoutManager(): Promise<LoginPage> {
    await pageFactory.navigateToUrl(`${packageConf.url}/logout`);
    logger.info(`Log out qTest Manager`);
    return await pageFactory.getLoginPage();
  }

}