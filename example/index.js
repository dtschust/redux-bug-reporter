/* global document */

import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'proptypes'
import { Provider, connect } from 'react-redux'
import { fromJS } from 'immutable'
import 'todomvc-app-css/index.css'

import ReduxBugReporter from '../src/index'
import '../src/redux-bug-reporter.less'
import './index.less'

import App from './todomvc/containers/App'
import configureStore from './todomvc/store/configureStore'
import submitFn from '../src/integrations/console'

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

const customDecode = (state) => ({ ...state, input: fromJS(state.input) })

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
          text area is a fork of redux&#39;s todomvc example, with redux-bug-reporter
          wiring. Changes to the todo list will also be logged with redux-bug-reporter.
        </div>
        <ConnectedInput />
        <ConnectedListener />
        <App />
        <ReduxBugReporter submit={submitFn} projectName='example' customDecode={customDecode} />
      </div>
    </Provider>
  )
}

class Input extends React.Component {
  handleChange (e) {
    this.props.dispatch(inputChange(e.target.value))
  }
  render () {
    return (
      <div className='example__input'>
        <textarea rows='10' cols='50' value={this.props.value} onChange={this.handleChange} />
      </div>
    )
  }
}

Input.propTypes = {
  value: PropTypes.string,
  dispatch: PropTypes.func
}

const mapInputStateToProps = function ({ input }) {
  return { value: input.toJS().value }
}

const ConnectedInput = connect(mapInputStateToProps)(Input)

class Listener extends React.Component {
  componentWillReceiveProps (nextProps) {
    if (this.props.value !== nextProps.value) {
      this.props.dispatch(incrementChangeCounter())
    }
  }
  render () {
    return (
      <div className='example__counter'>Input has been changed {this.props.numChanges} times</div>
    )
  }
}
Listener.propTypes = {
  value: PropTypes.string,
  numChanges: PropTypes.number,
  dispatch: PropTypes.func
}

const mapListenerStateToProps = function ({ input }) {
  const { value, numChanges } = input.toJS()
  return { value, numChanges }
}

const ConnectedListener = connect(mapListenerStateToProps)(Listener)

ReactDOM.render(<Root />, document.getElementById('root'))
