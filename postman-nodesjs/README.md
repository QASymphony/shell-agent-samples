# postman-nodejs for shell agent sample

An sample script is built with nodejs to support collect results from json data file and report it to qTest Manager.

## Setup

`npm install` : install necessary of node-modules such as: command line argument, request and promise.

## How to run

`npm `

================

# Node - uploadResultToQTest

SETUP

	Install Node & npm
    Run npm install in this directory to install necessary of node-modules such as: command line argument, request and promise.

NAME

    uploadResultToQTest

SYNOPSIS

    uploadResultToQTest [options]

DESCRIPTION

    Load the result data in json format. Verify that test case name has been existed in qTest Manager or not.
       In case automation test case does not exist, script will:
          - Script will create new automation test case in qTest
          - Add new test run
          - Submit test log result
       The automation test case has already existed and there is no test run, script will
                - Add new test run
                - Submit test log result
        The automation test case and test run have already existed, script will
                - Submit test log result

USAGE

    -f file             Test result file

    -m format           Format of test result file, options are: newman-json

    -i usetestcaseid    If true, will assume name of test result is the test case ID (fastest)
                        If false, will assume name of test result is the test case name

    -r regex            Where the ID or name is looked for (based on usetestcaseid)
                        By default it is the entire test case name

                        Example: (\D+)* if we're looking for digits at the start
                        TC_Name_(.+)$ if we're looking for a name after the words
                        TC_Name_ to the end

    -p parentid         This will look for a matching Release, then Test Cycle,
                        then Test Suite for a matching name
                        This will be the directory structure we will look under
                        for matching test executions

                        NOTE: If a test execution appears twice, BOTH execution results will be added

    -t parenttype       The tyep of folder to look in to store the test results. this is related to parentid
                        Values can be 'release' 'test-suite' or 'test-cycle'

    -c credentials      The file that has the appropriate qTest Credentials for this script.
                        It should be json content like:
                        {
                            email: "<qtest_email>",
                            password: "<qtest_password>",
                            qtestProtocols: "<qtest_protocols>"
                            qtestUrl: "<qtest_url>",
                            qtestPort: "<qtest_port>"
                        }
                        eg:


EXAMPLE

	For the .json results file within this folder, create a creds.json file that looks like:
	{
           "email": "demo@qas.com",
           "password": "demo@#1345",
           "qtestProtocols": "https",
           "qtestUrl": "demo.qtestnet.com",
           "qtestPort": 443
    }

    Update the test case results from json data file (newman-json-result.json) to qTest Manager. You can find the test case IDs in the sample results below.

	node uploadNewmanToQTest.js -f newman-json-result.json -c creds.json -o <qtest_project_id>

    Output:
    Successfully uploaded test case [13514528] with status PASS to test run TR-11
    Successfully uploaded test case [13514544] with status PASS to test run TR-12
    Successfully uploaded test case [13514548] with status FAIL to test run TR-13
    Successfully uploaded test case [13514549] with status PASS to test run TR-14
    Successfully uploaded test case [13514550] with status PASS to test run TR-15
    Successfully uploaded test case [13514551] with status FAIL to test run TR-16
    Successfully uploaded test case [13514552] with status PASS to test run TR-17
    Successfully uploaded test case [13514553] with status FAIL to test run TR-18


