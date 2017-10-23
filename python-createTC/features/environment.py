from features.apps.browser import Browser
from features.steps.contactPage import ContactPage
from features.steps.homePage import HomePage

def before_all(context):
    context.browser = Browser()
    context.contactpage = ContactPage()
    context.homepage = HomePage()

def after_all(context):
    context.browser.close()