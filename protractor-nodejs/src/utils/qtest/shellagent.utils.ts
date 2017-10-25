import { RequestUtils } from '../common/request.utils';
import { logger } from '../common/logger.utils';

class ShellAgentUtils {

  public async getResponseDataFromUrl(url: string): Promise<any> {
    let args = {};
    let responseData = await RequestUtils.sendGET(url, args);
    return JSON.parse(responseData);
  }

}
export let shellAgentUtils = new ShellAgentUtils();