import { browser, ElementFinder, ElementArrayFinder } from 'protractor';
import { ElementFinderUtils } from '../utils/selenium/element.finder.utils';
import { logger } from '../utils/common/logger.utils';
import { packageConf } from '../utils/qtest/';

// qTest Manager page objects
import { LoginPage } from '../page-objects/pages/login.page';
import { TestPlanPage } from '../page-objects/pages/project/testplan.page';
import { ProjectsSettingPage } from '../page-objects/pages/setting/projects.setting.page';

// qTest Manager model objects
import { TerminateSessionModel } from '../page-objects/models/terminate.session.model';
import { ProjectDetailModel } from '../page-objects/models/setting/project.detail.model';
import { ProjectInfoPopup } from '../page-objects/models/popup/project.info.popup';
import { ConfirmationDeleteProjectPopup } from '../page-objects/models/popup/confirmation.delete.project.popup';

class PageFactory {

  private async processGettingPage(page: any): Promise<any> {
    await page.waitForPageLoadedCompletely();
    return page;
  }

  public async navigateToUrl(url: string) {
    await browser.get(url);
  }

  public async navigateToLoginPage(): Promise<LoginPage> {
    await this.navigateToUrl(`${packageConf.url}/portal/loginform`);
    logger.info(`Navigate to Login page`);
    return await this.getLoginPage();
  }

  public async navigateToSiteAdminPage(): Promise<ProjectsSettingPage> {
    await this.navigateToUrl(`${packageConf.url}/admin/setting`);
    logger.info(`Navigate to Site Administration page`);

    let eleProjectList: ElementFinder = await ElementFinderUtils.findElementById('qas_custom_ViewWithFilter_1', 10);
    if (!eleProjectList) {
      logger.info(`You are not authorized to view this page. Redirect you to Login page`);
      let loginPage: LoginPage = await this.getLoginPage();
      return await loginPage.loginSucceededShowSiteAdminPage(packageConf.admin.username, packageConf.admin.password);
    }

    return await pageFactory.getProjectsSettingPage();
  }


  /*
  GET PAGES
  */
  public async getLoginPage(): Promise<LoginPage> {
    return await this.processGettingPage(new LoginPage());
  }

  public async getTestPlanPage(): Promise<TestPlanPage> {
    return await this.processGettingPage(new TestPlanPage());
  }

  public async getProjectsSettingPage(): Promise<ProjectsSettingPage> {
    return await this.processGettingPage(new ProjectsSettingPage());
  }


  /*
  GET MODELS
  */
  public async getTerminateSessionModel(): Promise<TerminateSessionModel> {
    return await this.processGettingPage(new TerminateSessionModel());
  }

  public async getProjectDetailModel(): Promise<ProjectDetailModel> {
    return await this.processGettingPage(new ProjectDetailModel());
  }


  /*
  GET POPUPS
  */
  public async getCreatingProjectPopup(): Promise<ProjectInfoPopup> {
    return await this.processGettingPage(new ProjectInfoPopup());
  }

  public async getConfirmationDeleteProjectPopup(): Promise<ConfirmationDeleteProjectPopup> {
    return await this.processGettingPage(new ConfirmationDeleteProjectPopup());
  }

}
export let pageFactory = new PageFactory();