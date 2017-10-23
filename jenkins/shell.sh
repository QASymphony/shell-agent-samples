#!/bin/bash

projectname=$1
projectid=$2

# Jenkins doesn't like spaces in string parameters out of the box - for demoing, we'll just remove them
projectname=$(echo $projectname | tr -d ' ')

echo projectname: $projectname
echo projectid: $projectid

CRUMB=$(curl -s 'http://Elise:bd6cb92ba939cae49356d01a9dd9ce89@localhost:8080/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,":",//crumb)')

curl -X POST http://localhost:8080/job/JenkinsShellAgentDemo/build \
      --user Elise:bd6cb92ba939cae49356d01a9dd9ce89 \
      -H $CRUMB \
      --data-urlencode json='{"parameter": [{"name":"PROJECTNAME", "value":"'$projectname'"}, {"name":"PROJECTID", "value":"'$projectid'"}]}'


echo DONE
