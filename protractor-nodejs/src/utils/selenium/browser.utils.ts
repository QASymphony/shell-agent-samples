import { logger } from '../common/logger.utils';
import { browser, ExpectedConditions, promise } from 'protractor';

class BrowserUtils {

  public async refreshBrowser() {
    await browser.refresh();
    logger.info('Refresh browser');
  }

  public seeAlertMessage(): promise.Promise<string> {
    return browser.wait(ExpectedConditions.alertIsPresent(), 5000).then(() => {
      return browser.switchTo().alert().getText().then((value) => {
        logger.info(`Alert message is displayed: '${value}'`);
        return value;
      });
    }, (error) => {
      logger.warn(`Alert is not found`);
      return undefined;
    });
  }

  public clickOKButtonAlertMessage() {
    return browser.wait(ExpectedConditions.alertIsPresent(), 5000).then(() => {
      return browser.switchTo().alert().accept().then(() => {
        logger.info(`Click OK button on Alert popup`);
        return;
      });
    }, (error) => {
      logger.warn(`Alert is not found`);
      return undefined;
    });
  }

}
export let browserUtils = new BrowserUtils();