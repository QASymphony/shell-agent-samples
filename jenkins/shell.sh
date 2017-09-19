#!/bin/bash

CRUMB=$(curl -s 'http://Elise:bd6cb92ba939cae49356d01a9dd9ce89@localhost:8080/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,":",//crumb)')

curl -X POST http://localhost:8080/job/JenkinsShellAgentDemo/build \
      --user Elise:bd6cb92ba939cae49356d01a9dd9ce89 \
      -H $CRUMB \
      --data-urlencode json='{"parameter": [{"name":"PROJECTNAME", "value":"'$1'"}, {"name":"PROJECTID", "value":"'$2'"}]}'


echo DONE
