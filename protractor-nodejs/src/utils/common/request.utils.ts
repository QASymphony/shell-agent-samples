import { logger } from "./logger.utils";

let client = require('node-rest-client');
let request = new client.Client();

export class RequestUtils {

  private static readonly METHOD_GET = 'get';
  private static readonly METHOD_POST = 'post';
  private static readonly METHOD_PUT = 'put';

  private static handleRespondData(resolve: any, reject: any, data: any) {
    if (data.error) {
      logger.info(`Send request failed with error message: ${data['error_description']}`);
      reject(data.error);
      return;
    }
    resolve(data);
  }

  private static async send(method: string, url: string, args: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      switch (method) {
        case this.METHOD_GET:
          request.get(url, args, (data, response) => {
            this.handleRespondData(resolve, reject, data);
          });
          break;

        case this.METHOD_POST:
          request.post(url, args, (data, response) => {
            this.handleRespondData(resolve, reject, data);
          });
          break;

        case this.METHOD_PUT:
          request.put(url, args, (data, response) => {
            this.handleRespondData(resolve, reject, data);
          });
          break;
      }
    });
  }

  public static async sendGET(url: string, args: any): Promise<any> {
    return await this.send(this.METHOD_GET, url, args);
  }

  public static async sendPOST(url: string, args: any): Promise<any> {
    return await this.send(this.METHOD_POST, url, args);
  }

  public static async sendPUT(url: string, args: any): Promise<any> {
    return await this.send(this.METHOD_PUT, url, args);
  }

}