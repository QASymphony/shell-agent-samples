import os
import requests
import json
from pprint import pprint
from functions import get_config


def get_automation_content_id(url, api_token):
    # Gets the automation content field ID from the test case fields for this project.
    try:
        if len(url) > 0 and len(api_token) > 0:
            automation_content_id = 0
            automation_content_response = requests.get(url=url,
                                                       headers={"Content-Type": "application/json",
                                                                "Authorization": api_token})

            if automation_content_response.ok:
                response = json.loads(automation_content_response.text)
                automation_content_id = response

            # If we never hit the right field, kick it out, otherwise return the valid ID.
            if automation_content_id == 0:
                raise Exception
            else:
                return automation_content_id[1].get('id')
    except Exception:
        print("Error: Automation Content Id is missing or improperly set.")
        return -1


def get_test_runs():
    qtest_config = get_config()
    api_token = qtest_config["qtest_api_token"]
    qTestUrl = qtest_config["qtest_url"]
    projectid = os.environ["PROJECT_ID"]
    URL = "{}/api/v3/projects/{}/settings/test-cases/fields"
    URL = URL.format(qTestUrl, projectid)
    API = api_token
    AutomationContentFieldId = get_automation_content_id(URL, API)

    dictionary = {}
    APITOKEN = API
    GetTCURL = "{}/api/v3/projects/" + projectid + "/test-cases/"
    GetTRURL = "{}/api/v3/projects/" + projectid + "/test-runs/"
    GetTCURL = GetTCURL.format(qTestUrl)
    GetTRURL = GetTRURL.format(qTestUrl)
    AutomationContents = ""

    if ('QTE_SCHEDULED_TX_DATA' in os.environ):
        processUrl = os.environ['QTE_SCHEDULED_TX_DATA']

    # pprint("Scheduled Jobs URL: " + processUrl)

        myResponse = requests.get(url=processUrl, headers={"Content-Type": "application/json"})

        if (myResponse.ok):
            try:
                response = json.loads(myResponse.content)
            except:
                return "None"
        # print(json.dumps(response, sort_keys=True, indent=4))

            for testRun in response["QTE"]["testRuns"]:
            # Get the test run to get the test case id
                myTestRunResponse = requests.get(url=GetTRURL + testRun["Id"],
                                             headers={"Content-Type": "application/json", "Authorization": APITOKEN})

                if (myTestRunResponse.ok):
                    myTestRun = json.loads(myTestRunResponse.content)
                # print(json.dumps(myTestRun, sort_keys=True, indent=4))

                # Get the test run to get the test case id
                    myTestCaseResponse = requests.get(url=GetTCURL + str(myTestRun["test_case"]["id"]),
                                                  headers={"Content-Type": "application/json",
                                                           "Authorization": APITOKEN})
                    # make a tuple in python for class name and method name
                    if (myTestCaseResponse.ok):
                        myTestCase = json.loads(myTestCaseResponse.content)
                    # print(json.dumps(myTestCase, sort_keys=True, indent=4))
                        for field in myTestCase["properties"]:
                            if field["field_id"] == AutomationContentFieldId:
                                if AutomationContents:
                                    AutomationContents = " " + AutomationContents + field["field_value"]
                                    index = field['field_value'].index('#')
                                    name = field['field_value'][index + 1: len(field['field_value'])]
                                    className = field['field_value'][0:index]
                                    if className in dictionary:
                                        dictionary[className].append(name)
                                    else:
                                        dictionary[className] = [name]
                                else:
                                    AutomationContents = AutomationContents + field["field_value"]
                                    index = field['field_value'].index('#')
                                    name = field['field_value'][index + 1: len(field['field_value'])]
                                    className = field['field_value'][0:index]
                                    if className in dictionary:
                                        dictionary[className].append(name)
                                    else:
                                        dictionary[className] = [name]

                    else:
                        myTestCaseResponse.raise_for_status()
                else:
                    myTestRunResponse.raise_for_status()

        else:
            myResponse.raise_for_status()
    else:
        pprint("Missing QTE_SCHEDULED_TX_DATA environment variable!")
    return dictionary

print(get_test_runs())
