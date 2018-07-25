import { LoggedBase } from '../../logged.base';
import { PageInterface } from '../../page.interface';
import { ElementFinderUtils } from '../../../utils/selenium/element.finder.utils';
import { browser, ElementFinder, ElementArrayFinder, Key } from 'protractor';
import { logger } from '../../../utils/common/logger.utils';
import { pageFactory } from '../../page.factory';
import { browserUtils } from '../../../utils/selenium/browser.utils';

import { ProjectDetailModel } from '../../models/setting/project.detail.model';
import { ConfirmationDeleteProjectPopup } from '../../models/popup/confirmation.delete.project.popup';

export class ProjectsSettingPage extends LoggedBase implements PageInterface {
  /*
  FORCE IMPLEMENTATION
  */
  public async waitForPageLoadedCompletely() {
    let eleProjectList: ElementFinder = await ElementFinderUtils.findElementById('qas_custom_ViewWithFilter_1');
    logger.info(await eleProjectList.isDisplayed() ? 'You are now on Site Administration page' : 'Site Administration page not found');
  }


  /*
  PUBLIC ACTIONS
  */
  public async clickAddNewProjectButton(): Promise<ProjectDetailModel> {
    let ele: ElementFinder = await ElementFinderUtils.findElementById('addProjectBtn_label');
    await ele.click();
    logger.info(`Click '+ Add new project' button`);
    return await pageFactory.getProjectDetailModel();
  }

  public async searchProjectByText(text: string) {
    let eleList = await ElementFinderUtils.findAllElementsByXpath(`//div[contains(@id,'project_list_grid_filter')]/input`);
    let ele: ElementFinder = eleList[0];
    await ele.clear();
    await ele.sendKeys(text);
    await ele.sendKeys(Key.RETURN);
    logger.info(`Search project name with key word '${text}'`);

    let eleProject: ElementFinder = await ElementFinderUtils.findElementByXpath(`//div[@class='dojoxGridMasterView']//a[text()='${text}']`, 5);
    if (!eleProject) {
      let eleColName = await ElementFinderUtils.findElementByXpath(`//div[@class='dojoxGridSortNode'][text()='Name']`, 3);
      await eleColName.click();
      logger.info(`Try to search the project name with key word '${text}' again`);
      eleProject = await ElementFinderUtils.findElementByXpath(`//div[@class='dojoxGridMasterView']//a[text()='${text}']`, 5);
    }
  }

  public async deleteProject(projectName: string): Promise<ConfirmationDeleteProjectPopup> {
    let ele: ElementFinder = await ElementFinderUtils.findElementByXpath(`//div[@class='dojoxGridMasterView']//a[text()='${projectName}']/../../..//a[contains(@id,'actionDeleteProject')]`);
    await ele.click();
    logger.info(`Delete project '${projectName}' show Confirmation popup`);
    return await pageFactory.getConfirmationDeleteProjectPopup();
  }

  public async resetProjectNameFilter() {
    let eleList = await ElementFinderUtils.findAllElementsByXpath(`//div[contains(@id,'project_list_grid_filter')]/input`);
    let ele: ElementFinder = eleList[0];
    await ele.clear();
    await ele.sendKeys('');
    await ele.sendKeys(Key.RETURN);
    logger.info('Reset Project Name filter');
  }


  /*
  PUCLIC EXPECTATIONS
  */
  public async seeFilteredProject(projectName: string): Promise<boolean> {
    let ele: ElementFinder = await ElementFinderUtils.findElementByXpath(`//div[@class='dojoxGridMasterView']//a[text()='${projectName}']`);
    let result = await ele.isDisplayed();
    logger.info(`See the project is filtered out: ${result}`);
    return result;
  }

  public async seeProjectStatus(projectName: string): Promise<string> {
    let eleList = await ElementFinderUtils.findAllElementsByXpath(`//div[@class='dojoxGridMasterView']//a[text()='${projectName}']/../../..//span`);
    let ele: ElementFinder = eleList[4];
    let result = await ele.getText();
    logger.info(`See the project status is: '${result}'`);
    return result;
  }

}