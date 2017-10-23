from behave import *
from homePage import HomePage

@given('the home page is open')
def step_impl(context):
    context.homepage.get()

@when('viewing content')
def step_impl(context):
    pass

@then('the right title and copywrite show up')
def step_impl(context):
    pass