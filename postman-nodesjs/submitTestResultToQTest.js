var commandLineArgs = require("command-line-args");
var request = require("request");
var fs = require("fs");
var promise = require("promise");

const optionDefinitions = [
    { name: "file", alias: "f", type: String },
    { name: "format", alias: "m", type: String, defaultValue: "newman-json" },
    { name: "usetestcaseid", alias: "i", type: Boolean, defaultOption: true },
    { name: "regex", alias: "r", type: String, defaultValue: "(.*)" },
    { name: "parentId", alias: "p", type: String },
    { name: "parentType", alias: "t", type: String, defaultValue: "root" },
    { name: "credentials", alias: "c", type: String },
    { name: "help", alias: "h", type: Boolean },
    { name: "projectId", alias: "o", type: String },
    { name: "projectName", alias: "n", type: String },
    { name: "jobStatus", alias: "j", type: String },
    { name: "dynamic", alias: "d", type: String }
];

/**
 * parses command arguments and store them in the options object
 */
const options = commandLineArgs(optionDefinitions);

if (options.help) {
    var helptext = fs.readFileSync("help.txt", "utf8");
    console.log(helptext);
    process.exit(0);
}

/**
 * validates command arguments, if they are not well-formed, print the error and exit
 */
validateCommandLineArgs(options, function (err) {
    if (err) {
        // print error to the console and exit
        console.log("Command line args validation error: " + err);
        process.exit(-1);
    }
});

/**
 * loads login credentials from creds.json
 */
var creds = JSON.parse(fs.readFileSync("creds.json", "utf8"));
loginToQTest(creds).then(function (accessToken) {
    doOurBusiness(accessToken);
}).catch(function (err) {
    console.log(err);
    handleErrorAndExit(err);
});

/**
 * validates command line arguments  
*/
function validateCommandLineArgs(options, cb) {
    if (!options.file) {
        cb("Missing required input file. Try -h for help");
    }

    if (!options.projectId) {
        cb("Missing required project Id file. Try -h for help");
    }

    if (!options.credentials) {
        cb("Missing required credentials file. Try -h for help");
    }
}

// login and obtain auth token (basic authentication)
function loginToQTest(creds) {
    return new Promise(function (resolved, reject) {
        // note the ":" at the end of the email, it is a MUST
        var auth = "Basic " + new Buffer(creds.email + ":").toString("base64");
        var opts = {
            url: creds.qtestUrl + "/oauth/token",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": auth
            },
            form: {
                grant_type: "password",
                username: creds.email,
                password: creds.password
            }
        };
        request.post(opts, function (err, response, body) {
            if (err) {
                reject("Error logging in: " + err);
            } else {
                var jsonbody = JSON.parse(body);
                if (!jsonbody.access_token) {
                    reject("Unable to log in: " + body)
                }
                resolved(jsonbody.access_token);
            }
        });
    });

}

/**
 * parses new man JSON result
 */
function parseResultsFile() {
    console.log("projectId: " + options.projectId);
    console.log("jobStatus: " + options.jobStatus);
    console.log("projectName: " + options.projectName);
    if (options.hasOwnProperty("dynamic")) {
        console.log("dynamic: " + options.dynamic);
    }

    // this function does nothing here but shows
    // how to access magic variables used by the automation host
    getQTEObjectFromAgentParameterPath();

    var executionResults = [];

    if (options.format == "newman-json") {
        var testCaseId;
        var results = JSON.parse(fs.readFileSync(options.file, "utf8"));

        // loop through all test execution results in JSON file
        var testExecutions = results.run.executions;
        testExecutions.forEach(function (exec, index) {
            if (!options.usetestcaseid) {
                testCaseId = 0;
            }
            else {
                var reg = new RegExp(options.regex, "i");
                match = reg.exec(exec.item.name);
                reg = undefined;
                reg = new RegExp("[0-9]", "i");
                var nextMatch = reg.exec(match[0]);
                testCaseId = nextMatch ? parseInt(nextMatch[0]) : 0;
            }

            // create test run log that we will upload later
            var execution = {
                name: exec.item.name,
                status: "PASS",
                testCaseId: testCaseId,
                error: "\n"
            };

            // Set pass unless one of the assertions has an error
            exec.assertions.forEach(function (assertion, i) {
                if (assertion.error) {
                    execution.status = "FAIL";
                    execution.error += execution.error + assertion.error.message + " \n Stack: " + assertion.error.stack;
                }
            });
            executionResults.push(execution);
        });
    }
    return executionResults;
}

function doOurBusiness(accessToken) {
    var customFields;
    var executionResults = parseResultsFile();

    getFieldsOfTestCase(accessToken).then(function (res) {
        customFields = res;
        uploadTestResultsToQTest(executionResults, accessToken, customFields)
        .then(function() {
            console.log("uploadTestResultsToQTest finished.");
        }).catch(function(err) {
            console.log ("uploadTestResultsToQTest error: " + err);
        });
    }).catch(function(err) {
        handleErrorAndExit("Error: " + err);
    });
}

function uploadTestResultsToQTest(executionResults, token, customFields) {
    return new Promise(function (resolved, reject) {
        var uploadTestRunLog = function (index, executionResults) {
            if (index >= executionResults.length) {
                resolved(true);
                return;
            }
            submitTestLogPerTestRun(executionResults[index], token, customFields).then(function (res) {
                if (res == true) {
                    uploadTestRunLog(index + 1, executionResults);
                }
                else {
                    console.log("Failed to submit test log");
                    resolved();
                }
            });
        };
        uploadTestRunLog(0, executionResults);
    })
}

function submitTestLogPerTestRun(testRun, authToken, customFields) {
    var status = false;
    return new Promise(function (resolved, reject) {
        if (testRun.testCaseId == 0) {
            searchTestCase(testRun, authToken).then(function (res) {
                if (res == false) {
                    createAutomationTestCase(testRun, authToken, customFields).then(function () {
                        status = searchTestRunsAndSubmitResults(testRun, authToken);
                        resolved(status);
                    }, function (err) {
                        handleErrorAndExit(err);
                    })
                }
                else {
                    searchTestRunsAndSubmitResults(testRun, authToken).then(function (status) {
                        resolved(status);
                    }, function (err) {
                        handleErrorAndExit(err);
                    });
                }
            }, function (err) {
                reject(err);
            });
        }
        else {
            searchTestRunsAndSubmitResults(testRun, authToken).then(function (status) {
                resolved(status);
            }, function (err) {
                handleErrorAndExit(err);
            });
        }
    });
}

function searchTestRunsAndSubmitResults(testRun, authToken) {
    // search test run
    return searchTestRuns(testRun, authToken).then(function (res) {
        return submitTestResultsToQTest(testRun, res, authToken).then(function (res) {
            return res;
        })
    }, function (err) {
        handleErrorAndExit(err);
        return false;
    });
}

function submitTestResultsToQTest(testRun, listTestRuns, token) {
    return new Promise(function (resolved, reject) {
        var submitTestRunLogs = function (index, listTestRuns) {
            if (index >= listTestRuns.length) {
                resolved(true);
                return;
            }
            submitATestRunLog(testRun, listTestRuns[index], token).then(function (res) {
                // submit test run log to next test run in the list
                submitTestRunLogs(index + 1, listTestRuns);
            }, function (err) {
                handleErrorAndExit(err);
            })
        };
        submitTestRunLogs(0, listTestRuns);
    });
}

function getFieldsOfTestCase(accessToken) {
    return new Promise(function (resolved, reject) {
        var opts = {
            url: creds.qtestUrl + "/api/v3/projects/" + options.projectId + "/settings/test-cases/fields",
            json: true,
            headers: {
                "Content-Type": "application/json",
                "Authorization": "bearer " + accessToken
            }
        };
        request.get(opts, function (err, response, body) {
            if (err)
                reject("Unable to get field of test case: " + err);
            else
                resolved(body);
        })
    });
}

/**
 * searches for test case using name of the passed in test run. 
 * If found,  associate test case id to the testRun.testCaseId
 */
function searchTestCase(testRun, token) {
    return new Promise(function (resolved, reject) {
        // use test case name as automation_content field
        var query = "'Automation Content' = '" + testRun.name + "'";
        var opts = {
            url: creds.qtestUrl + "/api/v3/projects/" + options.projectId + "/search",
            json: true,
            headers: {
                "Content-Type": "application/json",
                "Authorization": "bearer " + token
            },
            body: {
                object_type: "test-cases",
                fields: ["*"],
                query: query
            }
        };

        request.post(opts, function (err, response, body) {
            if (err) {
                reject("Unable to search test case: " + err);
            } else {
                if (response.statusCode == 200) {
                    if (body.total > 100) {
                        reject("Returned more than 100 matching runs! This software isn't built to handle this... yet!");
                    } else if (body.items.length == 0) {
                        resolved(false);
                    } else {
                        // found it, get first test case's id which is matched with automation content
                        // and associate it with the testRun.testCaseId
                        testRun.testCaseId = body.items[0].id;
                        resolved(true);
                    }
                }
                else {
                    reject("Response code: " + response.statusCode + " with message " + response.statusMessage);
                }
            }
        })
    })
}

function createAutomationTestCase(testRun, authToken, customFields) {
    return new Promise(function (resolved, reject) {
        var properties = [];
        var itemField;
        // init  data for test case object
        customFields.forEach(function (item, index) {
            itemField = {};
            if (item.original_name == "AutomationTestCase") {
                itemField.field_id = item.id;
                for (var i = 0; i < item.allowed_values.length; i++) {
                    if (item.allowed_values[i].label == "Yes") {
                        itemField.field_value = item.allowed_values[i].value;
                    }
                }
            }
            if (item.original_name == "ClassIdTestCase") {
                itemField.field_id = item.id;
                itemField.field_value = testRun.name;
            }
            if (itemField.hasOwnProperty("field_id")) {
                properties.push(itemField);
            }
        });
        var opts = {
            url: creds.qtestUrl + "/api/v3/projects/" + options.projectId + "/test-cases",
            json: true,
            headers: {
                "Content-Type": "application/json",
                "Authorization": "bearer " + authToken
            },
            body: {
                name: testRun.name,
                properties: properties
            }
        };
        request.post(opts, function (err, response, body) {
            if (err) {
                reject("Error creating new automation test case: " + err);
            } else {
                testRun.testCaseId = body.id;
                resolved();
            }
        });
    });
}

function searchTestRuns(testRun, authToken) {
    return new Promise(function (resolve, reject) {
        //find test run and upload result and get our matching test runs
        var query = "'Test Case Id' = '" + testRun.testCaseId + "'";
        if (!options.usetestcaseid) {
            query = "'Name' = '" + testRun.testcase + "'"; // Note that this is the name of the Test Case, not Test Run
        }
        var opts = {
            url: creds.qtestUrl + "/api/v3/projects/" + options.projectId + "/search",
            json: true,
            headers: {
                "Content-Type": "application/json",
                "Authorization": "bearer " + authToken
            },
            body: {
                object_type: "test-runs",
                fields: ["*"],
                query: query
            }
        };
        request.post(opts, function (err, response, body) {
            if (err) {
                reject("Error querying parent folder: " + err);
            } else {
                if (body.total > 100) {
                    reject("Returned more than 100 matching test runs! This software isn't built to handle this... yet!");
                } else if (body.hasOwnProperty("items") && body.items.length == 0) {
                    //create new test run
                    createAutomationTestRun(testRun, authToken).then(function (res) {
                        resolve(res);
                    });
                } else {
                    resolve(body.items);
                }
            }
        });
    });
}

function createAutomationTestRun(testRun, authToken) {
    return new Promise(function (resolve, reject) {
        var query = "";
        // empty/anything else is root
        if (options.parentId) {
            query = "?parentId=" + options.parentId;
            if (options.parentType)
                query += "parentType=" + options.parentType;
        }
        var opts = {
            url: creds.qtestUrl + "/api/v3/projects/" + options.projectId + "/test-runs" + query,
            json: true,
            headers: {
                "Content-Type": "application/json",
                "Authorization": "bearer " + authToken
            },
            body: {
                name: testRun.name,
                test_case: {
                    id: testRun.testCaseId
                }
            }
        };
        request.post(opts, function (err, response, body) {
            if (err) {
                reject("Error creating new automation test run: " + err)
            } else {
                //upload test test results
                var items = [];
                items.push(body);
                resolve(items);
            }
        });
    });
}

/**
 * upload results
 * - items is an array of test-run objects
 * - Could use Submit a Test Log or automation log depending on how you want your test cases linked
 */

function submitATestRunLog(testRun, item, token) {
    return new Promise(function (resolve, reject) {
        var opts = {
            url: creds.qtestUrl + "/api/v3/projects/" + options.projectId + "/test-runs/" + item.id + "/auto-test-logs",
            json: true,
            headers: {
                "Content-Type": "application/json",
                "Authorization": "bearer " + token
            },
            body: {
                status: testRun.status,
                exe_start_date: new Date(),
                exe_end_date: new Date(),
                name: item.pid + ":" + testRun.name,
                note: testRun.error ? testRun.error : "Successfully Automation Run"
            }
        };
        request.post(opts, function (err, response, body) {
            if (err) {
                reject("Error uploading test result with values : " + JSON.stringify(opts) + "\n\nERROR: " + err);
            } else {
                console.log("Successfully uploaded test case [" + testRun.testCaseId + "] with status " + testRun.status + " to test run " + item.pid);
                resolve();
            }
        });
    });

}

// get QTE object from PARAMETERS_PATH
function getQTEObjectFromAgentParameterPath() {
    if (process.env.hasOwnProperty("QTE_SCHEDULED_TX_DATA")) {
        console.log("Value of process.env.QTE_SCHEDULED_TX_DATA: " + process.env.QTE_SCHEDULED_TX_DATA);
        console.log("---------------------------------------------");

        if (process.env.QTE_SCHEDULED_TX_DATA != "") {
            var opts = {
                url: process.env.QTE_SCHEDULED_TX_DATA,
                json: true,
                headers: {
                    "Content-Type": "application/json"
                }
            };
            request.get(opts, function (err, response, body) {
                if (err)
                    handleErrorAndExit("Error getting QTE json object from agent.\n\nERROR: " + err);
                else {
                    if (body != undefined) {
                        console.log("body: " + JSON.stringify(body));
                        //var testRunsObj = body.testRuns;
                        var field, strTestRun, index;
                        var testRunsObj = body.QTE.testRuns;
                        strTestRun = "";
                        for (index = 0; index < testRunsObj.length; index++) {
                            field = testRunsObj[index];
                            strTestRun += "====================\n";
                            for (var k in field) {
                                if (field.hasOwnProperty(k)) {
                                    strTestRun += k + " field has value \"" + field[k] + "\"\n";
                                }
                            }
                            strTestRun += "\n====================\n";
                        }
                        strTestRun += "\nDYNAMIC \n";
                        strTestRun += "\n====================\n";
                        if (body.hasOwnProperty("dynamic")) {
                            for (var k in body.dynamic) {
                                if (body.dynamic.hasOwnProperty(k)) {
                                    strTestRun += k + " has value \"" + body.dynamic[k] + "\"\n";
                                }
                            }
                        }
                        console.log("====================");
                        console.log("test run object: " + strTestRun);
                        console.log("====================");
                    }
                }
            })
        }
    }
}

function handleErrorAndExit(err) {
    console.log(err);
    process.exit(-1);
}