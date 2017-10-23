#!/bin/bash

projectname=$1
projectid=$2

# Jenkins doesn't like spaces in string parameters out of the box - for demoing, we'll just remove them
projectname=$(echo $projectname | tr -d ' ')

echo projectname: $projectname
echo projectid: $projectid

/Library/Frameworks/Python.framework/Versions/3.6/bin/behave -f json -o results.json 

python3 formatPythonBehaveResults.py

python3 createTCAndUploadResults.py $projectid RL-2

echo DONE
