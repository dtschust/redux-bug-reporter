/* global fetch */
require('isomorphic-fetch')

const createSubmit = ({ url }) => newBug => {
  try {
    /* eslint-disable no-param-reassign */
    newBug.actions = JSON.stringify(newBug.actions)
    newBug.state = JSON.stringify(newBug.state)
    newBug.initialState = JSON.stringify(newBug.initialState)
    newBug.meta = JSON.stringify(newBug.meta)
    /* eslint-enable no-param-reassign */
  } catch (e) {
    return new Promise((resolve, reject) => {
      reject(e)
    })
  }
  const playback = `window.bugReporterPlayback(${newBug.actions},${newBug.initialState},${newBug.state},100)`
  return fetch(url, {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...newBug,
      playback,
    }),
  }).then((response) => {
    if (!response.ok) {
      throw Error(response.statusText)
    }
    return response.json()
  })
}
export default createSubmit
