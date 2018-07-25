# protractor-nodejs using Shell Agent plugin sample

A sample script for using Shell Agent plugin to collect test runs, execute e2e tests and send results back to qTest Manager.

## Introduction

- qTest Manager plugin: Shell Agent
- Testing framework   : Protractor, NodeJS, Jasmine2
- Language            : Typescript
- ECMAScript Version  : ES6
- Console reporter    : jasmine-spec-reporter
- Pattern             : Page Objects pattern

## Prerequisites

- NodeJS 6.11+ installed already
- Java 8+ installed already
- qTest Automation Host installed already
- qTest Manager Shell Agent plugin installed and started already
- qTest Manager custom fields for Test Suite created: **Package**, **Browser**

## Setup

`npm run setup` install neccesary packages of node-modules and selenium webdrivers
`npm run start` compile typescript scripts and start selenium server

## Configure Shell Agent plugin

- **Agent Name**: <your_agent_name>
- **qTest Manager Project**: <your_project>
- **Automation framework**: Shell Agent
- **Test Scripts**:
    - **Directory**: D:\shell-agent-samples\postman-nodesjs
    - **Allocated Execution Time**: 0
    - **Kick-off scripts**: npm run test -- --params.package=$QTE.testRuns[0].Package --params.browser=$QTE.testRuns[0].Browser
	
## More information

- Internet Explorer 11 browser configuration: Follow step #4 in the [article](http://elgalu.github.io/2014/run-protractor-against-internet-explorer-vm/)