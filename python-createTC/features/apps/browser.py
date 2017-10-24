from selenium import webdriver
from features.apps.portal import Portal

class Browser(object):

    options = webdriver.ChromeOptions()
    options.add_argument('headless')

    driver = webdriver.Chrome(chrome_options=options)
    
    driver.implicitly_wait(15)

    def close(context):
        context.driver.close()

    def visit(context, location=''):
        context.driver.get(Portal.SITE + location)

    def query_selector_css(context, selector):
        element = context.driver.find_element_by_css_selector(selector)
        return element