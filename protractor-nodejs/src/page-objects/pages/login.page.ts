import { PageInterface } from '../page.interface';
import { ElementFinderUtils } from '../../utils/selenium/element.finder.utils';
import { browser, ElementFinder, ElementArrayFinder } from 'protractor';
import { logger } from '../../utils/common/logger.utils';
import { pageFactory } from '../page.factory';

// qTest Manager page objects
import { TestPlanPage } from './project/testplan.page';
import { ProjectsSettingPage } from './setting/projects.setting.page';
import { TerminateSessionModel } from '../models/terminate.session.model';

export class LoginPage implements PageInterface {
  /*
  FORCE IMPLEMENTATION
  */
  public async waitForPageLoadedCompletely() {
    let ele = await ElementFinderUtils.findElementByXpath(`//div[@id='left-side']/iframe`);
    logger.info(await ele.isDisplayed() ? 'You are now on Login page' : 'Login page not found');
  }


  /*
  PUBLIC ACTIONS
  */
  public async typeUsernameTextbox(value: string) {
    let element: ElementFinder = await ElementFinderUtils.findElementById('userName');
    if (element) {
      await element.clear();
      await element.sendKeys(value);
      logger.info(`Type in 'Username' edit box: '${value}'`);
    }
  }

  public async typePasswordTextbox(value: string) {
    let element: ElementFinder = await ElementFinderUtils.findElementById('password');
    if (element) {
      await element.clear();
      await element.sendKeys(value);
      logger.info(`Type in 'Password' edit box: '${value}'`);
    }
  }

  public async clickLoginButton() {
    let element: ElementFinder = await ElementFinderUtils.findElementByXpath(`//a[contains(@onclick,'submit')]`);
    if (element) {
      await element.click();
      logger.info(`Click 'Login' button`);
    }
  }

  public async clickLoginButtonShowTestPlanPage() {
    let element: ElementFinder = await ElementFinderUtils.findElementByXpath(`//a[contains(@onclick,'submit')]`);
    if (element) {
      await element.click();
      logger.info(`Click 'Login' button`);

      // Solve Terminate Sessions popup displays
      let eleTerminateSessionsPopup: ElementFinder = await ElementFinderUtils.findElementByXpath(`//h4[text()='Terminate Sessions']`, 3);
      if (eleTerminateSessionsPopup) {
        logger.info('Terminate Sessions popup is displayed');
        let terminateSessionPopup = await pageFactory.getTerminateSessionModel();
        await terminateSessionPopup.clickLastRemoveSessionIcon();
        return await terminateSessionPopup.clickGoButtonShowTestPlanPage();
      }

      return await pageFactory.getTestPlanPage();
    }
  }

  public async loginSucceededShowSiteAdminPage(username: string, password: string): Promise<ProjectsSettingPage> {
    await this.typeUsernameTextbox(username);
    await this.typePasswordTextbox(password);
    await this.clickLoginButton();

    // Solve Terminate Sessions popup displays
    let eleTerminateSessionsPopup: ElementFinder = await ElementFinderUtils.findElementByXpath(`//h4[text()='Terminate Sessions']`, 3);
    if (eleTerminateSessionsPopup) {
      logger.info('Terminate Sessions popup is displayed');
      let terminateSessionPopup = await pageFactory.getTerminateSessionModel();
      await terminateSessionPopup.clickLastRemoveSessionIcon();
      return await terminateSessionPopup.clickGoButtonShowSiteAdminPage();
    }

    return await pageFactory.getProjectsSettingPage();
  }


  /*
  PUCLIC EXPECTATIONS
  */


}