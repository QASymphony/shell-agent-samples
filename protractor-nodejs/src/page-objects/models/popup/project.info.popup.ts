import { LoggedBase } from '../../logged.base';
import { PageInterface } from '../../page.interface';
import { ElementFinderUtils } from '../../../utils/selenium/element.finder.utils';
import { browser, ElementFinder, ElementArrayFinder, ExpectedConditions } from 'protractor';
import { logger } from '../../../utils/common/logger.utils';
import { pageFactory } from '../../page.factory';

// qTest Manager objects
import { ProjectsSettingPage } from '../../../page-objects/pages/setting/projects.setting.page';

export class ProjectInfoPopup extends LoggedBase implements PageInterface {
  /*
  FORCE IMPLEMENTATION
  */
  public async waitForPageLoadedCompletely() {
    const titlePopup = 'CREATING PROJECT';
    let ele = await ElementFinderUtils.findElementById('projSuccessfulMsg_title');
    logger.info(await ele.isDisplayed() ? `You are now on '${titlePopup}' popup` : `'${titlePopup}' popup not found`);
  }


  /*
  PUBLIC ACTIONS
  */
  public async clickOKButton(): Promise<ProjectsSettingPage> {
    let ele: ElementFinder = await ElementFinderUtils.findElementById('projSuccessfulMsgOK_label');
    await browser.wait(ExpectedConditions.elementToBeClickable(ele));
    await ele.click();
    logger.info(`Click OK button`);

    let elePopup = await ElementFinderUtils.waitForElementNotVisible(ele, 5);
    if (!elePopup) {
      await ele.click();
      logger.info(`Try to click OK button again`);
    }

    return await pageFactory.getProjectsSettingPage();
  }


  /*
  PUCLIC EXPECTATIONS
  */
  public async seeMessage(): Promise<string> {
    let ele: ElementFinder = await ElementFinderUtils.findElementByXpath(`//div[@id='projSuccessfulMsg']/div/div[not(contains(@class,'operationButton'))]`);
    return await ele.getText();
  }

}