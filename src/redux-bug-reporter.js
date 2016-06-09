import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import isEqual from 'lodash.isequal'
import isFunction from 'lodash.isfunction'
import { middlewareData, overloadStore, initializePlayback, finishPlayback, playbackFlag } from './store-enhancer'
import isClientRender from './is-client-render'
import { listenToErrors, errorData } from './utils'
import createSubmit from './integrations/default'
require('es6-promise').polyfill()

// On the server, UnconnectedBugReporter is a placeholder component
let UnconnectedBugReporter = () => {
  return (<span />)
}

if (isClientRender()) {
  UnconnectedBugReporter = React.createClass({
    displayName: 'Bug Reporter',

    propTypes: {
      // passed in from parent
      submit: React.PropTypes.oneOfType([
        React.PropTypes.func,
        React.PropTypes.string
      ]).isRequired,
      projectName: React.PropTypes.string.isRequired,
      redactStoreState: React.PropTypes.func,
      name: React.PropTypes.string,
      meta: React.PropTypes.any,
      customEncode: React.PropTypes.func,
      customDecode: React.PropTypes.func,
      // Passed in by redux-bug-reporter
      dispatch: React.PropTypes.func.isRequired,
      storeState: React.PropTypes.any.isRequired,
      overloadStore: React.PropTypes.func.isRequired,
      initializePlayback: React.PropTypes.func.isRequired,
      finishPlayback: React.PropTypes.func.isRequired
    },

    getInitialState: function () {
      return {
        expanded: false,
        mounted: false,
        loading: false,
        bugFiled: false,
        reporter: this.props.name || '',
        description: '',
        screenshotURL: '',
        notes: '',
        error: '',
        bugURL: ''
      }
    },

    shouldComponentUpdate: function (nextProps, nextState) {
      // Do not bother rerendering every props change.
      // Rerender only needs to occur on state change
      if (this.state !== nextState) {
        return true
      }
      return false
    },

    componentDidMount: function () {
      this.setState({ mounted: true })
      listenToErrors()
      // Global function to play back a bug
      window.bugReporterPlayback = this.bugReporterPlayback
    },

    toggleExpanded: function () {
      this.setState({expanded: !this.state.expanded})
    },

    bugReporterPlayback: function (actions, initialState, finalState, delay = 100) {
      let { dispatch, overloadStore, customDecode } = this.props
      if (delay === -1) {
        // Do not playback, just jump to the final state
        overloadStore(finalState)
        return
      }

      this.props.initializePlayback()
      if (customDecode) {
        initialState = customDecode(initialState)
        finalState = customDecode(finalState)
      }
      overloadStore(initialState)

      const performNextAction = () => {
        let action = actions[0]

        // Let store know this is a playback action
        action[playbackFlag] = true

        dispatch(action)
        actions.splice(0, 1)
        if (actions.length > 0) {
          setTimeout(performNextAction, delay)
        } else {
          this.props.finishPlayback()
          let storeState = this.props.storeState
          let keys = Object.keys(storeState)
          keys.forEach(function (key) {
            if (
              (!isEqual(storeState[key], finalState[key])) &&
              // In case reducer is an immutableJS object, call toJSON on it.
              !(storeState[key].toJSON && finalState[key].toJSON && isEqual(storeState[key].toJSON(), finalState[key].toJSON()))) {
              console.log('The following reducer does not strictly equal the bug report final state: ' + key + '. I\'ll print them both out so you can see the differences.')
              console.log(key + ' current state:', storeState[key], '\n' + key + ' bug report state:', finalState[key])
            }
          })
          console.log('Playback complete!')
        }
      }

      performNextAction()
    },

    submit: function (e) {
      e.preventDefault()
      const {submit, projectName, storeState, redactStoreState, meta, customEncode} = this.props
      let {reporter, description, screenshotURL, notes} = this.state
      this.setState({loading: true})

      let state = storeState
      let initialState = middlewareData.getBugReporterInitialState()
      let promise
      if (redactStoreState) {
        initialState = redactStoreState(initialState)
        state = redactStoreState(state)
      }

      if (customEncode) {
        state = customEncode(state)
        initialState = customEncode(initialState)
      }
      const newBug = {
        projectName,
        state,
        initialState,
        actions: middlewareData.getActions(),
        consoleErrors: errorData.getErrors(),
        reporter,
        description,
        screenshotURL,
        notes,
        meta,
        useragent: window.navigator.userAgent,
        windowDimensions: [window.innerWidth, window.innerHeight],
        windowLocation: window.location.href
      }

      // if submit is a function, call it instead of fetching
      // and attach to the promise returned
      if (isFunction(submit)) {
        promise = submit(newBug)
      } else {
        let submitFn = createSubmit({ url: submit })
        promise = submitFn(newBug)
      }

      promise.then((json = {}) => {
        let {bugURL} = json
        this.setState({loading: false, bugFiled: true, bugURL, expanded: true})
      }).catch((error) => {
        console.error('Error filing bug', error)
        this.setState({loading: false, bugFiled: true, error, expanded: true})
      })
    },

    dismiss: function (e) {
      e.preventDefault()
      this.setState({bugFiled: false, expanded: false, bugURL: ''})
    },

    handleChange: function (field) {
      return (e) => {
        this.setState({ [field]: e.target.value })
      }
    },

    render: function () {
      let {reporter, description, screenshotURL, notes, mounted, loading, bugFiled, error, expanded, bugURL} = this.state
      if (!mounted) {
        return false
      }
      if (loading) {
        return loadingLayout
      }

      if (bugFiled) {
        return (
          <div className='Redux-Bug-Reporter'>
            <div className={`Redux-Bug-Reporter__form Redux-Bug-Reporter__form--${error ? 'fail' : 'success'}`}>
              {error ? (
                <div>
                  <div>Oops, something went wrong!</div>
                  <div>Please try again later</div>
                </div>
              ) : (
                <div>
                  <div>Your bug has been filed successfully!</div>
                  {bugURL && <div><a target='_blank' href={bugURL}>Here is a link to it!</a></div>}
                </div>
              )}
            </div>
            <div className='Redux-Bug-Reporter__show-hide-container'>
              <button className={`Redux-Bug-Reporter__show-hide-button Redux-Bug-Reporter__show-hide-button--${error ? 'expanded' : 'collapsed'}`} onClick={this.dismiss} />
            </div>
          </div>
        )
      }

      return (
        <div className='Redux-Bug-Reporter'>
          {expanded && (
            <div className='Redux-Bug-Reporter__form'>
              <form onSubmit={this.submit}>
                <input className='Redux-Bug-Reporter__form-input Redux-Bug-Reporter__form-input--reporter' onChange={this.handleChange('reporter')} value={reporter} placeholder='Name' />
                <input className='Redux-Bug-Reporter__form-input Redux-Bug-Reporter__form-input--description' onChange={this.handleChange('description')} value={description} placeholder='Description' />
                <input className='Redux-Bug-Reporter__form-input Redux-Bug-Reporter__form-input--screenshotURL' onChange={this.handleChange('screenshotURL')} value={screenshotURL} placeholder='Screenshot URL' />
                <textarea className='Redux-Bug-Reporter__form-input Redux-Bug-Reporter__form-input--notes' onChange={this.handleChange('notes')} value={notes} placeholder='Notes' />
                <button className='Redux-Bug-Reporter__submit-button' type='submit'>File Bug</button>
              </form>
            </div>
          )}
          <div className='Redux-Bug-Reporter__show-hide-container'>
            <button className={`Redux-Bug-Reporter__show-hide-button Redux-Bug-Reporter__show-hide-button--${this.state.expanded ? 'expanded' : 'collapsed'}`} onClick={this.toggleExpanded} />
          </div>
        </div>
      )
    }
  })
}

const loadingLayout = (
  <div className='Redux-Bug-Reporter'>
    <div className='Redux-Bug-Reporter__loading-container'>
      <span className='Redux-Bug-Reporter__loading' />
    </div>
  </div>
)

const mapStateToProps = (store) => {
  return {
    storeState: store
  }
}

const mapDispatchToProps = (dispatch) => {
  const boundActions = bindActionCreators({overloadStore, initializePlayback, finishPlayback}, dispatch)
  return {
    dispatch,
    ...boundActions
  }
}

const ConnectedBugReporter = connect(mapStateToProps, mapDispatchToProps)(UnconnectedBugReporter)

export { UnconnectedBugReporter }
export default ConnectedBugReporter
