import xml.etree.ElementTree
import time
import json
import pathlib
import requests
import sys
import os


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


def create_test_logs_json(runName, stepName, status, note):
    body = {'exe_start_date': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'exe_end_date': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'note': note,
            'name': runName,
            'status': status,
            'automation_content': runName + '#' + stepName,
            'module_names': [runName, stepName]
            }
    return body


def jmeter_parser():
    path = sys.argv[1]
    path = './' + path
    files = os.listdir(path)
    maxTime = 0
    currFile = ''
    for file in files:
        if file.endswith('.xml'):
            mTime = os.stat(path + "/" + file).st_mtime
            if mTime > maxTime:
                currFile = path + "/" + file
                maxTime = mTime
    print(currFile)
    root = xml.etree.ElementTree.parse(currFile).getroot()
    message = ''
    body = []
    for child in root:
        attributes = child.attrib
        name = attributes.get('tn')
        step = attributes.get('lb')
        if attributes.get('rm') == 'OK':
                status = 'PASS'
        else:
                status = 'FAIL'
                message = attributes.get('rm')
        value = create_test_logs_json(name, step, status, message)
        body.append(value)
    return body


def post_all_tests():
    qtest_config = get_config()
    api_token = qtest_config["qtest_api_token"]
    qTestUrl = qtest_config["qtest_url"]
    projectId = os.environ["PROJECT_ID"]
    body = jmeter_parser()

    baseUrl = '{}/api/v3/projects/{}/auto-test-logs'

    testLogUrl = baseUrl.format(qTestUrl, projectId)

    try:
        update = sys.argv[2]
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
        'execution_date': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'test_cycle': testCycle
    }

    key = '{}'
    key = key.format(api_token)
    headers = {'Content-Type': 'application/json',
           "Authorization": key}
    params = {'type': 'automation'}

    r = requests.post(testLogUrl, params=params, data=json.dumps(payload), headers=headers)
    print(r.text)

def post_test_cycle():
    qtest_config = get_config()
    api_token = qtest_config["qtest_api_token"]
    qTestUrl = qtest_config["qtest_url"]
    projectId = os.environ["PROJECT_ID"]

    baseUrl = '{}/api/v3/projects/{}/test-cycles/'

    testLogUrl = baseUrl.format(qTestUrl, projectId)
    payload = {
        "id": 1,
        "name": "Jmeter Automated Tests",
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

    baseUrl = '{}/api/v3/projects/{}/search/'

    testLogUrl = baseUrl.format(qTestUrl, projectId)
    payload = {
      "object_type": "test-cycles",
      "fields": [
        "*"
      ],
      "query": "'name' ~ 'Jmeter Automated Tests'"
    }

    key = '{}'
    key = key.format(api_token)
    headers = {'Content-Type': 'application/json',
           "Authorization": key}

    r = requests.post(testLogUrl, data=json.dumps(payload), headers=headers)
    string = json.loads(r.text)
    testcycleId = None
    for attrib in string['items']:
        name = attrib.get('name')
        if name == "Jmeter Automated Tests":
            testcycleId = attrib.get('id')
    if testcycleId is None:
        testcycleId = post_test_cycle()
    return testcycleId
