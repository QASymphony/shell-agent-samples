@echo off
rem This is a utility to parse JUnit/XUnit XML files into JSON formats required by qTest APIs.


IF "%~1" == "-git" (
    set GIT="yes"
) ELSE (
    IF "%~2" == "-git" (
        set GIT="yes"
    ) ELSE (
        set GIT="no"
    )
)

IF "%~1" == "-update" (
    set UPDATE="update"
) ELSE (
    IF "%~2" == "-update" (
        set UPDATE="update"
    ) ELSE (
        set UPDATE="false"
    )
)


for /f tokens^=*^ delims^=^ eol^= %%i in ('call python getlocalrepo.py') do set LOCALREPO=%%i
for /f tokens^=*^ delims^=^ eol^= %%i in ('call python getrepourl.py') do set REPOSRC=%%i

IF  %GIT% == "yes" (
    echo UPDATING LOCAL REPOSITORY
    call git clone %REPOSRC% || pushd %LOCALREPO% & call git pull & popd
)

echo RUNNING TESTS

for /f tokens^=*^ delims^=^ eol^= %%i in ('call python getscheduledtests.py') do set TEST=%%i
for /f tokens^=*^ delims^=^ eol^= %%i in ('call python runscheduledtests.py "%TEST%"') do set CASES=%%i

IF "%TEST%" == "None" (
    call robot %LOCALREPO%

    echo UPLOADING TO qTest
    call python executetests.py %UPDATE%

) ELSE (

    echo RUNNING SCHEDULED TESTS

    for /f "delims=;" %%a in ("%CASES%") do (
        call robot -t %%a %LOCALREPO%
        call python uploadtoqtest.py %%a %LOCALREPO% %UPDATE%
    )

    echo UPLOADING TO qTEST

)

echo DONE
