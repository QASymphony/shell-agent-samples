#!/bin/bash

# This is an example that just logs scheduled jobs to the console

projectid=$1

echo projectid: $projectid

python3 printScheduledJobs.py

echo DONE
