<div align="center" style="margin-bottom: 30px;">
<img src="https://raw.githubusercontent.com/dtschust/redux-bug-reporter/master/.github/Logo.png" width="100"/>
</div>

# Redux Bug Reporter

Authors: [Drew Schuster](https://github.com/dtschust) & [Greg Mathews](https://github.com/gregsqueeb)

[![npm version](https://img.shields.io/npm/v/redux-bug-reporter.svg)](https://www.npmjs.com/package/redux-bug-reporter)
[![npm downloads](https://img.shields.io/npm/dm/redux-bug-reporter.svg.svg)](https://www.npmjs.com/package/redux-bug-reporter)
[![build](https://travis-ci.org/dtschust/redux-bug-reporter.svg?branch=master)](https://travis-ci.org/dtschust/redux-bug-reporter)
[![coverage](https://img.shields.io/codecov/c/github/dtschust/redux-bug-reporter.svg)](https://codecov.io/gh/dtschust/redux-bug-reporter)
[![license](https://img.shields.io/github/license/dtschust/redux-bug-reporter.svg?maxAge=2592000)](/LICENSE.md)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

## Demo

[✨DEMO ✨](http://dtschust.github.io/redux-bug-reporter)
[Prototype Demo Video](https://www.youtube.com/watch?v=n8vkg_RVIRo)

## Features
* **Easy Bug Filing** - Any user is able to easily file bugs right from your application
* **Redux logging** - Any bug filed automatically passes along everything needed to recreate the bug. Initial redux state, all actions performed, and final redux state
* **Redaction** - Customizable hooks allow for redaction of any sensitive information in redux state or in action payloads before bug submission
* **Easy Playback of Bug** - A global function `window.bugReporterPlayback` is available to replay any bug
* **Automatic Logging of browser errors** - Any calls to `console.error` or `window.onError` are filed with a bug automatically
* **Automatic Browser Info logging** - All bugs filed automatically include window dimensions, window location, and user agent
* **Extensible**
    * Extra properties passed in as `meta` to the Redux Bug Reporter component are filed alongside the bug
    * Submit property can either be a URL or a custom function that returns a promise. This should allow Redux Bug Reporter to work in any development environment

## Installation

The easiest way to use Redux Bug Reporter is to install it from npm and include it in your own build process (Webpack, Browserify, etc)
```
$ npm install --save redux-bug-reporter
```

A UMD build is also available:
```html
<link rel="stylesheet" href="redux-bug-reporter/dist/redux-bug-reporter.min.css">
<script src="redux-bug-reporter/dist/redux-bug-reporter.min.js"></script>
```

## Performance and Production Use
Redux Bug Reporter puts minimal overhead on redux actions. However, it does keep copies of initial state, final state on bug submission, and full copies of all actions dispatched. For an application with heavy actions (such as network requests with large payloads) or very frequent actions, Redux Bug Reporter will gradually take up more and more memory. As such, it's probably a good idea to disable in production by default. The examples below demonstrate the expected common behavior of only enabling Redux Bug Reporter in non-production environments.
### What about server-side rendering?
Redux Bug Reporter disables itself by default if `window` is undefined, so it will not negatively impact server side renders.
### But *can* it run in production?
Redux Bug Reporter can run in production. It's assumed that an application usually wouldn't want the bug reporter to be displayed on the page and allow public users to file bugs, but if that is the desired behavior Redux Bug Reporter does work in production.

## Usage
### 1. Use with Redux
Update your configure store:
```javascript
function configureStore(initialState) {
  const store = createStore(reducer, initialState, compose(
    applyMiddleware(...middleware)
  ));
  return store;
}
```
*becomes*
```javascript
// ES6
import {storeEnhancer} from 'redux-bug-reporter'
// ES5
var storeEnhancer = require('redux-bug-reporter').storeEnhancer

function configureStore(initialState) {
  const store = createStore(reducer, initialState, compose(
    process.env.NODE_ENV !== 'production' ? storeEnhancer : f => f,
    applyMiddleware(...middleware)
  ));
  return store;
}
```
or if you don't have other store enhancers and middlewares
```javascript
// ES6
import {storeEnhancer} from 'redux-bug-reporter'
// ES5
var storeEnhancer = require('redux-bug-reporter').storeEnhancer

function configureStore(initialState) {
  const store = createStore(reducer, initialState,
    process.env.NODE_ENV !== 'production' ? storeEnhancer : f => f
  );
  return store;
}
```
### 2. Render UI Component
```js
// ES6
import ReduxBugReporter from 'redux-bug-reporter'
import 'redux-bug-reporter/dist/redux-bug-reporter.css'
// ES5
var ReduxBugReporter = require('redux-bug-reporter').default
require('redux-bug-reporter/dist/redux-bug-reporter.css')

const ParentContainer = () => {
    return (
        <div>
          This is your app, already wrapped in a Provider from react-redux
          {process.env.NODE_ENV !== 'production' && <ReduxBugReporter submit='http://localhost/path/to/post/bug/to' projectName='Test'/>}
        </div>
    )
}
```

### 3. Integrate With Backend Service
Redux Bug Reporter needs to be able to submit bugs to some sort of backend. An example implementation of a backend is coming soon. If a backend service doesn't exist, a temporary solution to try Redux Bug Reporter is to log bugs to the console instead of submitting them.

```js
const submitFn = (newBug) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let { actions, initialState, state } = newBug
      console.log('window.bugReporterPlayback(', actions, ',', initialState, ',', state, ', 100)')
      console.warn('^^^ To play back, run the above command in the console ^^^')
      resolve({})
    }, 2000)
  })
}

// Later, in render
<ReduxBugReporter submit={submitFn} projectName='example' stringifyPayload/>
```

Alternatively, Redux Bug Reporter integrates quite easily with [Sheetsu](http://sheetsu.com). Example documentation to come.

### 4. Replay Filed Bugs
To replay a filed bug, call the global `bugReporterPlayback` function with the appropriate parameters:
```js
window.bugReporterPlayback(actions, initialState, state, delay)
```
The delay parameter is the amount of time (in ms) between actions during playback. The default value is 100. **Note: Setting a delay value of -1 will skip playback and just set the redux store state to be equal to the final state of the bug. This is useful in situations where an application maintains critical state outside of redux and playback does not work.**



## Prop Types
| Property        | Type                       | Default | Description |
|:---------       |:-----                      |:--------|:------------|
|submit           |Function or String          |         |**Required** If a string, the URL to post a bug to. If a function, a function called that will submit the bug. **Note: function must return a promise**|
|projectName      |String                      |         |**Required** Name of the project the bug should be filed against. This can be used to scope bugs between different initiatives|
|redactStoreState |Function                    |         |*optional* A function that receives the state and returns a redacted state before bug submission. **Warning: Should not alter passed in state** See [Redacting Sensitive Data](#redacting-sensitive-data)|
|name             |String                      |         |*optional* If the application knows the name of the user, this can be used to prepopulate the submission form|
|meta             |Any                         |         |*optional* If `meta` exists, it will be passed along on bug submission|
|stringifyPayload |Boolean                     |false    | If true, the redux states and actions will be stringified using `JSON.stringify` before bug submission. This is particularly useful for posting bugs to a google sheet using [Sheetsu](http://sheetsu.com)|

## Redacting Sensitive Data
Since Redux Bug Reporter logs all redux state and actions, there could easily be sensitive information in submitted bugs. There are two ways to redact information before submission.
### Redacting Information from Store State
Pass in a redaction function as the `redactStoreState` prop to the `ReduxBugReporter` component. It will be applied to the initial store state and the final store state before bug submission.
```js
let redactStoreState = function (state) {
    // Deep Clone the state to prevent altering actual state
    let newState = _.cloneDeep(state)
    if (newState && newState.identity && newState.identity.name) {
        newState.identity.name = 'REDACTED'
    }
    return newState
}

// Later, in render
<ReduxBugReporter submit='http://localhost/path/to/post/bug/to' projectName='Test' redactStoreState={redactStoreState}/>
```
### Redacting Information from Action Payloads
In order to redact information from a payload of an action, set `action.meta.redactFromBugReporter` to `true`. If that boolean exists and no custom redaction function is specified, all that will be logged for the action is its `type`. A custom redaction function can be specified by creating it at `action.meta.redactFromBugReporterFn`. If `redactFromBugReporterFn` exists, the action will be deep cloned and passed in to the redaction function, which will return the sanitized action and payload.
```js
let action {
    type: 'SIMPLE_ACTION',
    sensitiveField: 'SECRETS',
    meta: {
        redactFromBugReporter: true,
        unrelatedMeta: true
    }
}
// Redacted action is { type: 'SIMPLE_ACTION', meta: { unrelatedMeta: true } }

let action {
    type: 'CUSTOM_REDACTION_ACTION',
    sensitiveField: 'SECRETS',
    nonSensitiveField: 'Foo Bar'
    meta: {
        redactFromBugReporter: true,
        redactFromBugReporterFn: function (action) {
            delete action.sensitiveField
            return action
        },
        unrelatedMeta: true
    }
}
// Redacted action is { type: 'CUSTOM_REDACTION_ACTION', nonSensitiveField: 'Foo Bar', meta: { unrelatedMeta: true } }
```

##Contributions
- Fork the project
- Make changes
- Double check changes work by adding it to the examples
- Confirm that tests still pass
- Write new tests if applicable
- Update README with appropriate docs
- Commit and create a PR

## License

MIT
