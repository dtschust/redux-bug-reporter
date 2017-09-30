/* global fetch */
require('isomorphic-fetch')

const createSubmit = ({ url }) => newBug =>
	fetch(url, {
		method: 'post',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(newBug),
	}).then(response => {
		if (!response.ok) {
			throw Error(response.statusText)
		}
		return response.json()
	})
export default createSubmit
