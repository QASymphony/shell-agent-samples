#!/bin/bash

# This is a utility to parse Robot files into JSON formats required by qTest APIs.


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


if [ "${TEST}" == "None" ]
then
    robot "${LOCALREPO}"

    echo UPLOADING TO qTest

    python3 executetests.py "${UPDATE}"
else
    CASES=$(python3 runscheduledtests.py "${TEST}")

    echo RUNNING SCHEDULED TESTS

    TESTCASES=$(echo $CASES | tr ";" "\n")

    for VALUE in $TESTCASES
    do
        echo "${VALUE}"
        robot -t "$VALUE" "${LOCALREPO}"
        python3 uploadtoqtest.py "$VALUE" "${LOCALREPO}" "${UPDATE}"
    done
fi

echo DONE
