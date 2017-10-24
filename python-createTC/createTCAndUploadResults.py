# Prerequisites
#  This script expects a formatted file to be called formattedParsedResults.json in the same directory
#  Update the automationContentFieldId value to match your project
#  Update the automationId value to match your project

# Parameters
#   Parent Module Id for test cases to be created; default is root

# What this does
#  Creates test cases if they do not already exist with the given automated content
#  Uploads Results, it will dump them into the most recently created release 
#    in a test Suite called AutomationResults
#  If this folder/date exists, a new log will be created instead of a new run in that folder
# NOTE: This could be done differently with the auto test logs; it will create test cases for you. This example
#  manually creates everything

import os
import sys
import json
import re
import requests
import base64
from html import escape
from pprint import pprint
from requests.auth import HTTPBasicAuth
from datetime import datetime

# These can be obtained from the /fields call, but won't change per project
automationContentFieldId = 2860303
automationId = 2860302
automationFieldValue = 711 # yes

executedRuns = {}
testResults = []
creds = {}
QTE = {}
QTE['projectid'] = sys.argv[1]
QTE['releasePid'] = sys.argv[2]
QTE['suiteName'] = sys.argv[3]

testcases = {}

headers = {
    "Content-Type" : "application/json",
}

with open('creds.json') as credentials:    
    creds = json.load(credentials)

with open('formattedParsedResults.json') as results:    
    testResults = json.load(results)

def Login():
    url = creds['instance'] + "/oauth/token"

    toencode = creds['email'] + ':'

    auth = "Basic " + (base64.b64encode(toencode.encode('utf-8')).decode('utf-8'))

    authHeaders = {
        "Content-Type" : "application/x-www-form-urlencoded",
        "Authorization" : auth
    }

    body = {
        "grant_type" : "password",
        "username" : creds['email'],
        "password" : creds['password']
    }

    myResponse = requests.post(url = url, headers = authHeaders, data = body)

    if(myResponse.ok):
        response = json.loads(myResponse.content)
        token = "bearer " + response['access_token']
        headers['Authorization'] = token
        return token
    else:
        myResponse.raise_for_status()


# Creates test cases if they do not exist (based on automation content)
# Find matches based on all automation_contents we've gathered (locations)
def FindMatchingtestCases():
    url = creds['instance'] + "/api/v3/projects/" + QTE['projectid'] + "/search"

    content = []
    for result in testResults:
        content.append("'Automation Content' = '" + result['automationcontent'] + "'")
        
    query = ' or '.join(content)

    body = {
        "object_type" : "test-cases",
        "fields" : ["*"],
        "query" : query
    }

    dbody = json.dumps(body)

    myResponse = requests.post(url = url, headers = headers, data = dbody)

    if(myResponse.ok):
        response = json.loads(myResponse.content)

        matches = {}

        for match in response['items']:
            for prop in match['properties']:
                if(prop['field_id'] == automationContentFieldId):
                    
                    for r in testResults:
                        if(r['automationcontent'] == prop['field_value']):
                            r['hasMatch'] = True
                            r['testcaseId'] = match['id']
                            r['name'] = match['name']
                            r['test_steps'] = match['test_steps']

                            testcases[str(r['testcaseId'])] = r
                    
        # TODO - if the total is > 100, need to get the remaining pages/items (would need to be 
        #  sending in more items to match, of course)
    else:
        myResponse.raise_for_status()

# Look for a matching automation content within the runs provided
# Automation content is the filepath_from_features#scenarioname
def CreateTestCases():
    for result in testResults:

        if 'hasMatch' not in result:
            url = creds['instance'] + "/api/v3/projects/" + QTE['projectid'] + "/test-cases"
            
            # TODO: Add parent id module to put this somewhere cleaner than "Created via API" folder
            result['description'] = escape(result['description'])
            result['description'] = result['description'].replace("\n","<br/>\n")
            body = {
                "name" : result['name'],
                "description" : result['description'],
                "properties" : [{
                    "field_id" : automationContentFieldId,
                    "field_value" : result['automationcontent']
                },
                {
                    "field_id" : automationId,
                    "field_value" : automationFieldValue
                }],
                "test_steps" : result['steps'] 
            }

            dbody = json.dumps(body)
            myResponse = requests.post(url = url, headers = headers, data = dbody)

            if(myResponse.ok):
                response = json.loads(myResponse.content)
                testcases[str(response['id'])] = response
                result['testcaseId'] = response['id'] # Set the test case id in the results object for later
            else:
                myResponse.raise_for_status()

def GetReleaseId():
    url = creds['instance'] + "/api/v3/projects/" + QTE['projectid'] + "/releases"

    myResponse = requests.get(url = url, headers = headers)

    if(myResponse.ok):
        response = json.loads(myResponse.content)
        for rel in response:
            if(rel['pid'] == QTE['releasePid']):
                return rel['id']

        return null
    else:
        myResponse.raise_for_status()

# Creates the test suite AutomationResults MM/DD/YYYY if it doesn't exist
def GetOrCreateSuite(releaseId):
    url = creds['instance'] + "/api/v3/projects/" + QTE['projectid'] + "/test-suites"

    body = {
        "parentId" : releaseId,
        "parentType" : "release"
    }

    dbody = json.dumps(body)

    myResponse = requests.get(url = url, headers = headers, data = dbody)

    if(myResponse.ok):
        response = json.loads(myResponse.content)
        for suite in response:
            if(suite['name'] == QTE['suiteName']):
                return suite['id']

        return CreateSuite(releaseId)
    else:
        myResponse.raise_for_status()

def CreateSuite(releaseId):

    url = creds['instance'] + "/api/v3/projects/" + QTE['projectid'] + "/test-suites"

    body = {
        "parentId" : releaseId,
        "parentType" : "release",
        "name" : QTE['suiteName']
    }

    dbody = json.dumps(body)
    myResponse = requests.post(url = url, headers = headers, data = dbody)

    if(myResponse.ok):
        response = json.loads(myResponse.content)
        return response['id']
    else:
        myResponse.raise_for_status()

# We have an array of test case IDs, let's grab the matching test cases and add the TC content onto the runs
# NOTE: This will be unnecessarry after some changes to the Manager API are made to include this data with the runs
# Index on the tcID, put automationcontent as first order key

# TODO: Add a page # here to get all the runs if more than 999 test cases in the suite
def GetRuns(suiteId):
    url = creds['instance'] + "/api/v3/projects/" + QTE['projectid'] + "/test-runs"

    params = {
        "parentId" : suiteId,
        "parentType" : "test-suite",
        "pageSize":999  
    }

    # TODO be smarter about pagination
    myResponse = requests.get(url = url, headers = headers, params = params)

    if(myResponse.ok):
        response = json.loads(myResponse.content)

        # Create Run dictionary
        existingRuns = {}
        tcIds = []

        if(response['total'] > 0): 

            for run in response['items']:
            
                # Grab the TC IDs from each run, then get the Test cases
                if('links' in run and len(run['links']) > 0):
                    for link in run['links']:
                        if(link['rel'] == 'test-case'):
                            m = re.search('test-cases/(\d+)\?versionId', link['href'])
                            tcIds.append(m.group(1))
                            run['tcid'] = m.group(1)

                            tcMatch = testcases[run['tcid']]
                            existingRuns[tcMatch['automationcontent']] = run

        return existingRuns

    else:
        myResponse.raise_for_status()

def CreateMissingRuns(suiteId, existingRuns):
    for newResult in testResults:
        if(newResult["automationcontent"] in existingRuns):
            run = existingRuns[newResult["automationcontent"]]
            CreateLog(newResult, run['id'])
        else:   
            runId = CreateRun(newResult, suiteId)
            CreateLog(newResult, runId)

def CreateRun(newResult, suiteId):
    # We should already have a test case for this new Result
    # Let's create the test run under the given suite since it doesn't yet exist
    url = creds['instance'] + "/api/v3/projects/" + QTE['projectid'] + "/test-runs"

    body = {
        "parentId" : suiteId,
        "parentType" : "test-suite",
        "name" : newResult['name'],
        "test_case": {
            "id": newResult['testcaseId']
        }
    }

    dbody = json.dumps(body)

    myResponse = requests.post(url = url, headers = headers, data = dbody)

    if(myResponse.ok):
        response = json.loads(myResponse.content)
        return response['id'] # Return the new test run ID
    else:
        myResponse.raise_for_status()

def CreateLog(testResult, testRunId):
    # TODO: Get the actual start/endtimes and make this less hacky
    testStart = datetime.now().isoformat()[:-3] + "Z"

    url = creds['instance'] + "/api/v3/projects/" + QTE['projectid'] + "/test-runs/" + str(testRunId) + "/auto-test-logs"

    # Did all the steps pass? If something failed, fail the parent
    parentStatus = "passed"
    note = ""

    stepLogObj = []
    for step in testResult['steps']:
        
        if('status' in step):
            if(step['status'] == 'failed'):
                parentStatus = "failed"
                note = note + "<br/>".join(step['error_message'])
            
            stepLog = {
                "description": step['description'],
                "expected_result": step['expected'],
                "status": step['status']
            }

        stepLogObj.append(stepLog)

    body = {
        "status" : parentStatus,
        "exe_start_date" : testStart,
        "exe_end_date" : testStart,
        "automation_content" : testResult['automationcontent'],
        "note":note,
        "test_step_logs": stepLogObj
    }

    dbody = json.dumps(body)

    myResponse = requests.post(url = url, headers = headers, data = dbody)

    if(myResponse.ok):
        response = json.loads(myResponse.content)
    else:
        myResponse.raise_for_status()

    return

Login()
matches = FindMatchingtestCases()
CreateTestCases()
releaseId = GetReleaseId()
suiteId = GetOrCreateSuite(releaseId)
runs = GetRuns(suiteId)

CreateMissingRuns(suiteId, runs)



