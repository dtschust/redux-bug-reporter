/* global fetch */
import { createStore, applyMiddleware, compose } from 'redux'
import { fromJS } from 'immutable'
import thunk from 'redux-thunk'

import React from 'react'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'
import { errorData } from '../../src/utils'
import {storeEnhancer} from '../../src/index'

import ReduxBugReporter, { UnconnectedBugReporter } from '../../src/redux-bug-reporter'

// let clientRender = true
// function isClientRender () {
//   return clientRender
// }

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

// let ReduxBugReporter
// let UnconnectedBugReporter

describe('Redux Bug Reporter component tests', () => {
  xdescribe('Server side render tests', () => {
    // beforeEach(() => {
      // TODO: Clean up these beforeEach functions
      // clientRender = false
      // const proxyquiredReduxBugReporter = proxyquire('../../src/redux-bug-reporter.js', {
      //   './is-client-render': { default: isClientRender }
      // })
      // ReduxBugReporter = proxyquiredReduxBugReporter.default
      // UnconnectedBugReporter = proxyquiredReduxBugReporter.UnconnectedBugReporter
    // })
    it('Server side render', () => {
      // clientRender = false
      const store = configureStore()
      const wrapper = mount(
        <Provider store={store}>
          <ReduxBugReporter
            projectName='foo'
            submit='http://redux-bug-reporter.com'
          />
        </Provider>
      )
      const reduxBugReporter = wrapper.find(UnconnectedBugReporter)
      expect(reduxBugReporter.html()).toEqual('<span></span>')
    })
  })
  describe('Client side render tests', () => {
    // beforeEach(() => {
      // clientRender = true
      // const proxyquiredReduxBugReporter = proxyquire('../../src/redux-bug-reporter.js', {
      //   './is-client-render': { default: isClientRender }
      // })
      // ReduxBugReporter = proxyquiredReduxBugReporter.default
      // UnconnectedBugReporter = proxyquiredReduxBugReporter.UnconnectedBugReporter
    // })
    it('Happy path', (done) => {
      // nock('http://redux-bug-reporter.com').post('/').reply(200, {
      //   bugURL: 'http://redux-bug-reporter.com/id/1'
      // })
      const store = configureStore()
      const wrapper = mount(
        <Provider store={store}>
          <ReduxBugReporter
            projectName='foo'
            submit='http://redux-bug-reporter.com'
          />
        </Provider>
      )
      const reduxBugReporter = wrapper.find(UnconnectedBugReporter)
      const showHideButton = wrapper.find('.Redux-Bug-Reporter__show-hide-button')
      expect(reduxBugReporter.find('.Redux-Bug-Reporter')).toBeTruthy()

      // Form not initially expanded
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(0)
      showHideButton.simulate('click')

      // Expanded
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(1)
      showHideButton.simulate('click')

      // Collapsed
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(0)

      showHideButton.simulate('click')

      // Expanded
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(1)

      // Edit the inputs
      // TODO: Validate inputs
      reduxBugReporter.find('.Redux-Bug-Reporter__form-input--reporter').simulate('change', { target: { value: 'Drew Schuster' } })

      // Submit the bug
      const form = wrapper.find('form')
      form.prop('onSubmit')({ preventDefault: () => {} })

      // Loading
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__loading-container').length).toEqual(1)

      // Bug submission complete
      // setTimeout(() => {
      //   assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').length === 1, 'Redux Bug Reporter Success displays')
      //   assert.include(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').html(), 'http://redux-bug-reporter.com/id/1', 'Link to bug displays')

      //   const closeButton = reduxBugReporter.find('button')
      //   closeButton.simulate('click')
      //   assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter'), 'Redux Bug Reporter is rendered')
      //   assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form').length === 0, 'Redux Bug Reporter is collapsed')
      //   done()
      // }, 200)
      done()
    })

    it('customEncode and customDecode properties', (done) => {
      // nock('http://redux-bug-reporter.com').post('/').reply(200, {
      //   bugURL: 'http://redux-bug-reporter.com/id/1'
      // })
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
      const reduxBugReporter = wrapper.find(UnconnectedBugReporter)
      const showHideButton = wrapper.find('.Redux-Bug-Reporter__show-hide-button')

      // Is rendered
      expect(reduxBugReporter.find('.Redux-Bug-Reporter')).toBeTruthy()

      // Form not initially expanded
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(0)
      showHideButton.simulate('click')

      // Expanded
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(1)
      showHideButton.simulate('click')

      // Collapsed
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(0)

      showHideButton.simulate('click')

      // Expanded
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(1)

      // Edit the inputs
      // TODO: Validate inputs
      reduxBugReporter.find('.Redux-Bug-Reporter__form-input--reporter').simulate('change', { target: { value: 'Drew Schuster' } })

      // Submit the bug
      const form = wrapper.find('form')
      form.prop('onSubmit')({ preventDefault: () => {} })

      // loading
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__loading-container').length).toEqual(1)

      // Bug submission complete
      // setTimeout(() => {
      //   assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').length === 1, 'Redux Bug Reporter Success displays')
      //   assert.include(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').html(), 'http://redux-bug-reporter.com/id/1', 'Link to bug displays')

      //   const closeButton = reduxBugReporter.find('button')
      //   closeButton.simulate('click')
      //   assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter'), 'Redux Bug Reporter is rendered')
      //   assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form').length === 0, 'Redux Bug Reporter is collapsed')
      //   done()
      // }, 200)
      done()
    })
    it('Custom submit function', (done) => {
      // nock('http://redux-bug-reporter.com').post('/').reply(200, {
      //   bugURL: 'http://redux-bug-reporter.com/id/2'
      // })
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
      const reduxBugReporter = wrapper.find(UnconnectedBugReporter)
      const showHideButton = wrapper.find('.Redux-Bug-Reporter__show-hide-button')

      // Rendered
      expect(reduxBugReporter.find('.Redux-Bug-Reporter')).toBeTruthy()

      showHideButton.simulate('click')

      // Expands
      expect(reduxBugReporter.find('.Redux-Bug-Reporter__form').length).toEqual(1)

      // Submit the bug
      const form = wrapper.find('form')
      form.prop('onSubmit')({ preventDefault: () => {} })

      expect(reduxBugReporter.find('.Redux-Bug-Reporter__loading-container').length).toEqual(1)

      // Bug submission complete
      // setTimeout(() => {
      //   assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').length === 1, 'Redux Bug Reporter Success displays')
      //   assert.include(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').html(), 'http://redux-bug-reporter.com/id/2', 'Link to bug displays')
      //   done()
      // }, 200)
      done()
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
})

// TODO: Test playback
// TODO: Test submission failure
// TODO: Test actually filling out the form, something's hard to mock out there
// TODO: Test redactstorestate prop
// TODO: Somehow test not mounted
// TODO: Props to test: name, projectName
// TODO: Verify that real network requests aren't made during playback
// TODO: Test meta
