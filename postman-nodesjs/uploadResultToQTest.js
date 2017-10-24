const commandLineArgs = require('command-line-args');
var request = require('request');
var fs = require('fs');
var promise = require('promise');

const optionDefinitions = [
  { name: 'file', alias: 'f', type: String },
  { name: 'format', alias: 'm', type: String, defaultValue: 'newman-json'},
  { name: 'usetestcaseid', alias: 'i', type: Boolean, defaultOption: false },
  { name: 'regex', alias: 'r', type: String, defaultValue: '(.*)' },
  { name: 'parentId', alias: 'p', type: String},
  { name: 'parentType', alias: 't', type: String, defaultValue: 'root'},
  { name: 'credentials', alias: 'c', type: String},
  { name: 'help', alias: 'h', type: Boolean},
  { name: 'projectId', alias: 'o', type: String},
  { name: 'projectName', alias: 'n', type: String},
  { name: 'jobStatus', alias: 'j', type: String},
  { name: 'dynamic', alias: 'd', type: String}
];

const options = commandLineArgs(optionDefinitions);

if (options.help) {
  var helptext = fs.readFileSync('help.txt', 'utf8');
  console.log(helptext);
  process.exit(0);
}

HandleOptions(options, function(err) {
  if (err) {
    console.log(err);
    process.exit(-1);
  }
});

var creds = JSON.parse(fs.readFileSync('creds.json', 'utf8'));
//Login(creds, findAllTestCases);
Login(creds).then(function (res) {
  findAllTestCases(res);
}, function (err) {
    HandleErrorAndExit(err);
});

function HandleErrorAndExit(err) {
  console.log(err);
  process.exit(-1);
}

// Deal with missing requirement command line parameters
function HandleOptions(options, cb) {
  if (!options.file) {
    cb('Missing required input file. Try -h for help');
  }

  if (!options.projectId) {
    cb('Missing required project Id file. Try -h for help');
  }

  if (!options.credentials) {
    cb('Missing required credentials file. Try -h for help');
  }
}

// Login and get token (basic authentication)
function Login(creds) {
  return new Promise(function (resolved, reject) {
      // NOTE: The documentation says to leave the password empty here so
      //   it's just the email and colon encoded
      var auth = 'Basic ' + new Buffer(creds.email + ':').toString('base64');

      var opts = {
          url: creds.qtestProtocols + "://" + creds.qtestUrl +  ":" + creds.qtestPort + "/oauth/token",
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': auth
          },
          form: {
              grant_type: 'password',
              username: creds.email,
              password: creds.password
          }
      };
      request.post(opts, function(err, response, body) {
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

function ParseResultsFile() {
  console.log("projectId: " + options.projectId);
  console.log("jobStatus: " + options.jobStatus); 
  console.log("projectName: " + options.projectName); 
  if(options.hasOwnProperty('dynamic'))  
    console.log("dynamic: " + options.dynamic);  

  getQTEObjectFromAgentParameterPath();

  var executionResults = [];

  if (options.format == 'newman-json') {
    var testCaseId;
    var results = JSON.parse(fs.readFileSync(options.file, 'utf8'));

    // Loop through all test results in JSON file
    var testExecutions = results.run.executions;
    testExecutions.forEach(function(exec, index) {
    if (!options.usetestcaseid) {
        testCaseId = 0;
    }
    else{
        var reg = new RegExp(options.regex, 'i');
        match = reg.exec(exec.item.name);
        reg = undefined;
        reg = new RegExp('[0-9]', 'i');
        var nextMatch = reg.exec(match[0]);
        testCaseId = nextMatch ? parseInt(nextMatch[0]) : 0;
    }
      // Create the test run log that we will upload later
      var execution = {
        name: exec.item.name,
        status: 'PASS',
        testCaseId: testCaseId,
        error : '\n'
      };

      // Set pass unless one of the assertions has an error
      exec.assertions.forEach(function(assertion, i) {
        if (assertion.error) {
            execution.status = 'FAIL';
            execution.error += execution.error + assertion.error.message + " \n Stack: " + assertion.error.stack;
        }
      });
      executionResults.push(execution);
    });
  }
  return executionResults;
}

function findAllTestCases(token) {
  var customFields;
  var executionResults = ParseResultsFile();

  GetFieldsOfTestCase(token).then( function (res) {
      customFields = res;

      uploadTestResultsToQTest(executionResults, token, customFields);

  }, function (err){
      HandleErrorAndExit("Error: " + err);
  }).then(function (res) {
  });

}

function uploadTestResultsToQTest(executionResults, token, customFields){
  return new Promise(function (resolved, reject) {
      var uploadTestRunLog = function (index, executionResults) {
          if(index >= executionResults.length){
            resolved(true);
            return;
          }
          submitTestLogPerTestRun(executionResults[index], token, customFields).then(function (res) {
            if(res == true){
                uploadTestRunLog(index + 1, executionResults);
            }
            else{
              console.log('Failed to submit test log');
            }
          });
      };
      uploadTestRunLog(0,executionResults);
  })
}

function submitTestLogPerTestRun(run, token, customFields){
  var status = false;
  return new Promise(function (resolved, reject) {
      if (run.testCaseId == 0) {
          SearchTestCase(run, token).then(function (res) {
            if(res == false){
                CreateAutoTestCase(run, token, customFields).then(function () {
                    status = searchTestRunAndUploadResults(run, token);
                    resolved(status);
                }, function (err) {
                    HandleErrorAndExit(err);
                })
            }
            else{
                searchTestRunAndUploadResults(run, token).then(function(status){
                    resolved(status);
                }, function (err) {
                    HandleErrorAndExit(err);
                });
            }
          }, function (err) {
              reject(err);
          });
      }
      else{
          searchTestRunAndUploadResults(run, token).then(function(status){
              resolved(status);
          }, function (err) {
              HandleErrorAndExit(err);
          });
      }
  });
}

function searchTestRunAndUploadResults(run, token){
    //search test run
    return SearchTestRun(run,token).then(function (res) {
        return uploadResultsToQTest(run, res, token).then(function (res) {
            results = res;
            return res;
        })
    }, function (err) {
        HandleErrorAndExit(err);
        return false;
    });
}

function uploadResultsToQTest(run, listTestRuns, token){
  return new Promise (function (resolved, reject) {
      var submitTestLogPerTestRun = function (index, listTestRuns) {
        if(index >= listTestRuns.length){
          resolved(true);
          return;
        }
        UploadResults(run, listTestRuns[index], token).then(function (res) {
            submitTestLogPerTestRun(index + 1, listTestRuns);
        }, function (err) {
            HandleErrorAndExit(err);
        })
      };
      submitTestLogPerTestRun(0, listTestRuns);
  });
}

function GetFieldsOfTestCase(token) {
  return new Promise(function (resolved, reject) {
      var opts = {
          url: creds.qtestProtocols + "://" + creds.qtestUrl +  ":" + creds.qtestPort + "/api/v3/projects/" + options.projectId + "/settings/test-cases/fields",
          json: true,
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'bearer ' + token
          }
      };
      request.get(opts, function (err, response, body) {
          if(err)
            reject("Unable to get field of test case: " + err);
          else
            resolved(body);
      })
  });
}

function SearchTestCase(run, token){
  return new Promise(function (resolved, reject) {
      //use testCaseName as automation_content field
      var query = "'Automation Content' = '" + run.name + "'";
      var opts = {
          url: creds.qtestProtocols + "://" + creds.qtestUrl +  ":" + creds.qtestPort + "/api/v3/projects/" + options.projectId + "/search",
          json: true,
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'bearer ' + token
          },
          body: {
              object_type: 'test-cases',
              fields: ['*'],
              query: query
          }
      };

      request.post(opts, function(err, response, body) {
          if (err) {
              reject("Unable to search test case: " + err);
          } else {
              if(response.statusCode == 200) {
                  if (body.total > 100) {
                      reject("Returned more than 100 matching runs! This software isn't built to handle this... yet!");
                  } else if (body.items.length == 0) {
                      resolved(false);
                  } else {
                      //get first test case which is matched with automation content
                      run.testCaseId = body.items[0].id;
                      resolved(true);
                  }
              }
              else{
                  reject('Response code: ' + response.statusCode + " with message " + response.statusMessage);
              }
          }
      })
  })
}

function CreateAutoTestCase(run, token, customFields) {
  return new Promise(function (resolved, reject) {
      var properties = [];
      var itemField;
      //init some data for test case object
      customFields.forEach(function(item, index) {
          itemField = {};
          if (item.original_name == "AutomationTestCase") {
              itemField.field_id = item.id;
              for (var i = 0; i < item.allowed_values.length; i++) {
                  if (item.allowed_values[i].label == 'Yes') {
                      itemField.field_value = item.allowed_values[i].value;
                  }
              }
          }
          if (item.original_name == 'ClassIdTestCase') {
              itemField.field_id = item.id;
              itemField.field_value = run.name;
          }
          if (itemField.hasOwnProperty('field_id')) {
              properties.push(itemField);
          }
      });
      var opts = {
          url: creds.qtestProtocols + "://" + creds.qtestUrl +  ":" + creds.qtestPort + "/api/v3/projects/" + options.projectId + "/test-cases",
          json: true,
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'bearer ' + token
          },
          body: {
              name: run.name,
              properties: properties
          }
      };
      request.post(opts, function(err, response, body) {
          if (err) {
              reject("Error creating new automation test case: " + err);
          } else {
              run.testCaseId = body.id;
              resolved();
          }
      });
  });
}

function SearchTestRun(run, token){
  return new Promise(function (resolve, reject) {
      //find test run and upload result and get our matching test runs
      var query = "'Test Case Id' = '" + run.testCaseId + "'";
      if (!options.usetestcaseid) {
          query = "'Name' = '" + run.testcase + "'"; // Note that this is the name of the Test Case, not Test Run
      }
      var opts = {
          url: creds.qtestProtocols + "://" + creds.qtestUrl +  ":" + creds.qtestPort + "/api/v3/projects/" + options.projectId + "/search",
          json: true,
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'bearer ' + token
          },
          body: {
              object_type: 'test-runs',
              fields: ['*'],
              query: query
          }
      };
      request.post(opts, function(err, response, body) {
          if (err) {
              reject("Error querying parent folder: " + err);
          } else {
              if (body.total > 100) {
                  reject("Returned more than 100 matching runs! This software isn't built to handle this... yet!");
              } else if (body.hasOwnProperty('items') && body.items.length == 0) {
                  //create new test run
                  CreateAutoTestRun(run, token).then(function (res) {
                     resolve(res);
                  });
              } else {
                resolve(body.items);
              }
          }
      });
  });
}

function CreateAutoTestRun(run, token) {
  var query = '';
  return new Promise(function(resolve, reject){
      // empty/anything else is root
      if (options.parentId) {
          query = "?parentId=" + options.parentId;
          if (options.parentType)
              query += "parentType=" + options.parentType;
      }
      var opts = {
          url: creds.qtestProtocols + "://" + creds.qtestUrl +  ":" + creds.qtestPort + "/api/v3/projects/" + options.projectId + "/test-runs" + query,
          json: true,
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'bearer ' + token
          },
          body: {
              name: run.name,
              test_case: {
                  id: run.testCaseId
              }
          }
      };
      request.post(opts, function(err, response, body) {
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

// Accepts items, an array of test-run objects
// Could use Submit a Test Log or automation log depending on how you want your test cases linked
function UploadResults(run, item, token) {
  return new Promise(function (resolve, reject){
      var opts = {
          url: creds.qtestProtocols + "://" + creds.qtestUrl +  ":" + creds.qtestPort + "/api/v3/projects/" + options.projectId + "/test-runs/" + item.id + "/auto-test-logs",
          json: true,
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'bearer ' + token
          },
          body: {
              status: run.status,
              exe_start_date: new Date(),
              exe_end_date: new Date(),
              name: item.pid + ":" + run.name,
              note: run.error ? run.error : "Successful automation run"
          }
      };
      request.post(opts, function(err, response, body) {
          if (err) {
              reject("Error uploading test result with values : " + JSON.stringify(opts) + "\n\nERROR: " + err);
          } else {
              console.log("Successfully uploaded test case [" + run.testCaseId + "] with status " + run.status + " to test run " + item.pid);
              resolve();
          }
      });
  });

}

//get QTE object from PARAMETERS_PATH
function getQTEObjectFromAgentParameterPath(){
  if(process.env.hasOwnProperty('QTE_SCHEDULED_TX_DATA')){
    console.log('Value of process.env.QTE_SCHEDULED_TX_DATA: ' + process.env.QTE_SCHEDULED_TX_DATA);
    console.log('---------------------------------------------');

    if(process.env.QTE_SCHEDULED_TX_DATA != ""){
      var opts = {
        url: process.env.QTE_SCHEDULED_TX_DATA,
        json: true,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      request.get(opts, function(err, response, body){
        if (err)
          HandleErrorAndExit('Error getting QTE json object from agent.\n\nERROR: ' + err );
        else{
          if(body != undefined){
          console.log('body: ' + JSON.stringify(body));
          //var testRunsObj = body.testRuns;
          var field , strTestRun, index;
          var testRunsObj = body.QTE.testRuns;
          strTestRun= "";
          for(index=0; index < testRunsObj.length; index ++) {
              field = testRunsObj[index];
              strTestRun += "====================\n";
              for (var k in field) {
                  if (field.hasOwnProperty(k)) {
                      strTestRun += k + ' field has value "' + field[k] + '"\n';
                  }
              }
              strTestRun += "\n====================\n";
          }
          strTestRun += "\nDYNAMIC \n";
          strTestRun += "\n====================\n";
          if(body.hasOwnProperty('dynamic')){
            for (var k in body.dynamic) {
                if (body.dynamic.hasOwnProperty(k)) {
                   strTestRun += k + ' has value "' + body.dynamic[k] + '"\n';
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