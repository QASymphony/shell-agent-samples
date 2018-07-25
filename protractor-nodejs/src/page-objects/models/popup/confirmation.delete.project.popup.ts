import { LoggedBase } from '../../logged.base';
import { PageInterface } from '../../page.interface';
import { ElementFinderUtils } from '../../../utils/selenium/element.finder.utils';
import { browser, ElementFinder, ElementArrayFinder } from 'protractor';
import { logger } from '../../../utils/common/logger.utils';
import { pageFactory } from '../../page.factory';

// qTest Manager objects
import { ProjectsSettingPage } from '../../../page-objects/pages/setting/projects.setting.page';

export class ConfirmationDeleteProjectPopup extends LoggedBase implements PageInterface {
  /*
  FORCE IMPLEMENTATION
  */
  public async waitForPageLoadedCompletely() {
    const titlePopup = 'CREATING PROJECT';
    let ele = await ElementFinderUtils.findElementById('removeProjectConfirmation_title');
    logger.info(await ele.isDisplayed() ? `You are now on '${titlePopup}' popup` : `'${titlePopup}' popup not found`);
  }


  /*
  PUBLIC ACTIONS
  */
  public async clickYesButton() {
    let ele: ElementFinder = await ElementFinderUtils.findElementById('removeProjectConfirmationOK_label');
    await ele.click();
    logger.info(`Click Yes button`);
  }

}