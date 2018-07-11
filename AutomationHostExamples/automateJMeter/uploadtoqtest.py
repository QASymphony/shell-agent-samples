import time
import os
import json
import requests
import ast
import sys
from functions import get_config, create_test_logs_json, post_test_cycle, get_test_cycle

testbody = []

def jmeter_parser(methodName):
    try:
        from BeautifulSoup import BeautifulSoup
    except ImportError:
        from bs4 import BeautifulSoup
    path = sys.argv[2]
    path = './' + path
    files = os.listdir(path)
    maxTime = 0
    currFile = ''
    for file in files:
        if file.endswith('.xml'):
            mTime = os.stat(path + "/" + file).st_mtime
            if mTime > maxTime:
                currFile = path + "/" + file
    xml = open(currFile)
    soup = BeautifulSoup(xml, 'xml')
    message = ''
    tag = soup.find(attrs={"lb": methodName})
    if tag is not None:
        name = tag['tn']
        step = tag['lb']
        if tag['rm'] == 'OK':
                status = 'PASS'
        else:
            status = 'FAIL'
            message = tag['rm']
        value = create_test_logs_json(name, step, status, message)
        testbody.append(value)



def post_test_log():
    qtest_config = get_config()
    api_token = qtest_config["qtest_api_token"]
    qTestUrl = qtest_config["qtest_url"]
    projectId = os.environ["PROJECT_ID"]
    dictionary = ast.literal_eval(sys.argv[1])
    for key in dictionary:
        for elem in dictionary.get(key):
            jmeter_parser(elem)

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
