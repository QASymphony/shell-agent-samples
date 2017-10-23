
from features.apps.browser import Browser

class ContactPage(Browser):

    CONTACT_URL = '/contact-us'

    def get(self):
        self.visit(ContactPage.CONTACT_URL)