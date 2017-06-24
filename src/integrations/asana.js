/* global fetch */
import parser from 'ua-parser-js'

require('isomorphic-fetch')

const createSubmit = config => {
  const { access_token, ...rest } = config
  return newBug => {
    /* eslint-disable prefer-const */
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
    /* eslint-enable prefer-const */
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
    const { name: uaName, version: uaVersion } = parser(useragent).browser
    const title = `${description}`
    const body = `Notes
${notes}

Meta information
Bug filed by: ${reporter}
Screenshot URL (if added): ${screenshotURL}
Console Errors: ${consoleErrors}
URL: ${windowLocation}
Window Dimensions: ${windowDimensions}
Meta information: ${meta}
User Agent: ${uaName} version ${uaVersion}

Playback script:
window.bugReporterPlayback(${actions},${initialState},${state},100)

Bug submitted through https://github.com/dtschust/redux-bug-reporter
`
    return fetch('https://app.asana.com/api/1.0/tasks', {
      method: 'post',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${  access_token}`, // eslint-disable-line camelcase
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          notes: body,
          name: title,
          ...rest,
        },
      }),
    }).then((response) => {
      if (!response.ok) {
        throw Error(response.statusText)
      }
      return response.json()
    })
  }
}
export default createSubmit
