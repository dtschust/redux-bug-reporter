/* global fetch */
import { createStore, applyMiddleware, compose } from 'redux'
import { fromJS } from 'immutable'
import thunk from 'redux-thunk'

import React from 'react'
import Enzyme, { mount, shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

import { Provider } from 'react-redux'
import { errorData } from '../../src/utils'
import {storeEnhancer} from '../../src/index'

import ReduxBugReporter, { UnconnectedBugReporter } from '../../src/redux-bug-reporter'

Enzyme.configure({ adapter: new Adapter() })
global.fetch = require('jest-fetch-mock')

require('es6-promise').polyfill()
require('isomorphic-fetch')

function reducer (state = [], action) {
  if (action) {
    return [...state, action]
  }
  return state
}

function configureStore (initialState) {
  return createStore(reducer, initialState, compose(storeEnhancer, applyMiddleware(thunk)))
}

function immutableReducer (state = fromJS([]), action) {
  if (action) {
    return state.push(action)
  }
  return state
}

function configureImmutableStore (initialState) {
  return createStore(immutableReducer, initialState, compose(storeEnhancer, applyMiddleware(thunk)))
}

describe('Redux Bug Reporter component tests', () => {
  beforeEach(() => {
    fetch.resetMocks()
  })

  let reduxBugReporter
  const udpatedReduxBugReporter = wrapper => wrapper
    .update()
    .find(UnconnectedBugReporter)

  it('Happy path', (done) => {
    fetch.mockResponse(JSON.stringify({
      bugURL: 'http://redux-bug-reporter.com/id/1'
    }), 200)
    const store = configureStore()
    const wrapper = mount(
      <Provider store={store}>
        <ReduxBugReporter
          projectName='foo'
          submit='http://redux-bug-reporter.com'
        />
      </Provider>
    )
    reduxBugReporter = udpatedReduxBugReporter(wrapper)
    const showHideButton = wrapper.find('.Redux-Bug-Reporter__show-hide-button')
    expect(reduxBugReporter.find('.Redux-Bug-Reporter')).toBeTruthy()

    // Form not initially expanded
    expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(0)
    showHideButton.simulate('click')
    reduxBugReporter = udpatedReduxBugReporter(wrapper)

    // Expanded
    expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(1)
    showHideButton.simulate('click')
    reduxBugReporter = udpatedReduxBugReporter(wrapper)

    // Collapsed
    expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(0)

    showHideButton.simulate('click')
    reduxBugReporter = udpatedReduxBugReporter(wrapper)

    // Expanded
    expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(1)

    // Edit the inputs
    // TODO: Validate inputs
    reduxBugReporter.find('.Redux-Bug-Reporter__form-input--reporter').simulate('change', { target: { value: 'Drew Schuster' } })
    reduxBugReporter = udpatedReduxBugReporter(wrapper)

    // Submit the bug
    const form = wrapper.find('form')
    form.prop('onSubmit')({ preventDefault: () => {} })

    // Loading
    reduxBugReporter = udpatedReduxBugReporter(wrapper)
    expect(reduxBugReporter.find('.Redux-Bug-Reporter__loading-container').length).toEqual(1)

    // Bug submission complete
    setTimeout(() => {
      expect(fetch.mock.calls[0][0]).toEqual('http://redux-bug-reporter.com')
      expect(fetch.mock.calls[0][1].method).toEqual('post')
      reduxBugReporter = udpatedReduxBugReporter(wrapper)
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').length).toEqual(1)
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').html()).toContain('http://redux-bug-reporter.com/id/1')

      const closeButton = reduxBugReporter.find('button')
      closeButton.simulate('click')
      reduxBugReporter = udpatedReduxBugReporter(wrapper)
      expect(reduxBugReporter.find('.Redux-Bug-Reporter')).toBeTruthy()
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(0)
      done()
    }, 0)
  })
  it('customEncode and customDecode properties', (done) => {
    fetch.mockResponse(JSON.stringify({
      bugURL: 'http://redux-bug-reporter.com/id/1'
    }), 200)
    const customEncode = (state) => state.toJSON()
    const customDecode = (state) => fromJS(state)
    const store = configureImmutableStore()
    const wrapper = mount(
      <Provider store={store}>
        <ReduxBugReporter
          projectName='foo'
          submit='http://redux-bug-reporter.com'
          customEncode={customEncode}
          customDecode={customDecode}
        />
      </Provider>
    )
    store.dispatch({type: 'FOO'})
    reduxBugReporter = udpatedReduxBugReporter(wrapper)
    const showHideButton = wrapper.find('.Redux-Bug-Reporter__show-hide-button')

    // Is rendered
    expect(reduxBugReporter.find('.Redux-Bug-Reporter')).toBeTruthy()

    // Form not initially expanded
    expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(0)
    showHideButton.simulate('click')
    reduxBugReporter = udpatedReduxBugReporter(wrapper)

    // Expanded
    expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(1)
    showHideButton.simulate('click')
    reduxBugReporter = udpatedReduxBugReporter(wrapper)

    // Collapsed
    expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(0)

    showHideButton.simulate('click')
    reduxBugReporter = udpatedReduxBugReporter(wrapper)

    // Expanded
    expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(1)

    // Edit the inputs
    // TODO: Validate inputs
    reduxBugReporter.find('.Redux-Bug-Reporter__form-input--reporter').simulate('change', { target: { value: 'Drew Schuster' } })

    // Submit the bug
    const form = wrapper.find('form')
    form.prop('onSubmit')({ preventDefault: () => {} })
    reduxBugReporter = udpatedReduxBugReporter(wrapper)

    // loading
    expect(reduxBugReporter.find('.Redux-Bug-Reporter__loading-container').length).toEqual(1)

    // Bug submission complete
    setTimeout(() => {
      expect(fetch.mock.calls[0][0]).toEqual('http://redux-bug-reporter.com')
      expect(fetch.mock.calls[0][1].method).toEqual('post')
      reduxBugReporter = udpatedReduxBugReporter(wrapper)
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').length).toEqual(1)
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').html()).toContain('http://redux-bug-reporter.com/id/1')

      const closeButton = reduxBugReporter.find('button')
      closeButton.simulate('click')
      reduxBugReporter = udpatedReduxBugReporter(wrapper)
      expect(reduxBugReporter.find('.Redux-Bug-Reporter')).toBeTruthy()
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__form')).toBeTruthy()
      done()
    }, 0)
  })
  it('Custom submit function', (done) => {
    fetch.mockResponse(JSON.stringify({
      bugURL: 'http://redux-bug-reporter.com/id/2'
    }), 200)
    const store = configureStore()
    const submitFn = (newBug) => fetch('http://redux-bug-reporter.com', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBug)
      }).then((response) => {
        if (!response.ok) {
          throw Error(response.statusText)
        }
        return response.json()
      })
    const wrapper = mount(
      <Provider store={store}>
        <ReduxBugReporter
          projectName='foo'
          submit={submitFn}
        />
      </Provider>
    )
    reduxBugReporter = udpatedReduxBugReporter(wrapper)
    const showHideButton = wrapper.find('.Redux-Bug-Reporter__show-hide-button')

    // Rendered
    expect(reduxBugReporter.find('.Redux-Bug-Reporter')).toBeTruthy()

    showHideButton.simulate('click')
    reduxBugReporter = udpatedReduxBugReporter(wrapper)

    // Expands
    expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(1)

    // Submit the bug
    const form = wrapper.find('form')
    form.prop('onSubmit')({ preventDefault: () => {} })
    reduxBugReporter = udpatedReduxBugReporter(wrapper)

    expect(reduxBugReporter.find('.Redux-Bug-Reporter__loading-container').length).toEqual(1)

    // Bug submission complete
    setTimeout(() => {
      expect(fetch.mock.calls[0][0]).toEqual('http://redux-bug-reporter.com')
      expect(fetch.mock.calls[0][1].method).toEqual('post')
      reduxBugReporter = udpatedReduxBugReporter(wrapper)
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').length).toEqual(1)
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').html()).toContain('http://redux-bug-reporter.com/id/2')
      done()
    }, 0)
  })
  it('Error listeners', () => {
    errorData.clearErrors()
    const store = configureStore()
    mount(
      <Provider store={store}>
        <ReduxBugReporter
          projectName='foo'
          submit='http://redux-bug-reporter.com'
        />
      </Provider>
    )

    // verify overrides
    expect(window.console.error.bugReporterOverrideComplete).toBeTruthy()
    expect(window.onerror.bugReporterOverrideComplete).toBeTruthy()

    // normal console error
    window.console.error('Here is a console error')

    expect(errorData.getErrors()).toEqual([{ errorMsg: 'Here is a console error' }])

    // console error with stack trace
    window.console.error({
      name: 'name',
      message: 'here is a message',
      stack: 'This is a stack trace'
    })
    let expected = {
      errorMsg: 'name: here is a message',
      stackTrace: 'This is a stack trace'
    }

    expect(errorData.getErrors()[1]).toEqual(expected)

    // window onerror
    expected = {
      errorMsg: 'simple error message',
      stackTrace: undefined
    }
    window.onerror('simple error message')
    expect(errorData.getErrors()[2]).toEqual(expected)

    // window onerror with stack trace
    expected = {
      errorMsg: 'message',
      stackTrace: 'stack trace'
    }
    window.onerror('message', undefined, undefined, undefined, { stack: 'stack trace' })
    expect(errorData.getErrors()[3]).toEqual(expected)
  })
  it('window.onerror listeners when window.onerror already exists', () => {
    errorData.clearErrors()
    // make window.onerror exist
    let originalCalled = false
    window.onerror = function onerror() {
      originalCalled = true
    }
    const store = configureStore()
    mount(
      <Provider store={store}>
        <ReduxBugReporter
          projectName='foo'
          submit='http://redux-bug-reporter.com'
        />
      </Provider>
    )

    // verify overrides
    expect(window.onerror.bugReporterOverrideComplete).toBeTruthy()

    // window onerror
    let expected = {
      errorMsg: 'simple error message',
      stackTrace: undefined
    }
    window.onerror('simple error message')
    expect(errorData.getErrors()[0]).toEqual(expected)
    expect(originalCalled).toBeTruthy()

    // window onerror with stack trace
    originalCalled = false
    expected = {
      errorMsg: 'message',
      stackTrace: 'stack trace'
    }
    window.onerror('message', undefined, undefined, undefined, { stack: 'stack trace' })
    expect(errorData.getErrors()[1]).toEqual(expected)
    expect(originalCalled).toBeTruthy()
  })
})

describe('Redux Bug Reporter playback tests', () => {
  let defaultArgs
  let defaultProps
  const spyConsoleLog = jest
    .spyOn(console, 'log')
    .mockImplementation(() => {})

  beforeEach(() => {
    defaultArgs = {
      actions: [{}],
      initialState: null,
      finalState: null,
      delay: undefined,
    }
    defaultProps = {
      customDecode: jest.fn(arg => arg),
      dispatch: jest.fn(),
      finishPlayback: jest.fn(),
      initializePlayback: jest.fn(),
      overloadStore: jest.fn(),
      projectName: 'foo',
      storeState: {},
      submit: 'http://redux-bug-reporter.com',
    }
  })

  afterEach(() => {
    defaultProps.customDecode.mockReset()
    defaultProps.dispatch.mockReset()
    defaultProps.finishPlayback.mockReset()
    defaultProps.initializePlayback.mockReset()
    defaultProps.overloadStore.mockReset()
    spyConsoleLog.mockReset()
  })

  it('aborts when delay === -1', () => {
    const props = { ...defaultProps }
    const args = { ...defaultArgs, delay: -1 }
    const instance = shallow(<UnconnectedBugReporter { ...props } />).instance()
    instance.bugReporterPlayback(...Object.values(args))
    expect(instance.props.overloadStore).toHaveBeenCalledTimes(1)
  })

  it('makes function calls', () => {
    const props = { ...defaultProps }
    const args = { ...defaultArgs }
    const instance = shallow(<UnconnectedBugReporter { ...props } />).instance()
    instance.bugReporterPlayback(...Object.values(args))
    const { customDecode, initializePlayback, overloadStore } = instance.props
    expect(customDecode).toHaveBeenCalledTimes(2)
    expect(initializePlayback).toHaveBeenCalledTimes(1)
    expect(overloadStore).toHaveBeenCalledTimes(1)
    expect(spyConsoleLog).toHaveBeenCalledTimes(1)
  })

  it('does not call `customDecode` when undefined', () => {
    const props = { ...defaultProps, customDecode: undefined }
    const args = { ...defaultArgs }
    const instance = shallow(<UnconnectedBugReporter { ...props } />).instance()
    instance.bugReporterPlayback(...Object.values(args))
    const { customDecode } = instance.props
    expect(customDecode).toBe(undefined)
  })

  it('iterates actions', () => {
    const props = { ...defaultProps }
    const args = {
      ...defaultArgs,
      actions: [
        defaultArgs.actions[0],
        { type: 'ACTION_ONE', payload: { property: 'ACTION_ONE_PAYLOAD_PROPERTY' } },
        { type: 'ACTION_TWO', payload: { property: 'ACTION_TWO_PAYLOAD_PROPERTY' } },
      ],
    }
    const instance = shallow(<UnconnectedBugReporter { ...props } />).instance()
    instance.bugReporterPlayback(...Object.values(args))
    const { customDecode, dispatch, initializePlayback, overloadStore } = instance.props
    expect(customDecode).toHaveBeenCalledTimes(2)
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(initializePlayback).toHaveBeenCalledTimes(1)
    expect(overloadStore).toHaveBeenCalledTimes(1)
    expect(spyConsoleLog).toHaveBeenCalledTimes(0)
  })

  it('reports divergence between storeState and finalState', () => {
    const storeState = { slice: { property: 'SLICE_PROPERTY' } }
    const finalState = { slice: { mismatch: 'SLICE_MISMATCH' } }
    const props = { ...defaultProps, storeState }
    const args = { ...defaultArgs, finalState }
    const instance = shallow(<UnconnectedBugReporter { ...props } />).instance()
    instance.bugReporterPlayback(...Object.values(args))
    expect(spyConsoleLog).toHaveBeenCalledTimes(3)
  })

  it('does not report when storeState and finalState are the same', () => {
    const storeState = { slice: { property: 'SLICE_PROPERTY' } }
    const finalState = { slice: { property: 'SLICE_PROPERTY' } }
    const props = { ...defaultProps, storeState }
    const args = { ...defaultArgs, finalState }
    const instance = shallow(<UnconnectedBugReporter { ...props } />).instance()
    instance.bugReporterPlayback(...Object.values(args))
    expect(spyConsoleLog).toHaveBeenCalledTimes(1)
  })
})

describe('Redux Bug Reporter render', () => {
  let defaultProps

  beforeEach(() => {
    defaultProps = {
      customDecode: () => {},
      dispatch: () => {},
      finishPlayback: () => {},
      initializePlayback: () => {},
      overloadStore: () => {},
      projectName: 'foo',
      storeState: {},
      submit: 'http://redux-bug-reporter.com',
    }
  })

  it('renders button without the form', () => {
    const props = { ...defaultProps }
    const wrapper = shallow(<UnconnectedBugReporter { ...props } />)
    expect(wrapper).toMatchSnapshot()
  })

  it('renders button and form', () => {
    const props = { ...defaultProps }
    const wrapper = shallow(<UnconnectedBugReporter { ...props } />)
    wrapper.instance().setState({ expanded: true })
    wrapper.update()
    expect(wrapper).toMatchSnapshot()
  })

  it('renders error message', () => {
    const props = { ...defaultProps }
    const wrapper = shallow(<UnconnectedBugReporter { ...props } />)
    wrapper.instance().setState({
      bugFiled: true,
      error: true,
    })
    wrapper.update()
    expect(wrapper).toMatchSnapshot()
  })

  it('renders success after filing bug report', () => {
    const props = { ...defaultProps }
    const wrapper = shallow(<UnconnectedBugReporter { ...props } />)
    wrapper.instance().setState({
      bugFiled: true,
      bugURL: 'BUG_URL',
    })
    wrapper.update()
    expect(wrapper).toMatchSnapshot()
  })
})

// TODO: Test submission failure
// TODO: Test actually filling out the form, something's hard to mock out there
// TODO: Test redactstorestate prop
// TODO: Somehow test not mounted
// TODO: Props to test: name, projectName
// TODO: Verify that real network requests aren't made during playback
// TODO: Test meta
