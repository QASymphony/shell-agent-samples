import json
import pathlib
import requests
import os
import time
import sys
import base64


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


def create_test_logs_json(runName, stepName, status, note, log):
    attachment = []
    if log is not '':
        value = {'name': stepName, 'content_type': 'application/json', 'data': log}
        attachment.append(value)
    body = {'exe_start_date': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'exe_end_date': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'note': note,
            'name': runName,
            'status': status,
            'automation_content': runName + '#' + stepName,
            'attachments': attachment,
            'module_names': [runName, stepName]
            }
    return body


def post_all_tests():
    qtest_config = get_config()
    api_token = qtest_config["qtest_api_token"]
    qTestUrl = qtest_config["qtest_url"]
    projectId = os.environ["PROJECT_ID"]
    body = parse_junit_results()

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
    try:
        r = requests.post(testLogUrl, params=params, data=json.dumps(payload), headers=headers)
        print(r.text)
    except:
        print("Error: Unable to post data to qTest Manager API.")
        return -1

def parse_junit_results():
    try:
        directory = sys.argv[1]
    except:
        print("Error: Enter a valid local repository")
        return -1
    try:
        path = '{}/target/surefire-reports/'
        path = path.format(directory)
        files = os.listdir(path)
    except IOError:
        print("Error: Configuration file not found or inaccessible.")
        return -1
    try:
        from BeautifulSoup import BeautifulSoup
    except ImportError:
        from bs4 import BeautifulSoup
    body = []
    for file in files:
        if file.startswith('TEST'):
            xml = open(path + file)
            soup = BeautifulSoup(xml, 'xml')
            failureLog = ''
            message = ''
            status = ''
            for tag in soup.find_all('testcase'):
                if tag is not None:
                    name = tag['classname']
                    step = tag['name']
                    if tag.find('failure') is not None:
                        status = 'FAIL'
                        try:
                            failure = tag.find('failure')
                            message = failure['message']
                            failureLog = base64.b64encode(bytes(failure.text, 'utf-8'))
                            failureLog = failureLog.decode('utf-8')
                        except:
                            message = 'None'
                            failureLog = ''
                    elif tag.find('skipped') is not None:
                        status = 'SKIP'
                    else:
                        status = 'PASS'
                    value = create_test_logs_json(name, step, status, message, failureLog)
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
        "name": "Junit Automated Tests",
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
      "query": "'name' ~ 'Junit Automated Tests'"
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
        if name == "Junit Automated Tests":
            testcycleId = attrib.get('id')
    if testcycleId is None:
        testcycleId = post_test_cycle()
    return testcycleId
