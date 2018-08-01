import requests
import json
import sys


with open('jenkinsconfig.json', 'r') as f:
    config = json.load(f)
KeyList = ""

if len(sys.argv) > 1:
    JenkinsJob = sys.argv[1]
    JenkinsAPIToken = config[JenkinsJob]['JenkinsAPIToken']
    JenkinsJobName = config[JenkinsJob]['JenkinsJobName']
    JenkinsJobToken = config[JenkinsJob]['JenkinsJobToken']
    JenkinsURL = config[JenkinsJob]['JenkinsURL']
    JenkinsUserName = config[JenkinsJob]['JenkinsUserName']
    CrumbUrl = "http://" + JenkinsUserName + ":" + JenkinsAPIToken + "@" + JenkinsURL + '/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,":",//crumb)'
    CrumbResult = requests.get(CrumbUrl)
    #print(CrumbResult.status_code)

    if (CrumbResult.ok):
        Crumb = CrumbResult.content.decode().split(":")[1]

        if len(sys.argv) < 3:
            PostUrl = "http://" + JenkinsUserName + ":" + JenkinsAPIToken + "@" +  JenkinsURL + "/job/" + JenkinsJobName + "/build?token=" + JenkinsJobToken
            Headers = {"Jenkins-Crumb": Crumb, "content-type": "application/x-www-form-urlencoded; charset=UTF-8"}
            TriggerJenkinsJob = requests.post(PostUrl, headers=Headers)
        else:
            PostUrl = "http://" + JenkinsUserName + ":" + JenkinsAPIToken + "@" +  JenkinsURL + "/job/" + JenkinsJobName + "/buildWithParameters?token=" + JenkinsJobToken + "&"
            first = True
            for i in range(2, len(sys.argv)):
                if i % 2 == 0:
                    if first:
                        string = sys.argv[i] + "=" + sys.argv[i + 1]
                        PostUrl = PostUrl + string
                        first = False
                    else:
                        string = "&" + sys.argv[i] + "=" + sys.argv[i + 1]
                        PostUrl = PostUrl + string
                else:
                    continue
            Headers = {"Jenkins-Crumb": Crumb, "content-type": "application/x-www-form-urlencoded; charset=UTF-8"}
            TriggerJenkinsJob = requests.post(PostUrl, headers=Headers)


        #print(TriggerJenkinsJob.status_code)
else:
    for Key in config.keys():
        KeyList = KeyList + Key + ", "
    print("Usage: calljenkins.py <Jenkins Job>")
    print("   where valid Jenkins Job values are " + KeyList)

