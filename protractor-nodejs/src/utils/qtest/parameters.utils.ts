import { RequestUtils } from '../common/request.utils';
import { logger } from '../common/logger.utils';
import { mainConf } from '../../utils/qtest/';
let request = require('sync-request');

class ParametersUtils {

  private url;
  private token;

  constructor() {
    this.url = mainConf.parametersUrl;
  }

  private getHeader() {
    return {
      'x-access-token': this.token
    }
  }

  public async authorize(qTestToken: string) {
    this.token = Buffer.from(`qas:${qTestToken['access_token']}:${mainConf.managerUrl}`).toString('base64');
    let url = `${this.url}/oauth/v1/integration?token=${this.token}`
    let args = {};
    await RequestUtils.sendGET(url, args);
  }

  public getDatasetColumnNames(datasetsId: string): any {
    let url = `${this.url}/api/v1/data-sets/${datasetsId}/rows?page=1&size=25`;
    let args = {
      headers: this.getHeader()
    };
    let responseData = request('GET', url, args);
    responseData = JSON.parse(responseData.getBody("utf-8"));

    // Get column names
    let firstRow = responseData.items[0];
    let colNames = [];
    for (let cell of firstRow.cells) {
      let data = this.getParameterById(cell.param_id);
      colNames.push(data.name);
    }

    return colNames;
  }

  public getDatasetById(datasetsId: string): any {
    let url = `${this.url}/api/v1/data-sets/${datasetsId}/rows?page=1&size=25`;
    let args = {
      headers: this.getHeader()
    };
    let responseData = request('GET', url, args);
    responseData = JSON.parse(responseData.getBody("utf-8"));

    // Get column names
    let firstRow = responseData.items[0];
    let colNames = [];
    for (let cell of firstRow.cells) {
      let data = this.getParameterById(cell.param_id);
      colNames.push(data.name);
    }

    // Customize the response data into an array
    let responseArray: Array<{}> = [];
    for (let item of responseData.items) {
      let itemJson = {};
      let i = 0;
      for (let cell of item.cells) {
        itemJson[colNames[i++]] = cell.value_text;
      }
      responseArray.push(itemJson);
    }

    return responseArray;
  }

  public getParameterById(parametersId: string): any {
    let url = `${this.url}/api/v1/parameters/${parametersId}`;
    let args = {
      headers: this.getHeader()
    };
    let responseData = request('GET', url, args);
    responseData = JSON.parse(responseData.getBody("utf-8"));
    return responseData;
  }

}
export let parametersUtils = new ParametersUtils();