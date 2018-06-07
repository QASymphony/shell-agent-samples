*Overview:*

This guide is intended to serve as a tutorial to use the qTest Automation Host feature to run and upload tests to qTest Manager with the Shell Agent. The Shell Agent allows the user to run and upload all tests to qTest or schedule certain tests from qTest Manager that will upload individually. The shell script agent allows for user based customization as shown in the examples below.

**Install qTest Automation Host:**


The Automation Installation Guide can be found here: [https://support.qasymphony.com/hc/en-us/articles/115005561826-qTest-Automation-Host-User-Guide](https://support.qasymphony.com/hc/en-us/articles/115005561826-qTest-Automation-Host-User-Guide)

**Set up qTest Manager Environment:**

1.    Acquire your qTest Manager base URL as shown below

  ![alt text](https://github.com/sanjayjohn/shell-agent-samples/tree/master/AutomationHostExamples/images/baseurl.png "Base Url")

2.    Acquire personal API Token which can be found under the resource button at the top right of the browser, under the API &amp; SDK Section.

 ![alt text](https://github.com/sanjayjohn/shell-agent-samples/tree/master/AutomationHostExamples/images/apitoken.png "Api Token")

Your qTest URL and personal API Token will be needed for configuration in the following examples.

3.    Turn ON Automation Integration which is under the Gear Icon

![alt text](https://github.com/sanjayjohn/shell-agent-samples/tree/master/AutomationHostExamples/images/autohostsettings.png "Automation host settings")
![alt text](https://github.com/sanjayjohn/shell-agent-samples/tree/master/AutomationHostExamples/images/statuson.png "Turn Status On")

**Automation Host Examples:**

Junit Maven Shell Agent

TestNG Maven Shell Agent

Robot Shell Agent

JMeter Shell Agent