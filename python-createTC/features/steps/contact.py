from behave import *
from contactPage import ContactPage

@given('the contact form is open')
def step_impl(context):
    context.contactpage.get()

@when('submitting with only the required "{field}" is filled out')
def step_impl(context, field):
    assert True is False

@then('an error will show up')
def step_impl(context):
    pass