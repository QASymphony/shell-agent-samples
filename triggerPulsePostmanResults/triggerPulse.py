import os
import sys
import json
import requests
import base64
from html import escape
from pprint import pprint
from requests.auth import HTTPBasicAuth
from datetime import datetime

# {'QTE': {'jobStatus': 'NOT_RUN',
#           'projectId': 59623,
#           'projectName': ' DVT_QTEST',
#           'testRuns': [{'Assigned To': 'Elise Carmichael',
#                         'Build URL': None,
#                         'Environment': None,
#                         'Execution Type': 'Functional',
#                         'Id': '25165147',
#                         'Name': 'Execute All Features',
#                         'Pid': 'TR-1',
#                         'Planned End Date': '2017-10-30T19:51:51+00:00',
#                         'Planned Start Date': '2017-10-30T19:51:51+00:00',
#                         'Priority': 'Medium',
#                         'Result Cycle': '801706.0',
#                         'Run Order': None,
#                         'Status': 'Unexecuted'}],
#           'testSuite': {}},
#   'dynamic': {}}

# dvt
#eventTriggerUrl = "https://pulse.qas-labs.com/api/v1/webhooks/WmJcKoDnBfNitqcZC/zE7zh6RhmgwYKCb49/c015f130-17d3-4858-9309-06580b11d957"

# manh
#eventTriggerUrl = "https://pulse.qas-labs.com/api/v1/webhooks/5a01e95fff85516fe58bbcf0/5a01eafcff85516fe58bbcf1/5d260348-5e9a-41e3-b1e2-c2fa4679fccd"

# Postman (Pulse Automation)
eventTriggerUrl = "https://pulse.qas-labs.com/api/v1/webhooks/5a01e95fff85516fe58bbcf0/5a01eafcff85516fe58bbcf1/4d218bf1-4d7b-481d-a325-c5bc348f09e0"

testResults = []
executedRuns = []

def HitPulseEndpoint(projectId, cycleId):

    # TODO: pass in with a command line arg..
    with open('results.json') as executedTestRuns:
        executedRuns = json.load(executedTestRuns)

    headers = {
        "Content-Type" : "application/json",
    }

    body = {
        "test-cycle" : cycleId,
        "result" : executedRuns,
        "projectId" : projectId
    }

    dbody = json.dumps(body)

    pprint(body)
    myResponse = requests.post(url = eventTriggerUrl, headers = headers, data = dbody)

    if(myResponse.ok):
        pprint("Pulse response OK")
    else:
        myResponse.raise_for_status()


if('QTE_SCHEDULED_TX_DATA' in os.environ):
    processUrl = os.environ['QTE_SCHEDULED_TX_DATA']

    pprint("Scheduled Jobs URL: " + processUrl)

    myResponse = requests.get(url = processUrl, headers = {"Content-Type" : "application/json"})

    if(myResponse.ok):
        response = json.loads(myResponse.content)

        # TODO: Another way to get cycle (maybe parent fetch); for now, custom field in the executor
        HitPulseEndpoint(response['QTE']['projectId'], response['QTE']['testRuns'][0]['ResultCycle'])

    else:
        myResponse.raise_for_status()
else:
    pprint("Missing QTE_SCHEDULED_TX_DATA environment variable!")

    # Use hard coded stuff for testing
    # Manh
    HitPulseEndpoint(60676, 908729)
