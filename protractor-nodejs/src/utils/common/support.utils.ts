import { logger } from "./logger.utils";

class SupportUtils {

  public execCommand(value: string) {
    const exec = require('child_process').exec;
    exec(value, (error, stdout, stderr) => {
      if (error) {
        logger.info(error);
        return;
      }
    });
  }

  public getCurrentDateTime() {
    let date = new Date().toISOString();
    return `${date.substr(0, 10)}T${date.substr(11, 12)}Z`;
  }

  public getCurrentDateTimeFormatted() {
    let date: string = new Date().toISOString();
    date = date.substr(0, 10);
    date = date.replace(new RegExp('-', 'g'), '.');
    return date;
  }

}
export let supportUtils = new SupportUtils();