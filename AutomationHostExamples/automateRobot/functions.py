import json
import pathlib
import requests
import time
import sys
import os

try:
    from BeautifulSoup import BeautifulSoup
except ImportError:
    from bs4 import BeautifulSoup

dictionary = {}

def get_config():
    # Check to ensure the configuration file exists and is readable.
    try:
        path = pathlib.Path("conf.json")
        if path.exists() and path.is_file():
            with open(path) as config_file:
                try:
                    qtest_config = json.load(config_file)
                    return qtest_config
                except json.JSONDecodeError:
                    print("Error: Configuration file not in valid JSON format.")
        else:
            raise IOError
    except IOError:
        print("Error: Configuration file not found or inaccessible.")
        return -1
    except Exception as e:
        print("Error: Unexpected error loading configuration: " + str(e))
        return -1

def post_all_tests():
    qtest_config = get_config()
    api_token = qtest_config["qtest_api_token"]
    qTestUrl = qtest_config["qtest_url"]
    projectId = os.environ["PROJECT_ID"]
    body = parse_robot()

    baseUrl = '{}/api/v3/projects/{}/auto-test-logs'

    testLogUrl = baseUrl.format(qTestUrl, projectId)
    try:
        update = sys.argv[1]
        if update == 'update':
            testCycle = get_test_cycle()
        else:
            testCycle = post_test_cycle()
    except:
        print("Error: Enter valid argument (true or false) to update existing test cycle or not")
        return -1
    payload = {
        'skipCreatingAutomationModule': False,
        'test_logs': body,
        'execution_date': time.strftime('%Y-%m-%dT%H:%M:%SZ'),
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


def create_test_logs_json(testSuite, runName, stepName, status, note, start, end, stepLog):
    if start is None:
        start = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    if end is None:
        end = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    body = {'exe_start_date': start,
            'exe_end_date': end,
            'note': note,
            'name': runName,
            'status': status,
            'automation_content': runName + '#' + stepName,
            'module_names': [testSuite, runName, stepName],
            'test_step_logs': stepLog
            }
    return body


def format_test_steps(description, status, order, result):
    body = {
        "description": description,
        "order": order,
        "status": status,
        "expected_result": result
    }
    return body


def format_time(time):
    formatTime = '{}-{}-{}T{}Z'
    return formatTime.format(time[0:4], time[4:6], time[6:8], time[9:17])


def parse_robot():
    try:
        xml1 = open('./output.xml')
        soup = BeautifulSoup(xml1, 'xml')
    except:
        print("Error: Cannot find output file")
        return -1
    body = []
    for tag in soup.find_all('test'):
        testSuite = tag.parent['name']
        testCase = tag['name']
        status = tag.find('status', recursive=False)
        startTime = format_time(status['starttime'])
        endTime = format_time(status['endtime'])
        status = status['status']
        message = ''
        runName = ''
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
            body.append(value)
    return body


def post_test_cycle():
    qtest_config = get_config()
    api_token = qtest_config["qtest_api_token"]
    qTestUrl = qtest_config["qtest_url"]
    projectId = os.environ["PROJECT_ID"]

    baseUrl = '{}/api/v3/projects/{}/test-cycles/'

    testLogUrl = baseUrl.format(qTestUrl, projectId)
    payload = {
        "id": 1,
        "name": "Robot Automated Tests",
        'last_modified_date': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    }

    key = '{}'
    key = key.format(api_token)
    headers = {'Content-Type': 'application/json',
           "Authorization": key}

    r = requests.post(testLogUrl, data=json.dumps(payload), headers=headers)
    string = json.loads(r.text)
    testcycleId = string.get("id")
    return testcycleId


def get_test_cycle():
    qtest_config = get_config()
    api_token = qtest_config["qtest_api_token"]
    qTestUrl = qtest_config["qtest_url"]
    projectId = os.environ["PROJECT_ID"]

    baseUrl = '{}/api/v3/projects/{}/test-cycles/'

    testLogUrl = baseUrl.format(qTestUrl, projectId)
    payload = {
        "id": 1,
        "name": "Features",
        'last_modified_date': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
    }

    key = '{}'
    key = key.format(api_token)
    headers = {'Content-Type': 'application/json',
           "Authorization": key}

    r = requests.get(testLogUrl, data=json.dumps(payload), headers=headers)
    string = json.loads(r.text)
    testcycleId = None
    for attrib in string:
        name = attrib.get('name')
        if name == "Robot Automated Tests":
            testcycleId = attrib.get('id')
    if testcycleId is None:
        testcycleId = post_test_cycle()
    return testcycleId
