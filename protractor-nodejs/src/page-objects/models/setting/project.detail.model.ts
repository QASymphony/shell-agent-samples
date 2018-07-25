import { LoggedBase } from '../../logged.base';
import { PageInterface } from '../../page.interface';
import { ElementFinderUtils } from '../../../utils/selenium/element.finder.utils';
import { browser, ElementFinder, ElementArrayFinder, Key } from 'protractor';
import { logger } from '../../../utils/common/logger.utils';
import { pageFactory } from '../../page.factory';
import { Consts } from '../../../consts';

// qTest Manager model objects
import { ProjectInfoPopup } from '../popup/project.info.popup';

export class ProjectDetailModel extends LoggedBase implements PageInterface {
  /*
  FORCE IMPLEMENTATION
  */
  public async waitForPageLoadedCompletely() {
    let ele: ElementFinder = await ElementFinderUtils.findElementById('cancelProjectAction_label');
    await ele.isDisplayed();
  }

  /*
  PUBLIC ACTIONS
  */
  public async clickAddButton() {
    let ele: ElementFinder = await ElementFinderUtils.findElementById('addProjectAction_label');
    await ele.click();
    logger.info(`Click '+ Add' button`);
  }

  public async clickAddButtonShowCreatingProjectPopup(): Promise<ProjectInfoPopup> {
    let ele: ElementFinder = await ElementFinderUtils.findElementById('addProjectAction_label');
    await ele.click();
    logger.info(`Click '+ Add' button show Creating Project popup`);
    return await pageFactory.getCreatingProjectPopup();
  }

  public async typeProjectNameField(projectName: string) {
    let ele: ElementFinder = await ElementFinderUtils.findElementById('projName');
    await ele.clear();
    await ele.sendKeys(projectName);
    logger.info(`Type '${projectName}' into Project Name field`);
  }

  public async clearStartDateField() {
    let ele: ElementFinder = await ElementFinderUtils.findElementByXpath(`//div[@id='projStartDate']//input[@role='textbox']`);
    await ele.clear();
    logger.info(`Clear Start Date field`);
  }

  public async typeStartDateField(startDateValue: string) {
    let ele: ElementFinder = await ElementFinderUtils.findElementByXpath(`//div[@id='projStartDate']//input[@role='textbox']`);
    await ele.clear();
    await ele.sendKeys(startDateValue);
    logger.info(`Type '${startDateValue}' into Start Date field`);
  }

  public async clearAllAssignedUsers() {
    let eleList = await ElementFinderUtils.findAllElementsByXpath(`//div[@id='projAssignAdmin']//a`);
    for (let ele of eleList) {
      await ele.click();
    }
    logger.info('Clear all assigned users');
  }


  /*
  PUCLIC EXPECTATIONS
  */
  public async seeProjectNameFieldFocused(): Promise<boolean> {
    let ele: ElementFinder = await ElementFinderUtils.findElementByXpath(`//div[contains(@class, 'dijitTextBoxFocused')]//input[@id='projName']`);
    return await ele.isDisplayed();
  }

  public async seeAssignedUsers(): Promise<string> {
    let ele: ElementFinder = await ElementFinderUtils.findElementByCssSelector(`#projAssignAdmin span`);
    return await ele.getText();
  }

  public async seeStartDateValue(): Promise<string> {
    let ele: ElementFinder = await ElementFinderUtils.findElementByXpathInDOM(`//div[@id='projStartDate']//input[@type='hidden']`);
    let date: string = await ele.getAttribute('value');
    date = date.replace(new RegExp('-', 'g'), '.');
    logger.info(`See Start Date value: '${date}'`);
    return date;
  }

  public async seeErrorValidationBorderOfProjectNameField(): Promise<boolean> {
    let ele: ElementFinder = await ElementFinderUtils.findElementByXpath(`//div[@id='widget_projName'][contains(@class,'dijitValidationTextBoxError')]`);
    let result = await ele.isDisplayed();
    logger.info(`See error validation of Project Name field: ${result}`);
    return result;
  }

  public async seeErrorValidationMessageOfProjectNameField(): Promise<string> {
    let ele: ElementFinder = await ElementFinderUtils.findElementByXpath(`//div[@id='dijit__MasterTooltip_0']/div[@role='alert']`);
    let result = await ele.getText();
    logger.info(`See error validation message of Project Name field: '${result}'`);
    return result;
  }

  public async seeErrorValidationBorderOfStartDateField(): Promise<boolean> {
    let ele: ElementFinder = await ElementFinderUtils.findElementByXpath(`//div[@id='projStartDate']/div[contains(@class,'dijitDateTextBoxError')]`);
    let result = await ele.isDisplayed();
    logger.info(`See error validation of Start Date field: ${result}`);
    return result;
  }

}