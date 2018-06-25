import time
import os
import json
import requests
import base64
import ast
import sys
from functions import get_config, create_test_logs_json, get_test_cycle, post_test_cycle

testbody = []

def parse_xml(methodName):
    try:
        from BeautifulSoup import BeautifulSoup
    except ImportError:
        from bs4 import BeautifulSoup
    try:
        directory = sys.argv[2]
    except:
        print('Error: Enter a valid file path argument')
        return -1
    path = '{}/'
    path = path.format(directory)
    file = path + 'bin/Debug/TestResult.xml'
    xml = open(file)
    soup = BeautifulSoup(xml, 'xml')
    message = ''
    log = ''
    try:
        tag = soup.find(attrs={"methodname": methodName})
        runName = tag['classname']
        stepName = tag['methodname']
    except:
        tag = soup.find(attrs={"name": methodName})
        runName = tag['fullname']
        stepName = tag['name']
    status = tag['result']
    if tag.find('start-time') is not None and tag.find('end-time') is not None:
        start = tag['start-time']
        end = tag['end-time']
    else:
        start = None
        end = None
    if status == "Failed":
        status = "FAIL"
    elif status == "Passed":
        status = "PASS"
    else:
        status = "SKIP"
    if status == 'FAIL':
        if tag.find('stack-trace') is not None:
            log = tag.find('stack-trace').text
            log = base64.b64encode(bytes(log, 'utf-8'))
            log = log.decode('utf-8')
        if tag.find('message') is not None:
            message = tag.find('message').text
    else:
        message = ''
        log = ''
    value = create_test_logs_json(runName, stepName, status, message, log, start, end)
    testbody.append(value)
    return testbody


def post_test_log():
    qtest_config = get_config()
    api_token = qtest_config["qtest_api_token"]
    qTestUrl = qtest_config["qtest_url"]
    projectId = os.environ["PROJECT_ID"]
    dictionary = ast.literal_eval(sys.argv[1])
    for key in dictionary:
        for elem in dictionary.get(key):
            methodName = elem
            parse_xml(methodName)

    baseUrl = '{}/api/v3/projects/{}/auto-test-logs'

    testLogUrl = baseUrl.format(qTestUrl, projectId)
    try:
        update = sys.argv[3]
        if update == 'update':
            testCycle = get_test_cycle()
        else:
            testCycle = post_test_cycle()
    except:
        print("Error: Enter valid argument (true or false) to update existing test cycle or not")
        return -1
    payload = {
        'skipCreatingAutomationModule': False,
        'test_logs': testbody,
        'execution_date': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'test_cycle': testCycle
    }

    key = '{}'
    key = key.format(api_token)
    headers = {'Content-Type': 'application/json',
               "Authorization": key}
    params = {'type': 'automation'}
    try:
        r = requests.post(testLogUrl, params=params, data=json.dumps(payload), headers=headers)
        print(r.text)
    except:
        print("Error: Unable to post data to qTest Manager API.")
        return -1


post_test_log()
