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

LOCALREPO=$(python3 getlocalrepo.py)


if [ "${GIT}" == "yes" ]
then
    echo UPDATING LOCAL REPOSITORY
    REPOSRC=$(python3 getrepourl.py)
    git clone "${REPOSRC}" || (cd "${LOCALREPO}" ; git pull)
fi

echo RUNNING TESTS

TEST=$(python3 getscheduledtests.py)

if [ "${TEST}" == "None" ]
then
    ( cd "${LOCALREPO}" ; mvn test )

    echo UPLOADING TO qTest

    python3 executetests.py "${LOCALREPO}" "${UPDATE}"
else
    CASES=$(python3 runscheduledtests.py "${TEST}")

    echo RUNNING SCHEDULED TESTS

    TESTCASES=$(echo $CASES | tr ";" "\n")

    for VALUE in $TESTCASES
    do
        (cd "$LOCALREPO" ; mvn -Dtest="$VALUE" test)
    done

    python3 uploadtoqtest.py "${TEST}" "${LOCALREPO}" "${UPDATE}"
fi

echo DONE
