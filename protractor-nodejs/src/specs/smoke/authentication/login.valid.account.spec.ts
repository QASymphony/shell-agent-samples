import { managerUtils } from '../../../utils/qtest/manager.utils';
import { parametersUtils } from '../../../utils/qtest/parameters.utils';
import { browser } from 'protractor';
import { logger } from '../../../utils/common/logger.utils';
import { Consts } from '../../../consts';
import { using, since } from '../../index';
import { parametersConf } from '../../../utils/qtest/';
import { pageFactory } from '../../../page-objects/page.factory';

// qTest Manager page objects
import { LoginPage } from '../../../page-objects/pages/login.page';
import { TestPlanPage } from '../../../page-objects/pages/project/testplan.page';

let testRunInfo = browser.params.testRunsId[parametersConf.tc6.testCaseId];

if (testRunInfo) {

  // Get column names from Parameters
  // let columnDatasets = parametersUtils.getDatasetColumnNames(parametersConf.tc6.datasetId);
  // let mappedColumnNames = {
  //   username: columnDatasets[0],
  //   password: columnDatasets[1],
  //   expectedFullName: columnDatasets[2]
  // };
  let mappedColumnNames = {
    username: 'Username',
    password: 'Password',
    expectedFullName: 'Expected user full name'
  };
  // Get data set from Parameters
  // let rowDatasets = parametersUtils.getDatasetById(parametersConf.tc6.datasetId);
  let rowDatasets = [
    {
      username: 'normaluser1@mailinator.com',
      password: '@admin123',
      expectedFullName: 'Normal User1'
    },
    {
      username: 'normaluser2@mailinator.com',
      password: '@admin123',
      expectedFullName: 'qTest Manager'
    }
  ];
  let data = {
    username: '',
    password: '',
    expectedFullName: ''
  };
  let stepLogInfo, datasetsCounter = 1;
  let loginPage: LoginPage;
  let testPlanPage: TestPlanPage;

  describe(`# ${testRunInfo.testCaseName}|${testRunInfo.testRunId}`, async () => {

    afterEach(async (done) => {
      browser.params.stepLogInfo['description'] = `
        - ${mappedColumnNames.username}: ${data.username}
        - ${mappedColumnNames.password}: ${data.password}`;
      browser.params.stepLogInfo['expected_result'] = `${data.expectedFullName}`;
      browser.params.testStepLog = stepLogInfo;
      await testPlanPage.logoutManager();
      done();
    });

    // Execute test case with each data set
    using(rowDatasets, (row) => {
      it(`${Consts.JASMINE_IT_DESCRIPTION}${rowDatasets.length > 1 ? ' #' + datasetsCounter++ : ''}`, async (done) => {
        browser.params.stepLogInfo = {};
        data.username = row.username;
        data.password = row.password;
        data.expectedFullName = row.expectedFullName;

        /*
        ACTION STEPS
        */
        loginPage = await pageFactory.navigateToLoginPage();
        await loginPage.typeUsernameTextbox(data.username);
        await loginPage.typePasswordTextbox(data.password);
        testPlanPage = await loginPage.clickLoginButtonShowTestPlanPage();

        /*
        EXPECTATIONS
        */
        let avatarUsername = await testPlanPage.seeAvatarUserFullname();
        since(`Avatar user fullname is displayed: '#{actual}' (expectation is '#{expected}')'`)
          .expect(avatarUsername).toBe(data.expectedFullName);
        browser.params.stepLogInfo['actual_result'] = avatarUsername;

        done();
      });
    });

  });
}