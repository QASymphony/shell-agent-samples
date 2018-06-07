#!/bin/bash

# This is a utility to parse JUnit/XUnit XML files into JSON formats required by qTest APIs.


if [ $1 == "-git" ] || [ $2 == "-git" ]
then
    GIT="yes"
else
    GIT="no"
fi

if [ $1 == "-update" ] || [ $2 == "-update" ]
then
    UPDATE="update"
else
    UPDATE="false"
fi

if [ "${GIT}" == "yes" ]
then
    echo UPDATING LOCAL REPOSITORY
    REPOSRC=$(python3 getrepourl.py)
    LOCALREPO=$(python3 getlocalrepo.py)
    git clone "${REPOSRC}" || (cd "${LOCALREPO}" ; git pull)
else
    LOCALREPO=$(python3 getlocalrepo.py)
fi

echo RUNNING TESTS

TEST=$(python3 getscheduledtests.py)

JMXFILE=$(python3 runscheduledtests.py "${LOCALREPO}")

if [ "${JMXFILE}" == "None" ]
then
    echo FILE NOT FOUND
else
    ( cd "${LOCALREPO}" ; jmeter -n -t "${JMXFILE}")
    echo UPLOADING TO qTest

    if [ "${TEST}" == "None" ]
    then
        python3 executetests.py "${LOCALREPO}" "${UPDATE}"
    else
        echo UPLOADING SCHEDULED TESTS

        python3 uploadtoqtest.py "${TEST}" "${LOCALREPO}" "${UPDATE}"
    fi
fi

echo DONE
