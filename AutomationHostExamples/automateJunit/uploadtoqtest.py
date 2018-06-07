import time
import os
import json
import requests
import base64
import ast
import sys
from functions import get_config, create_test_logs_json, post_test_cycle, get_test_cycle

testbody = []


def parse_junit_results(classname, name):
    try:
        from BeautifulSoup import BeautifulSoup
    except ImportError:
        from bs4 import BeautifulSoup
    try:
        directory = sys.argv[2]
        directory = './' + directory
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
    for file in files:
        if file.startswith('TEST-' + classname):
            xml = open(path + file)
            soup = BeautifulSoup(xml, 'xml')
            failureLog = ''
            message = ''
            status = ''
            tag = soup.find(attrs={"name": name})
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
                testbody.append(value)

def post_test_log():
    qtest_config = get_config()
    api_token = qtest_config["qtest_api_token"]
    qTestUrl = qtest_config["qtest_url"]
    projectId = os.environ["PROJECT_ID"]
    dictionary = ast.literal_eval(sys.argv[1])
    for key in dictionary:
        for elem in dictionary.get(key):
            className = key
            methodName = elem
            parse_junit_results(className, methodName)

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