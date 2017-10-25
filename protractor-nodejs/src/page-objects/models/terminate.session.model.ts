import { LoggedBase } from '../logged.base';
import { PageInterface } from '../page.interface';
import { ElementFinderUtils } from '../../utils/selenium/element.finder.utils';
import { browser, ElementFinder, ElementArrayFinder } from 'protractor';
import { logger } from '../../utils/common/logger.utils';
import { pageFactory } from '../page.factory';

// qTest Manager page objects
import { TestPlanPage } from '../pages/project/testplan.page';
import { ProjectsSettingPage } from '../pages/setting/projects.setting.page';

export class TerminateSessionModel extends LoggedBase implements PageInterface {
  /*
  FORCE IMPLEMENTATION
  */
  public async waitForPageLoadedCompletely() {
    let elePopup: ElementFinder = await ElementFinderUtils.findElementByCssSelector('h4.modal-title');
    logger.info(await elePopup.isDisplayed() ? 'You are now on Terminate Sessions popup' : 'Terminate Sessions popup not found');
  }

  /*
  PUBLIC ACTIONS
  */
  public async clickLastRemoveSessionIcon(): Promise<TerminateSessionModel> {
    let eleLastRemoveIconList = await ElementFinderUtils.findAllElementsByXpath(`//table[@id='activeSessionTable']//a`);
    let eleLastRemoveIcon: ElementFinder = eleLastRemoveIconList[eleLastRemoveIconList.length - 1];
    await eleLastRemoveIcon.click();
    await ElementFinderUtils.waitForElementNotPresent(eleLastRemoveIcon, 2);
    logger.info(`Click the last Remove icon`);
    return this;
  }

  public async clickGoButtonShowTestPlanPage(): Promise<TestPlanPage> {
    let eleGoButton = await ElementFinderUtils.findElementById('reloginBtn');
    await eleGoButton.click();
    logger.info(`Click Go button go to Test Plan page`);

    let result = await ElementFinderUtils.waitForElementNotPresent(eleGoButton, 5);
    if (!result) {
      await eleGoButton.click();
      logger.info(`Try to click Go button again to go to Test Plan page`);
    }

    return await pageFactory.getTestPlanPage();
  }

  public async clickGoButtonShowSiteAdminPage(): Promise<ProjectsSettingPage> {
    let eleGoButton = await ElementFinderUtils.findElementById('reloginBtn');
    await eleGoButton.click();
    logger.info(`Click Go button go to Site Admin page`);
    return await pageFactory.getProjectsSettingPage();
  }

}