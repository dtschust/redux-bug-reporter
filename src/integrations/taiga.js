/* global fetch */
require('isomorphic-fetch')

const createSubmit = ({url, token, project_id, subject}) => {
  return (newBug) => {
    return fetch(url + '/api/v1/issues', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        description: newBug,
        subject: subject,
        project: project_id
      })
    }).then(function (response) {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json()
    })
  }
}
export default createSubmit
