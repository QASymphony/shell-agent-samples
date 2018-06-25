#!/bin/bash

# This is a utility to parse NUnit XML files into JSON formats required by qTest APIs.

set -e
set -u
set -o pipefail

UPDATE="false"
GIT="no"
while getopts 'gub:' OPTION; do
  case "$OPTION" in
    g)
      GIT="yes"
      ;;

    u)
      UPDATE="update"
      ;;

    b)
      BRANCH="$OPTARG"
      echo "The value provided is for branch is $OPTARG"
      ;;
    ?)
      echo "script usage: $(basename $0) [-g] [-u] [-b somevalue]" >&2
      exit 1
      ;;
  esac
done

shift "$(($OPTIND -1))"

LOCALREPO=$(python3 getlocalrepo.py)


if [ ${GIT} == "yes" ]
then
    echo FETCHING TESTS FROM GITHUB
    REPOSRC=$(python3 getrepourl.py)
    if [ -z ${BRANCH+x} ]
    then
        echo UPDATING LOCAL REPOSITORY
        git clone "${REPOSRC}" || (cd "${LOCALREPO}" ; git pull)
    else
        echo UPDATING LOCAL REPOSITORY AND CREATING BRANCH
        git clone "${REPOSRC}" || (cd "${LOCALREPO}" ; git checkout -b "${BRANCH}" || git checkout "${BRANCH}"; git rebase master)
    fi
fi

echo RUNNING TESTS

TEST=$(python3 getscheduledtests.py)

DLLFILE=$(python3 runscheduledtests.py "${LOCALREPO}")

if [ "${DLLFILE}" == "None" ]
then
    echo FILE NOT FOUND
else
    ( cd "${LOCALREPO}"/bin/Debug ; nunit3-console "${DLLFILE}")
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

