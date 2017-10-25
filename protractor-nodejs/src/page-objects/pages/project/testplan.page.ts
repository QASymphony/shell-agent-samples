import { LoggedBase } from '../../logged.base';
import { PageInterface } from '../../page.interface';
import { ElementFinderUtils } from '../../../utils/selenium/element.finder.utils';
import { browser, ElementFinder, ElementArrayFinder } from 'protractor';
import { logger } from '../../../utils/common/logger.utils';
import { pageFactory } from '../../page.factory';

export class TestPlanPage extends LoggedBase implements PageInterface {
  /*
  FORCE IMPLEMENTATION
  */
  public async waitForPageLoadedCompletely() {
    let ele = await ElementFinderUtils.findElementById('dijit_TitlePane_0');
    logger.info(await ele.isDisplayed() ? 'You are now on Test Plan page' : 'Test Plan page not found');
  }


  /*
  PUBLIC ACTIONS
  */


  /*
  PUCLIC EXPECTATIONS
  */
  public async seeUrl(): Promise<string> {
    return await browser.getCurrentUrl();
  }

  public async seeAvatarUserFullname(): Promise<string> {
    let eleAvatarUserFullname = await ElementFinderUtils.findElementByCssSelector(`p.username`);
    return await eleAvatarUserFullname.getText();
  }

}