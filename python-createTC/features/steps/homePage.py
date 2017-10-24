
from features.apps.browser import Browser

class HomePage(Browser):

    HOME_URL = ''

    def get(self):
        self.visit(HomePage.HOME_URL)