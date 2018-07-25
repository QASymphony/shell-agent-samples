import { Config, browser } from 'protractor';
import { logger } from './utils/common/logger.utils';
import { supportUtils } from './utils/common/support.utils';
import { configUtils } from './utils/common/config.utils';
import { Consts } from './consts';
import { managerUtils } from './utils/qtest/manager.utils';
import { parametersUtils } from './utils/qtest/parameters.utils';
import { shellAgentUtils } from './utils/qtest/shellagent.utils';
import { mainConf, packageConf } from './utils/qtest/';

let SpecReporterConsole = require('jasmine-spec-reporter').SpecReporter;
let path = require('path');

// Get qTest package and browser type from Shell Agent command
let packageName = process.argv[3].split('=')[1];
let browserName = process.argv[4].split('=')[1];
let testRunsId;

const CHROME_CONFIG = {
  'browserName': 'chrome'
};
const FIREFOX_CONFIG = {
  'browserName': 'firefox',
  'marionette': true
};
const IE11_CONFIG = {
  'browserName': 'internet explorer',
  'IE_ENSURE_CLEAN_SESSION': true
};
let getBrowser = (): any => {
  switch (browserName.toLowerCase()) {
    case Consts.BROWSER_CHROME:
      return CHROME_CONFIG;

    case Consts.BROWSER_FIREFOX:
      return FIREFOX_CONFIG;

    case Consts.BROWSER_IE11:
      return IE11_CONFIG;
  }
};

export let config: Config = {
  framework: 'jasmine2',
  seleniumAddress: Consts.SELENIUM_SERVER_ADDRESS,
  capabilities: getBrowser(),
  suites: mainConf.suites,

  /*
  Special option for Angular2, to test against all Angular2 applications on the page. This means 
  that Protractor will wait for every app to be stable before each action, and search within all 
  apps when finding elements.
  */
  useAllAngular2AppRoots: true,

  jasmineNodeOpts: {
    showColors: true, // if true, print colors to the terminal
    includeStackTrace: true, // if true, include stack traces in failures
    defaultTimeoutInterval: Consts.JASMINE_TIMEOUT_IN_MILISECONDS,  // timeout of a test before it fails (default is 30000 ms)
    print: () => { } // remove protractor dot report
  },

  beforeLaunch: async () => {
    let responseData = await shellAgentUtils.getResponseDataFromUrl(process.env.QTE_SCHEDULED_TX_DATA);
    // let responseData = await shellAgentUtils.getResponseDataFromUrl('http://localhost:6789/job-detail/399');
    let testRunsList = responseData['QTE']['testRuns'];
    let qTestToken = await managerUtils.loginAs(mainConf.siteAdmin.username, mainConf.siteAdmin.password);
    managerUtils.setDefaultProjectId(Consts.PROJECT_ID);
    await parametersUtils.authorize(qTestToken);
    testRunsId = await managerUtils.readTestRunsFromShellAgent(testRunsList);
  },

  onPrepare: async () => {
    // Add Jasmine spec console reporter
    jasmine.getEnv().addReporter(new SpecReporterConsole({
      displayStacktrace: true
    }));

    let width = (await browser.manage().window().getSize()).width;
    if (width < 1366)
      await browser.manage().window().maximize();
    browser.ignoreSynchronization = true;
    browser.params.testRunsId = testRunsId;

    logger.info(`-----------------------------------------------------------`);
    logger.info(`Package: ${packageName} (${packageConf.url})`);
    logger.info(`Browser: ${browserName}`);
    browser.params.browserName = browserName;

    jasmine.getEnv().addReporter({
      suiteStarted: (result) => {
        // Build test log info for pushing result to Manager
        browser.params.testLogInfo = {};
        browser.params.testLogInfo['name'] = result.description;
        browser.params.testLogInfo['automation_content'] = result.description;
        browser.params.testLogInfo['status'] = Consts.TEST_LOG_STATUS_INCOMPLETE;
        browser.params.testLogInfo['exe_start_date'] = supportUtils.getCurrentDateTime();
        browser.params.testLogInfo['exe_end_date'] = '';
        browser.params.testLogInfo['attachments'] = [];
        browser.params.testLogInfo['test_step_logs'] = [];
      },
      specDone: (result) => {
        if (result.status === Consts.TEST_LOG_STATUS_FAILED) {
          browser.params.testLogInfo['status'] = Consts.TEST_LOG_STATUS_FAILED;

          let errorData = managerUtils.buildTestLogAttachment(result.failedExpectations);
          browser.params.testLogInfo['attachments'].push(errorData);
        }

        browser.params.stepLogInfo["status"] = result.status;
        browser.params.testLogInfo['test_step_logs'].push(browser.params.stepLogInfo);
      },
      suiteDone: async (result) => {
        if (result.status === 'finished' && browser.params.testLogInfo['status'] === Consts.TEST_LOG_STATUS_INCOMPLETE)
          browser.params.testLogInfo['status'] = Consts.TEST_LOG_STATUS_PASSED;

        let testRunId = +result.description.split('|')[1];
        browser.params.testLogInfo['exe_end_date'] = supportUtils.getCurrentDateTime();
        managerUtils.pushTestResultToTestRun(testRunId, browser.params.testLogInfo);
      }
    });
  },

  onComplete: async () => {
    logger.info('Clean up environment');
    await browser.quit();
    supportUtils.execCommand(`taskkill /F /IM ${Consts.CHROMEDRIVER_PROCESS_NAME}`); // terminate all chrome driver instances
    supportUtils.execCommand(`taskkill /F /IM ${Consts.FIREFOXDRIVER_PROCESS_NAME}`); // terminate all firefox driver instances
    supportUtils.execCommand(`taskkill /F /IM ${Consts.IEDRIVER_PROCESS_NAME}`); // terminate all ie driver instances
  }

};