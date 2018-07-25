#!/bin/bash

projectid=$1
releasepid=$2
automationsuite=$3

# Jenkins doesn't like spaces in string parameters out of the box - for demoing, we'll just remove them
projectname=$(echo $projectname | tr -d ' ')

echo projectid: $projectid
echo releasepid: $releasepid
echo automationsuite: $automationsuite

/Library/Frameworks/Python.framework/Versions/3.6/bin/behave -f json -o results.json 

python3 formatPythonBehaveResults.py

python3 createTCAndUploadResults.py $projectid $releasepid $automationsuite

echo DONE
