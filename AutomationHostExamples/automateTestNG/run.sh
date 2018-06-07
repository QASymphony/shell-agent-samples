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


if [ "${TEST}" == "None" ]
then
    ( cd "${LOCALREPO}" ; mvn test )

    echo UPLOADING TO qTest

    python3 executetests.py "${LOCALREPO}" "${UPDATE}"
else

    echo RUNNING SCHEDULED TESTS

    ( cd "${LOCALREPO}" ; mvn test )

    python3 uploadtoqtest.py "${TEST}" "${LOCALREPO}" "${UPDATE}"
fi

echo DONE
