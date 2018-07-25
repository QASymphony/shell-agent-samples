import { RequestUtils } from '../common/request.utils';
import { logger } from '../common/logger.utils';
import { supportUtils } from '../common/support.utils';
import { mainConf } from '../../utils/qtest/';
let request = require('sync-request');

class ManagerUtils {

  private readonly AUTHORIZATION = 'Basic ZXhwbG9yZXI6QW43dFdLeHhSbWxWSzI1ME1RNkx5b2tlbzVuQTAyZkE=';

  private url;
  private projectId;
  private tokenType;
  private accessToken;

  constructor() {
    this.url = mainConf.managerUrl;
  }

  private getHeader() {
    return {
      'authorization': `${this.tokenType} ${this.accessToken}`,
      'content-type': 'application/json'
    }
  }

  public async loginAs(username: string, password: string): Promise<any> {
    let url = `${this.url}/oauth/token`;
    let formData = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&grant_type=password`;
    let args = {
      data: formData,
      headers: {
        'authorization': `${this.AUTHORIZATION}`,
        'content-type': 'application/x-www-form-urlencoded'
      }
    };

    let responseData = await RequestUtils.sendPOST(url, args);
    this.tokenType = responseData['token_type'];
    this.accessToken = responseData['access_token'];
    return responseData;
  }

  public setDefaultProjectId(projectId: number) {
    this.projectId = projectId;
  }

  public async readTestRunsFromShellAgent(testRuns: any) {
    let arrTCTR: Array<{ testCaseName: string, testCaseId: number, testRunId: number }> = [];
    let jsonTCTR = {};

    for (let testRun of testRuns) {
      let testRunInfo = await this.apiGetTestRunAssociatedWithTestCase(testRun.Id);
      if (testRunInfo.id) {
        let jsonItem: { testCaseName: string, testCaseId: number, testRunId: number } = {
          testCaseName: testRunInfo.test_case.name,
          testCaseId: testRunInfo.test_case.id,
          testRunId: testRunInfo.id
        }
        arrTCTR.push(jsonItem);
      }
    }

    // Convert all objects array into json dictionary
    for (let item of arrTCTR) {
      let json: { testCaseName: string, testCaseId: number, testRunId: number } = {
        testCaseName: item.testCaseName,
        testCaseId: item.testCaseId,
        testRunId: item.testRunId
      }
      jsonTCTR[item.testCaseId] = json;
    }

    return jsonTCTR;
  }

  public buildTestLogAttachment(failedExpectations: any): any {
    let note = "Failed expectations";
    let count = 1;
    for (let failed of failedExpectations) {
      note += `
        Message: ${failed.message}
        Result : ${failed.passed}
        ${failed.stack}
      ------------------------------------------------
      `;
      count++;
    }

    let attachment = {
      "name": "error.txt",
      "content_type": "text/plain",
      "data": new Buffer(note).toString('base64')
    }

    return attachment;
  }

  public pushTestResultToTestRun(testRunId: number, testLogInfo: any): any {
    let url = `${this.url}/api/v3/projects/${this.projectId}/test-runs/${testRunId}/auto-test-logs`;
    let body = testLogInfo;
    let args = {
      json: body,
      headers: this.getHeader()
    };
    let responseData = request('POST', url, args);
    responseData = JSON.parse(responseData.getBody("utf-8"));
    return responseData;
  }

  public async apiGetTestRunAssociatedWithTestCase(testRunId: number): Promise<any> {
    let url = `${this.url}/api/v3/projects/${this.projectId}/test-runs/${testRunId}?expand=testcase`;
    let args = {
      headers: this.getHeader()
    };

    let responseData = await RequestUtils.sendGET(url, args);
    return responseData;
  }

}
export let managerUtils = new ManagerUtils();