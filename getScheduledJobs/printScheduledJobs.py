import os
import sys
import json
import requests
import base64
from html import escape
from pprint import pprint
from requests.auth import HTTPBasicAuth
from datetime import datetime

if('QTE_SCHEDULED_TX_DATA' in os.environ):
    processUrl = os.environ['QTE_SCHEDULED_TX_DATA']

    pprint("Scheduled Jobs URL: " + processUrl)

    myResponse = requests.get(url = processUrl, headers = {"Content-Type" : "application/json"})

    if(myResponse.ok):
        response = json.loads(myResponse.content)
        pprint(response)
    else:
        myResponse.raise_for_status()
else:
    pprint("Missing QTE_SCHEDULED_TX_DATA environment variable!")
