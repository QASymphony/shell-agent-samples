#!/bin/bash

# This is an example that just logs scheduled jobs to the console

projectid=$1

echo projectid: $projectid

# Update the code
git -C /Users/elise/Repos/mahn-cucumber-bdd pull


# TODO, another option to just run the scheduled tests; for now this just runs the suite
# Another shell script and another agent could be set up to spot-execute if needed

# Run all the tests
mvn -f /Users/elise/Repos/cucumber-bdd test

# TO run just one feature file:
# mvn -f /Users/elise/Repos/cucumber-bdd test -Dcucumber.options="src/test/resources/features/Parent_creating_child_accounts.feature"

# Upload the results; pass in the results file into the python script

python3 triggerPulse.py

echo DONE
