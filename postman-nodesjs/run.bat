echo off
echo PROJECTID=%1
echo PROJECTNAME=%2
echo JOBSTATUS=%3

node uploadResultToQTest.js -f newman-json-result.json -c creds.json -i true -o %1 -n %2 -j %3

echo DONE



