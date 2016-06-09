const submitFn = (newBug) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let { actions, initialState, state } = newBug
      try {
        actions = JSON.stringify(actions)
        state = JSON.stringify(state)
        initialState = JSON.stringify(initialState)
      } catch (e) {
        reject(e)
      }

      console.log('window.bugReporterPlayback(', actions, ',', initialState, ',', state, ', 100)')
      console.warn('^^^ To play back, run the above command in the console ^^^')
      window.alert('Check your developer console for the "filed" bug and instructions on how to replay it. Sorry about the alert.')
      resolve({})
    }, 100)
  })
}

export default submitFn
