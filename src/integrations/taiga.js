/* global fetch */
require('isomorphic-fetch')
import parser from 'ua-parser-js'

const createSubmit = ({ token, project_id, ...rest }) => {
  return newBug => {
    let {
      useragent,
      notes,
      description,
      screenshotURL,
      reporter,
      actions,
      initialState,
      state,
      consoleErrors,
      meta,
      windowDimensions,
      windowLocation,
    } = newBug
    try {
      actions = JSON.stringify(actions)
      state = JSON.stringify(state)
      initialState = JSON.stringify(initialState)
      meta = JSON.stringify(meta)
    } catch (e) {
      return new Promise((resolve, reject) => {
        reject(e)
      })
    }
    var { name: uaName, version: uaVersion } = parser(useragent).browser
    let title = `${description}`
    let body = `Notes
${notes}

## Meta information
*Bug filed by*: ${reporter}
*Screenshot URL (if added)*: ${screenshotURL}
*Console Errors*: \`${consoleErrors}\`
*URL*: ${windowLocation}
*Window Dimensions*: ${windowDimensions}
*Meta information*: ${meta}
*User Agent*: ${uaName} version ${uaVersion}

Playback script:
\`\`\`js
window.bugReporterPlayback(${actions},${initialState},${state},100)
\`\`\`

*Bug submitted through [redux-bug-reporter](https://github.com/dtschust/redux-bug-reporter)*
`
    return fetch('https://api.taiga.io/api/v1/issues', {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({
        description: body,
        subject: title,
        project: project_id,
        ...rest,
      }),
    }).then(function(response) {
      if (!response.ok) {
        throw Error(response.statusText)
      }
      return response.json()
    })
  }
}
export default createSubmit
