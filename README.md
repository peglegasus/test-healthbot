# test-healthbot

```
    ______ _____    ______ 
   / _____|____ \  / _____)
  | /      _   \ \| /      
  | |     | |   | | |      
  | \_____| |__/ /| \_____ 
   \______)_____/  \______)
```

Custom parser for interpretting Self-Checker JSON exports.

## Developers:

- Tou Fong Lee
- Clay Davis

## Technology Stack:

- HTML
- CSS
- Javascript, jQuery, ES6 syntax (let, const, arrow functions)
- Adaptive Cards
- QnA Maker (possibly)

## Getting Started:

1. Open up your CLI of choice and clone [this](https://github.com/leetoufong/test-healthbot) repository in desired location on your local hard drive.
2. `cd` to the directory.
3. Requires any simple command line tooling that spins up a local web server, such as [http-server](https://www.npmjs.com/package/http-server).
4. Once in directory, spin up local web server. If using [http-server](https://www.npmjs.com/package/http-server), enter `http-server` into the CLI.
5. Open up browser of choice and go to localhost url with correct port number. In the case of [http-server](https://www.npmjs.com/package/http-server), url should be `http://localhost:8080`.

## Functionality Specifics

### Card Types

There are 7 card types:

1. `assignVariable` - Assigns variables to the `scenario` object
2. `action` - Builds out key/value pairs based via JavaScript stored as strings on the `onInit` property
5. `prompt` - Builds out the controls that users interact with to progress them down the decision tree. This control type may include `AdaptiveCard`s.
3. `statement` - Builds out messages to relay to user. This control type may include `AdaptiveCard`s.
4. `branch` - Branches users down the decision based on certain boolean conditions. If true, progress down the `targetStepId` path, else progress down the `designer.next` path.
6. `replaceScenario` - Dynamically loads a new JSON object scenario (ie. covid19, covid19_core, covid19_core_pediatric)
7. `AdaptiveCard` - Calls Microsoft's [Adaptive Cards](http://adaptivecards.io/) UI framework to build out technology-agnostic snippets of UI. Adaptive Cards are usually a child type of `prompt` and `statement` card types

## Useful Links:

- [https://github.com/CDCgov/covid19healthbot](https://github.com/CDCgov/covid19healthbot)
- [Azure Health Bot Dashboard](https://eastus.healthbot.microsoft.com/account/cdcetdabtestcovidhealthbot-byzwl2p/scenarios/manage)
- [MS Azure Healthbot Dev Instance](https://eastus.healthbot.microsoft.com/account/cdcetdabtestcovidhealthbot-byzwl2p/scenarios/manage)
- [Viral Testing Tool](https://www.cdc.gov/coronavirus/2019-ncov/testing/index.html)
- [COVID-19 Self-Checker](https://www.cdc.gov/coronavirus/2019-ncov/symptoms-testing/coronavirus-self-checker.html)
- [Adaptive Cards](http://adaptivecards.io/)
- [QnA Maker](https://www.qnamaker.ai/)
