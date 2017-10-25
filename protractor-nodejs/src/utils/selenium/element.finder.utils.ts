import { ElementFinder, ElementArrayFinder, ExpectedConditions, browser, element, by, promise } from 'protractor';
import { logger } from '../common/logger.utils';

export class ElementFinderUtils {

  private static readonly LOCATOR_ID = 'id';
  private static readonly LOCATOR_CLASS_NAME = 'className';
  private static readonly LOCATOR_CSS_SELECTOR = 'css';
  private static readonly LOCATOR_XPATH = 'xpath';

  private static readonly DEFAULT_TIMEOUT: number = 60;
  private static readonly MSG_ELEMENT_NOT_FOUND: string = "Element(s) not found with locator";

  private static findElementBy(locator: string, value: string, timeout?: number): promise.Promise<ElementFinder> {
    let findingTimeout = timeout ? timeout : this.DEFAULT_TIMEOUT;
    let ele: ElementFinder = undefined;

    switch (locator) {
      case this.LOCATOR_ID:
        ele = element(by.id(value));
        break;

      case this.LOCATOR_CLASS_NAME:
        ele = element(by.className(value));
        break;

      case this.LOCATOR_CSS_SELECTOR:
        ele = element(by.css(value));
        break;

      case this.LOCATOR_XPATH:
        ele = element(by.xpath(value));
        break;
    }

    return browser.wait(ExpectedConditions.visibilityOf(ele), findingTimeout * 1000).then(() => {
      return ele;
    }, (error) => {
      logger.warn(this.MSG_ELEMENT_NOT_FOUND, `${locator} '${value}' after timeout ${findingTimeout} seconds`);
      return undefined;
    });
  }

  private static findAllElementsBy(locator: string, value: string, timeout?: number): promise.Promise<ElementArrayFinder> {
    let findingTimeout = timeout ? timeout : this.DEFAULT_TIMEOUT;
    let eleArray: ElementArrayFinder = undefined;

    switch (locator) {
      case this.LOCATOR_CLASS_NAME:
        eleArray = element.all(by.className(value));
        break;

      case this.LOCATOR_CSS_SELECTOR:
        eleArray = element.all(by.css(value));
        break;

      case this.LOCATOR_XPATH:
        eleArray = element.all(by.xpath(value));
        break;
    }

    return new promise.Promise<ElementArrayFinder>((resolve, reject) => {
      return browser.wait(ExpectedConditions.visibilityOf(eleArray.first()), findingTimeout * 1000).then(() => {
        resolve(eleArray);
      }, (error) => {
        logger.warn(this.MSG_ELEMENT_NOT_FOUND, `${locator} '${value}' after timeout ${findingTimeout} seconds`);
        resolve(undefined);
      });
    });
  }

  public static findElementById(id: string, timeout?: number): promise.Promise<ElementFinder> {
    return this.findElementBy(this.LOCATOR_ID, id, timeout);
  }

  public static findElementByClassName(className: string, timeout?: number): promise.Promise<ElementFinder> {
    return this.findElementBy(this.LOCATOR_CLASS_NAME, className, timeout);
  }

  public static findElementByCssSelector(cssSelector: string, timeout?: number): promise.Promise<ElementFinder> {
    return this.findElementBy(this.LOCATOR_CSS_SELECTOR, cssSelector, timeout);
  }

  public static findElementByXpath(xpath: string, timeout?: number): promise.Promise<ElementFinder> {
    return this.findElementBy(this.LOCATOR_XPATH, xpath, timeout);
  }

  public static findAllElementsByClassName(className: string, timeout?: number): promise.Promise<ElementArrayFinder> {
    return this.findAllElementsBy(this.LOCATOR_CLASS_NAME, className, timeout);
  }

  public static findAllElementsByCssSelector(cssSelector: string, timeout?: number): promise.Promise<ElementArrayFinder> {
    return this.findAllElementsBy(this.LOCATOR_CSS_SELECTOR, cssSelector, timeout);
  }

  public static findAllElementsByXpath(xpath: string, timeout?: number): promise.Promise<ElementArrayFinder> {
    return this.findAllElementsBy(this.LOCATOR_XPATH, xpath, timeout);
  }

  public static waitForElementNotVisible(ele: ElementFinder, timeout?: number) {
    return browser.wait(ExpectedConditions.invisibilityOf(ele), timeout).then(() => {
      return true;
    }, (error) => {
      return false;
    });
  }

  public static waitForElementNotPresent(ele: ElementFinder, timeout?: number) {
    return browser.wait(ExpectedConditions.stalenessOf(ele), timeout).then(() => {
      return true;
    }, (error) => {
      return false;
    });
  }

  public static async waitForValuePropertyOfInputNotEmpty(ele: ElementFinder, timeout?: number): Promise<boolean> {
    let waitingTimeout = timeout ? timeout : this.DEFAULT_TIMEOUT;
    let counter = 0;

    while (counter < waitingTimeout) {
      if (await ele.getAttribute('value') != '')
        return true;

      await browser.sleep(1000);
      counter++;
    }

    return false;
  }

  public static executeClickOnElementByJavascript(ele: ElementFinder) {
    browser.executeScript("arguments[0].click();", ele.getWebElement());
  }

  public static findElementByXpathInDOM(xpath: string, timeout?: number): promise.Promise<ElementFinder> {
    let findingTimeout = timeout ? timeout : this.DEFAULT_TIMEOUT;
    let ele: ElementFinder = element(by.xpath(xpath));;

    return browser.wait(ExpectedConditions.presenceOf(ele), findingTimeout * 1000).then(() => {
      return ele;
    }, (error) => {
      logger.warn(this.MSG_ELEMENT_NOT_FOUND, `xpath '${xpath}' after timeout ${findingTimeout} seconds`);
      return undefined;
    });
  }

}