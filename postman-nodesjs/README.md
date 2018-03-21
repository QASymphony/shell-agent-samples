# This is sample automation script for Shell agent

This script stimulates behavior

 - Read results from json data file.
 - Report all results to qTest Manager. 

NAME

    submitTestResultToQTest.js

SYNOPSIS

    submitTestResultToQTest.js [options]

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
                        It should be json content, like below:
                        {
                            email: "<qtest_email>",
                            password: "<qtest_password>",
                            qtestUrl: "<qtest_url>"
                        }

HOW TO RUN

PREREQUISITES

  - Install nodejs from [here](https://nodejs.org/en/download/)
  - Configure nodejs path in your system environment variable.
  - Update your credentials in qTest Manager inside **creds.json** file

SETUP

- Download this sample script to a directory (eg:    E:\shell-agent-samples\postman-nodesjs)
- Update **creds.json** file, for example:

```
    {
        "email": "demo@qas.com",
        "password": "demo@#1345",
        "qtestUrl": "https://demo.qtestnet.com"
    }
```
RUN

- Open command prompt inside the directory which contains sample script, and run command

```
    npm install
    node submitTestResultToQTest.js -f newman-json-result.json -c creds.json -o <qtest_project_id>
```
OUTPUT

```
    Successfully uploaded test case [13514528] with status PASS to test run TR-11
    Successfully uploaded test case [13514544] with status PASS to test run TR-12
    Successfully uploaded test case [13514548] with status FAIL to test run TR-13
    Successfully uploaded test case [13514549] with status PASS to test run TR-14
    Successfully uploaded test case [13514550] with status PASS to test run TR-15
    Successfully uploaded test case [13514551] with status FAIL to test run TR-16
    Successfully uploaded test case [13514552] with status PASS to test run TR-17
    Successfully uploaded test case [13514553] with status FAIL to test run TR-18
```
# qTest automation host
 This section will introduce how to setup qTest Automation Integration with Shell agent
 
# How to use sample script via Shell Agent inside qTest Automation Host
 

1. First, download and install qTest Automation Host [here](https://support.qasymphony.com/hc/en-us/articles/115005225543-Download-Automation-Agent-Host)
2. In qTest automation host, make sure "Shell Agent" is installed in your qTest automation agent host
3. Add new Shell Agent with the detail configuration as below:
### Agent Configuration for windows
Your sample scripts is E:\shell-agent-samples\postman-nodesjs
![Configuration1](/postman-nodesjs/images/shell-agent.png?raw=true)

### Agent Configuration for MacOS / Linux: 
Your sample script is /Users/demo/shell-agent-samples/postman-nodesjs
![Configuration2](/postman-nodesjs/images/shell-agent-2.png?raw=true)
4. In qTest Manager, select a test run which is reported from sample automation project above, click 'Schedule' and choose 'Immediately upon scheduled'
### Schedule
![Configuration3](/postman-nodesjs/images/test-run.png?raw=true)
5. In qTest automation host, select agent to be configured in step 3, click 'Run now'. When the automation script has finished, click 'Show log' to observe all data include system field and custom field of test run / test suite in the log.

Follow this article for more detailed instructions: [Create Shell Agent](https://support.qasymphony.com/hc/en-us/articles/115005558783-Create-Shell-Agent)
