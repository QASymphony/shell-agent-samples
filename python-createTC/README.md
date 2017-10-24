# Execute a Python Behave Test and upload Test Cases and Results to qTest

SETUP

    Install chrome driver on your machine. The driver must be in your path to execute.
    Install python and behave

NAME

    shell.sh

SYNOPSIS

    shell.sh

DESCRIPTION

    The shell script will kick off all behave pythong tests and execute the following scripts:
    
        behave 

        1. This script will execute the entire behave test suite

        formatPythonBehaveResults.py

        1. This script will parse the behave file output and put it into a file call
          formattedParsedResults.json as the format as outlined in
          formattedParsedResults-sample.json

        createTCAndUploadResults.py

        1. This script will create Test Cases if they don't exist
