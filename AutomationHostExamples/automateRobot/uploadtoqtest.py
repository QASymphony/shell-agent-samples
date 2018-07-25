import time
import os
import json
import requests
import sys
from functions import get_config, get_test_cycle, post_test_cycle, create_test_logs_json, format_time, format_test_steps
try:
    from BeautifulSoup import BeautifulSoup
except ImportError:
    from bs4 import BeautifulSoup

testbody = []


def parse_robot(classname):
    try:
        xml1 = open('./output.xml')
        soup = BeautifulSoup(xml1, 'xml')
    except:
        print("Error: Cannot find output file")
        return -1
    classname = classname.replace("_", " ")
    tag = soup.find('test', attrs={'name':classname})
    if tag is not None:
        testSuite = tag.parent['name']
        testCase = tag['name']
        status = tag.find('status', recursive=False)
        startTime = format_time(status['starttime'])
        endTime = format_time(status['endtime'])
        status = status['status']
        message = ''
        for child in tag.find_all('kw', recursive=False):
            runName = child['name']
            runStatus = child.find('status', recursive=False)['status']
            if runStatus == 'FAIL':
                message = child.find('msg').text
            stepCount = 0
            stepLog = []
            for step in child.find_all('kw', recursive=False):
                try:
                    stepName = step['name']
                    stepStatus = step.find('status')['status']
                    result = step.find('doc').text
                    stepLog.append(format_test_steps(stepName, stepStatus, stepCount, result))
                    stepCount = stepCount + 1
                except:
                    print('Error: Invalid test step log format')
            value = create_test_logs_json(testSuite, testCase, runName, status, message, startTime, endTime, stepLog)
            testbody.append(value)


def post_test_log():
    qtest_config = get_config()
    api_token = qtest_config["qtest_api_token"]
    qTestUrl = qtest_config["qtest_url"]
    projectId = os.environ["PROJECT_ID"]
    parse_robot(sys.argv[1])


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
