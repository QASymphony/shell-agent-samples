#!/bin/bash

# This is an example that just logs scheduled jobs to the console

projectid=$1

echo projectid: $projectid

# Update the code
# TODO add postman to version control and run this... 
# git -C /Users/elise/Repos/folder_name pull

# TODO, another option to just run the scheduled tests; for now this just runs the suite
# Another shell script and another agent could be set up to spot-execute if needed

# Run all the tests
newman run /Users/elise/Repos/manhattan/mahn-postman/Manhattan.postman_collection.json -e /Users/elise/Repos/manhattan/mahn-postman/ManhattanEnv.postman_environment.json --reporters json,cli --reporter-json-export results.json

# Upload the results; pass in the results file into the python script
python3 triggerPulse.py

echo DONE
