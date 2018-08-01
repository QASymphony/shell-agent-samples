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

def get_jenkins_config():
    # Check to ensure the configuration file exists and is readable.
    try:
        path = pathlib.Path("jenkinsconfig.json")
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

def get_console_output():
    config = get_jenkins_config()
    JenkinsJob = sys.argv[3]
    JenkinsAPIToken = config[JenkinsJob]['JenkinsAPIToken']
    JenkinsJobName = config[JenkinsJob]['JenkinsJobName']
    JenkinsJobToken = config[JenkinsJob]['JenkinsJobToken']
    JenkinsURL = config[JenkinsJob]['JenkinsURL']
    JenkinsUserName = config[JenkinsJob]['JenkinsUserName']
    getConsoleOutputUrl = "http://" + JenkinsUserName + ":" + JenkinsAPIToken + "@" +  JenkinsURL + "/job/" + JenkinsJobName + "/lastBuild/consoleText"
    output = requests.get(getConsoleOutputUrl)
    output = base64.b64encode(bytes(output.text, 'utf-8'))
    output = output.decode('utf-8')
    value = {'name': 'ConsoleText.txt', 'content_type': 'application/json', 'data': output}
    return value

def create_test_logs_json(runName, stepName, status, note, log, start, end, output):
    attachment = []
    attachment.append(output)
    if start is None:
        start = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    if end is None:
        end = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    if log is not '':
        value = {'name': stepName, 'content_type': 'application/json', 'data': log}
        attachment.append(value)
    body = {'exe_start_date': start,
            'exe_end_date': end,
            'note': note,
            'name': runName,
            'status': status,
            'automation_content': runName + '#' + stepName,
            'attachments': attachment,
            'module_names': [runName, stepName]
            }
    return body


def parse_xml(output):
    try:
        from BeautifulSoup import BeautifulSoup
    except ImportError:
        from bs4 import BeautifulSoup
    try:
        path = sys.argv[1]
        file = '../{}/bin/Debug/TestResult.xml'
        file = file.format(path)
        xml = open(file)
    except:
        print('Error: Enter a valid file path argument or file not found or inaccessible')
        return -1
    body = []
    soup = BeautifulSoup(xml, 'xml')
    message = ''
    log = ''
    for tag in soup.find_all('test-case'):
        try:
            runName = tag['classname']
            stepName = tag['methodname']
        except:
            runName = tag['fullname']
            stepName = tag['name']
        status = tag['result']
        if tag.find('start-time') is not None and tag.find('end-time') is not None:
            start = tag['start-time']
            startArr = start.split()
            start = startArr[0] + 'T' + startArr[1]
            end = tag['end-time']
            endArr = end.split()
            end = endArr[0] + 'T' + endArr[1]           
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
        value = create_test_logs_json(runName, stepName, status, message, log, start, end, output)
        body.append(value)
    return body


def post_all_tests():
    qtest_config = get_config()
    api_token = qtest_config["qtest_api_token"]
    qTestUrl = qtest_config["qtest_url"]
    projectId = qtest_config["project_id"]
    output = get_console_output()
    
    body = parse_xml(output)

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

def post_test_cycle():
    qtest_config = get_config()
    api_token = qtest_config["qtest_api_token"]
    qTestUrl = qtest_config["qtest_url"]
    projectId = qtest_config["project_id"]

    baseUrl = '{}/api/v3/projects/{}/test-cycles/'

    testLogUrl = baseUrl.format(qTestUrl, projectId)
    payload = {
        "id": 1,
        "name": "Selenium Automated Tests",
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
    projectId = qtest_config["project_id"]

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
        if name == "Selenium Automated Tests":
            testcycleId = attrib.get('id')
    if testcycleId is None:
        testcycleId = post_test_cycle()
    return testcycleId
