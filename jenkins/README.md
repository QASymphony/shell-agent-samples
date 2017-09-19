# Execute a Jenkins Job by Curl

SETUP

    Create a Jenkins job to be executed on your Jenkins instance
        In this example, we used 2 Jenkins parameters (PROJECTNAME, PROJECTID) to which we pass the shell agent information to

NAME

    shell.sh

SYNOPSIS

    shell.sh $QTE.projectName $QTE.projectId

DESCRIPTION

    This is a bash shell script meant to be executed by a Shell Agent that will execute a Jenkins job. You must replace some of the curl commands for this to work for you. 
    - The basic authentication parameters must be your own username and token for both calls. You can retrieve the token from your jenkins User Profile -> Configure -> Show API Token.
    - The jenkins URL must be modified to be your own
    - The jenkins job in the second curl command must match your own

