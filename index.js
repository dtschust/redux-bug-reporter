import React from 'react'
import ReactDOM from 'react-dom'
import { Provider, connect } from 'react-redux'
import ReduxBugReporter from '../src/index'
import '../src/redux-bug-reporter.less'
import './index.less'

import App from './todomvc/containers/App'
import configureStore from './todomvc/store/configureStore'
import 'todomvc-app-css/index.css'

const store = configureStore()

function inputChange (payload) {
  return {
    type: 'CHANGED_INPUT',
    payload
  }
}

function incrementChangeCounter () {
  return dispatch => {
    console.log('This is a log happening during an async action. This could just as easily be a network request. You should not see this log during playback')
    dispatch({type: 'INCREMENT_CHANGE_COUNTER'})
    setTimeout(() => {
      console.log('This is a log happening during an async action. This could just as easily be a network request. You should not see this log during playback')
      dispatch({type: 'DELAYED_ACTION'})
    }, 1000)
  }
}

const submitFn = (newBug) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let { actions, initialState, state } = newBug
      console.log('window.bugReporterPlayback(', actions, ',', initialState, ',', state, ', 100)')
      console.warn('^^^ To play back, run the above command in the console ^^^')
      window.alert('Check your developer console for the "filed" bug and instructions on how to replay it. Sorry about the alert.')
      resolve({})
    }, 2000)
  })
}

const Root = function () {
  return (
    <Provider store={store}>
      <div className='example'>
        <h1>Demo</h1>
        <div>
          This is a very simple demo. Changes to the text box will be logged,
          and a second component will count the number of changes. Filing a bug
          will output to the console the function to call to play back the bug.
          Play back the bug in a new tab to see replay functionality. Below the
          text area is a fork of redux's todomvc example, with redux-bug-reporter
          wiring. Changes to the todo list will also be logged with redux-bug-reporter.
        </div>
        <ConnectedInput/>
        <ConnectedListener/>
        <App />
        <ReduxBugReporter submit={submitFn} projectName='example' stringifyPayload/>
      </div>
    </Provider>
  )
}

const Input = React.createClass({
  displayName: 'Input',
  propTypes: {
    value: React.PropTypes.string,
    dispatch: React.PropTypes.func
  },
  handleChange: function (e) {
    this.props.dispatch(inputChange(e.target.value))
  },
  render: function () {
    return (
      <div className='example__input'>
        <textarea rows='10' cols='50' value={this.props.value} onChange={this.handleChange}/>
      </div>
    )
  }
})

const mapInputStateToProps = function ({ input }) {
  return { value: input.value }
}

const ConnectedInput = connect(mapInputStateToProps)(Input)

const Listener = React.createClass({
  displayName: 'Listener',
  propTypes: {
    value: React.PropTypes.string,
    numChanges: React.PropTypes.number,
    dispatch: React.PropTypes.func
  },
  componentWillReceiveProps: function (nextProps) {
    if (this.props.value !== nextProps.value) {
      this.props.dispatch(incrementChangeCounter())
    }
  },
  render: function () {
    return (
      <div className='example__counter'>Input has been changed {this.props.numChanges} times</div>
    )
  }
})

const mapListenerStateToProps = function ({ input }) {
  let { value, numChanges } = input
  return { value, numChanges }
}

const ConnectedListener = connect(mapListenerStateToProps)(Listener)

ReactDOM.render(<Root/>, document.getElementById('root'))
