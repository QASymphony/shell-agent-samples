import { managerUtils } from '../../../../utils/qtest/manager.utils';
import { parametersUtils } from '../../../../utils/qtest/parameters.utils';
import { browser } from 'protractor';
import { logger } from '../../../../utils/common/logger.utils';
import { Consts } from '../../../../consts';
import { using, since } from '../../../index';
import { parametersConf, packageConf } from '../../../../utils/qtest/';
import { pageFactory } from '../../../../page-objects/page.factory';
import { supportUtils } from '../../../../utils/common/support.utils';

// qTest Manager page objects
import { ProjectsSettingPage } from '../../../../page-objects/pages/setting/projects.setting.page';
import { ProjectDetailModel } from '../../../../page-objects/models/setting/project.detail.model';

let testRunInfo = browser.params.testRunsId[parametersConf.tc62.testCaseId];

if (testRunInfo) {

  // Get column names from Parameters
  // let columnDatasets = parametersUtils.getDatasetColumnNames(parametersConf.tc62.datasetId);
  // let mappedColumnNames = {
  //   projectName: columnDatasets[0],
  //   startDate: columnDatasets[1]
  // };
  let mappedColumnNames = {
    projectName: 'Project Name',
    startDate: 'Start Date'
  };
  // Get data set from Parameters
  // let rowDatasets = parametersUtils.getDatasetById(parametersConf.tc62.datasetId);
  let rowDatasets = [
    {
      projectName: 'Sample Automation Project 1',
      startDate: supportUtils.getCurrentDateTimeFormatted().slice(0, 8) + '01'
    }
  ];
  let data = {
    projectName: '',
    startDate: ''
  };
  let stepLogInfo, datasetsCounter = 1;
  let projectsSettingPage: ProjectsSettingPage;

  const ERROR_VALIDATION_MSG = 'This value is required.';
  const SUCCESSFUL_CREATE_PROJECT_MSG = 'The project has been successfully created!';
  const PROJECT_STATUS_ACTIVE = 'Active';

  describe(`# ${testRunInfo.testCaseName}|${testRunInfo.testRunId}`, async () => {

    beforeAll(async (done) => {
      projectsSettingPage = await pageFactory.navigateToSiteAdminPage();
      done();
    });

    afterEach(async (done) => {
      browser.params.stepLogInfo['description'] = `
        - ${mappedColumnNames.projectName}: ${data.projectName}
        - ${mappedColumnNames.startDate}: ${data.startDate}`;
      browser.params.stepLogInfo['expected_result'] = '';
      browser.params.stepLogInfo['actual_result'] = '';
      browser.params.testStepLog = stepLogInfo;

      // Delete the created project
      let confirmationDeleteProjectPopup = await projectsSettingPage.deleteProject(data.projectName);
      await confirmationDeleteProjectPopup.clickYesButton();
      await projectsSettingPage.resetProjectNameFilter();
      await projectsSettingPage.logoutManager();
      done();
    });

    // Execute test case with each data set
    using(rowDatasets, (row) => {
      it(`${Consts.JASMINE_IT_DESCRIPTION} ${rowDatasets.length > 1 ? ' #' + datasetsCounter++ : ''} `, async (done) => {
        browser.params.stepLogInfo = {};
        data.projectName = row.projectName;
        data.startDate = row.startDate;

        /*
        ACTION STEPS & EXPECTATIONS
        */
        let newProjectModel: ProjectDetailModel = await projectsSettingPage.clickAddNewProjectButton();
        since('Project Name field is focused: #{actual}')
          .expect(await newProjectModel.seeProjectNameFieldFocused()).toBeTruthy();
        since(`Assign Project Admin field is auto filled with logged user: '#{actual}'(expectation is '#{expected}') `)
          .expect(await newProjectModel.seeAssignedUsers()).toBe(packageConf.admin.username);
        since('Start Date field is auto filled with current date: #{actual} (expectation is #{expected})')
          .expect(await newProjectModel.seeStartDateValue()).toBe(supportUtils.getCurrentDateTimeFormatted());

        await newProjectModel.clickAddButton();
        since(`Project Name error validation is highlighted in red border color: #{ actual } `)
          .expect(await newProjectModel.seeErrorValidationBorderOfProjectNameField()).toBeTruthy();
        since(`Project Name error validation message: '#{actual}'(expectation is '#{expected}') `)
          .expect(await newProjectModel.seeErrorValidationMessageOfProjectNameField()).toBe(ERROR_VALIDATION_MSG);

        await newProjectModel.typeProjectNameField(data.projectName);
        await newProjectModel.clearStartDateField();
        await newProjectModel.clickAddButton();
        since(`Start Date error validation is highlighted in red border color: #{ actual } `)
          .expect(await newProjectModel.seeErrorValidationBorderOfStartDateField()).toBeTruthy();

        await newProjectModel.typeStartDateField(supportUtils.getCurrentDateTimeFormatted());
        await newProjectModel.clearAllAssignedUsers();
        let creatingProjectPopup = await newProjectModel.clickAddButtonShowCreatingProjectPopup();
        since(`Message is displayed: '#{actual}'(expectation is '#{expected}') `)
          .expect(await creatingProjectPopup.seeMessage()).toBe(SUCCESSFUL_CREATE_PROJECT_MSG);

        projectsSettingPage = await creatingProjectPopup.clickOKButton();
        await projectsSettingPage.searchProjectByText(data.projectName);
        since('The created project is filtered out: #{actual}')
          .expect(await projectsSettingPage.seeFilteredProject(data.projectName)).toBeTruthy();
        since(`The created project status is: '#{actual}'(expectation is '#{expected}') `)
          .expect(await projectsSettingPage.seeProjectStatus(data.projectName)).toBe(PROJECT_STATUS_ACTIVE);

        done();
      });
    });

  });
}