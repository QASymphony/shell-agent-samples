# Prerequisites
#   There must be a results.json file as created by a python behave script to exist in this folder
#   Example of how to execute with the appropriate formatter:
#       /Library/Frameworks/Python.framework/Versions/3.6/bin/behave -f json -o results.json

# What this does
#   Reads in Python Behave JSON output
#   Puts resulting file called formattedParsedResults.json in the same directory
#   Formatting for this file looks like:
#
# {
#     "testResults": [
#         {
#             "automationcontent" : "testFileLocation#ScenarioName",
#             "name" : "scenarioName",
#             "moduleNameIfNew" : "testFileLocation",
#             "steps" : [
#                 {
#                     "description" : "Given something happened",
#                         "expected": "Given",
#                         "order": 1,
#                         "status": "PASS",
#                         "duration": 1000
#                 },
#                 {
#                     "description" : "When something was clicked",
#                         "expected": "When",
#                         "order": 2,
#                         "status": "PASS",
#                         "duration": 2000
#                 },
#                 {
#                     "description" : "Then something was supposed to happen",
#                         "expected": "Then",
#                         "order": 3,
#                         "status": "PASS",
#                         "duration": 2000
#                 },
#                 {
#                     "description" : "And something was was supposed else was to happen",
#                         "expected": "And",
#                         "order": 4,
#                         "status": "FAIL",
#                         "duration": 2000,
#                         "error_message": "fail happened amd this the fail stack trace of sorts"
#                 }  
#             ]
#         },
#         {
#             "automationcontent" : "testFileLocation#ScenarioName",
#             "name" : "scenarioName",
#             "moduleNameIfNew" : "testFileLocation",
#             "steps" : [
#                 {
#                     "description" : "Given something happened",
#                         "expected": "Given",
#                         "order": 1,
#                         "status": "PASS",
#                         "duration": 1000
#                 },
#                 {
#                     "description" : "When something was clicked",
#                         "expected": "When",
#                         "order": 2,
#                         "status": "PASS",
#                         "duration": 2000
#                 },
#                 {
#                     "description" : "Then something was supposed to happen",
#                         "expected": "Then",
#                         "order": 3,
#                         "status": "PASS",
#                         "duration": 2000
#                 },
#                 {
#                     "description" : "And something was was supposed else was to happen",
#                         "expected": "And",
#                         "order": 4,
#                         "status": "FAIL",
#                         "duration": 2000,
#                         "error_message": "fail happened amd this the fail stack trace of sorts"
#                 }  
#             ]
#         }
#     ]
# }

import os
import json
import re
import requests
import base64
from pprint import pprint

testResults = []

with open('results.json') as results:    
    data = json.load(results)

    # loop through scenarios - each is a new test case
    # each given/when/then will be a step
    for featurefile in data:
        for scenario in featurefile['elements']:

            testResult = {}
            
            m = re.search('(.*):\d+', scenario['location'])
            if m:
                testResult['automationcontent'] = m.group(1) + "#" + str(scenario['name'])
            else:
                exit
            
            testResult['name'] = scenario['name']
            testResult['description'] = ""

            # Just dump all the test cases into this one folder called PythonBehaveTests
            testResult['moduleNameIfNew'] = "PythonBehaveTests" 

            steps = list()

            i = 1
            hasFail = False
            for step in scenario['steps']:
                stepToAdd = {}
                stepToAdd['description'] = step['step_type'] + ' ' + step['name']
                
                stepToAdd['expected'] = step['step_type'] 
                #stepToAdd['order'] = i

                if 'result' in step:
                    stepToAdd['status'] = step['result']['status']

                    if 'error_message' in step['result']:
                        stepToAdd['error_message'] = step['result']['error_message']
                        hasFail = True

                steps.append(stepToAdd)
                i = i+1

                pprint(step)
                testResult['description'] = testResult['description'] + step['keyword'] + " " + step['name'] + '\n'

            testResult['steps'] = steps    
            testResult['status'] = "FAIL" if hasFail else "PASS"
            testResults.append(testResult)

# TODO : Write to formattedParsedResultsTRY.json
with open('formattedParsedResults.json', 'w') as outfile:
    json.dump(testResults, outfile, indent = 4, ensure_ascii = False)