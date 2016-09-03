# Integrations

`redux-bug-reporter` comes with several built-in integrations to popular bug trackers, and easily supports custom integrations. Most integrations export a `createSubmit` function, which is passed a `config` and returns a `submitFn`. Current integrations supported are:
* **[Default](#default)**: `POST` to passed in submission URL
* **[Console logging](#console)**
* **[Sheetsu](#sheetsu)** (Google sheets)
* **[Asana](#asana)**
* **[Github issues](#github-issues)**
* **[Jira](#jira)**
* **[Custom Integrations](#custom-integrations)**

## Default
<div><img src="https://raw.githubusercontent.com/dtschust/redux-bug-reporter/master/.github/default.png" width="800"/></div>
The default integration is a simple `POST` to a provided URL. This integration is good for any server built to handle `redux-bug-reporter` POSTs.
```js
import createSubmit from 'redux-bug-reporter/lib/integrations/default'
let submitFn = createSubmit({ url: 'http://server-to-post-to.biz' })

// Later, when rendering redux-bug-reporter
<ReduxBugReporter submit={submitFn} projectName='example' />
```

## Console
<div><img src="https://raw.githubusercontent.com/dtschust/redux-bug-reporter/master/.github/console.png" width="800"/></div>
The console integration prints the bug to the console. This is probably only useful in testing, and is used on the demo page.
```js
import submitFn from 'redux-bug-reporter/lib/integrations/console'
// Later, when rendering redux-bug-reporter
<ReduxBugReporter submit={submitFn} projectName='example' />
```

## Sheetsu
<div><img src="https://raw.githubusercontent.com/dtschust/redux-bug-reporter/master/.github/sheetsu.png" width="800"/></div>
[Sheetsu](http://sheetsu.com/) is a wonderful tool that turns a Google spreadsheet into an API. Create a copy of [this google sheet](https://docs.google.com/spreadsheets/d/1k8CaMxSm8_yy8kN6t3pP6M_tW_cWEDASnbjbC2td7Lc), and integrate with Sheetsu to get a Sheetsu API url. The API must be configured to have CREATE (POST) permissions.
```js
import createSubmit from 'redux-bug-reporter/lib/integrations/sheetsu'
let submitFn = createSubmit({ url: 'https://sheetsu.com/apis/v1.0/SHEETSU_API_URL' })

// Later, when rendering redux-bug-reporter
<ReduxBugReporter submit={submitFn} projectName='example' />
```

## Asana
<div><img src="https://raw.githubusercontent.com/dtschust/redux-bug-reporter/master/.github/asana.png" width="600"/></div>
### 🚨Warning: This integration requires passing in an Asana `access_token`. Be careful with this token, and store it as an env variable and not in code. If `redux-bug-reporter` is only being used in a development environment, make sure your build process removes the access token as dead code before deploying to production. If you wish to use `redux-bug-reporter` in production, you will need to deploy a server that stores the Asana access_token as an environment variable, and posts to `https://app.asana.com/api/1.0/tasks` on your behalf. Fork the integration in `src/integrations/asana.js` and alter the POST to go to your custom server. If this is a pain point for you, please create an issue and I'll consider writing a server implementation🚨
Asana integration is simple but unfortunately Asana only currently supports plain text bugs, so the formatting in the Asana interface of a submitted bug, while functional, is a little ugly. For this integration, you will need an access_token and the `id` of the project you'd like to file bugs to.
```js
import createSubmit from 'redux-bug-reporter/lib/integrations/asana'
let submitFn = createSubmit({ access_token: 'ASANA_ACCESS_TOKEN', projects: [PROJECT_ID] })

// Later, when rendering redux-bug-reporter
<ReduxBugReporter submit={submitFn} projectName='example' />
```

## GitHub Issues
<div><img src="https://raw.githubusercontent.com/dtschust/redux-bug-reporter/master/.github/github.png" width="600"/></div>
### 🚨Warning: This integration requires passing in a GitHub `access_token`. Be careful with this token, and store it as an env variable and not in code. If `redux-bug-reporter` is only being used in a development environment, make sure your build process removes the access token as dead code before deploying to production. If you wish to use `redux-bug-reporter` in production, you might prefer to deploy a server running [github-issue-filer](https://github.com/dtschust/github-issue-filer), which stores the access token in an env variable, and forking the GitHub integration to `POST` to `github-issue-filer` instead.🚨
The GitHub issue integration creates GitHub issues. The access_token passed in must have repo access to the repo where you would like issues to be filed.
```js
import createSubmit from 'redux-bug-reporter/lib/integrations/github'
const submitFn = createSubmit({
    github_owner: 'dtschust',
    github_repo: 'redux-bug-reporter',
    access_token: 'ACCESS_TOKEN_STORED_IN_ENV_VARIABLE'
})
// Later, when rendering redux-bug-reporter
<ReduxBugReporter submit={submitFn} projectName='example' />
```

## Jira
<div><img src="https://raw.githubusercontent.com/dtschust/redux-bug-reporter/master/.github/jira.png" width="600"/></div>
Unfortunately, it is not possible to create bugs in Jira through a web browser due to the Jira API's poor CORS support. As such, you will need to deploy a server running [jira-issue-filer](https://github.com/dtschust/jira-issue-filer), see the README for `jira-issue-filer` for documentation on setting it up.
```js
import createSubmit from 'redux-bug-reporter/lib/integrations/jira'
const submitFn = createSubmit({
    url: 'http://server-running-jira-issue-filer.biz'
})
// Later, when rendering redux-bug-reporter
<ReduxBugReporter submit={submitFn} projectName='example' />
```

## Custom Integrations
If you would like to develop a custom integration, check out the existing integrations in `src/integrations`. They are pretty straight forward. If you think your integration might be useful to others, feel free to submit a PR to this repo, or you could publish the integration as a separate package i.e. `redux-bug-reporter-foo-integration`.
