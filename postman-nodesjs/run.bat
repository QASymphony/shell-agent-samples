echo off
echo PROJECTID=%1
echo PROJECTNAME=%2
echo JOBSTATUS=%3

node submitTestResultToQTest.js -f newman-json-result.json -u -c creds.json -o %1 -n %2 -j %3

echo DONE



