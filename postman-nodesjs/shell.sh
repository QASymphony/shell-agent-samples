#!/bin/bash

echo PROJECTID
echo $1

echo PROJECTNAME
echo $2

echo JOBSTATUS
echo $3

node submitTestResultToQTest.js -f newman-json-result.json -c creds.json -i true -o $1 -n $2 -j $3

echo DONE
