#!/bin/bash

echo PROJECTID
echo $1

node uploadNewmanToQTest.js -o $1 -f newman-json-result.json -c creds.json -i true

echo DONE
