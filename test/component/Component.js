/* eslint-env mocha */
/* global fetch */
import React from 'react'
import { assert } from 'chai'
import nock from 'nock'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'
import { errorData } from '../../src/utils.js'
import {storeEnhancer} from '../../src/index'
import { createStore, applyMiddleware, compose } from 'redux'
import { fromJS } from 'immutable'
import thunk from 'redux-thunk'

let clientRender = true
function isClientRender () {
  return clientRender
}

let proxyquire = require('proxyquire').noPreserveCache()
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

let ReduxBugReporter, UnconnectedBugReporter
describe('Redux Bug Reporter component tests', () => {
  // Clean the nock object after every test.
  afterEach(function () {
    nock.cleanAll()
  })
  describe('Server side render tests', () => {
    beforeEach(function () {
      // TODO: Clean up these beforeEach functions
      clientRender = false
      let proxyquiredReduxBugReporter = proxyquire('../../src/redux-bug-reporter.js', {
        './is-client-render': { default: isClientRender }
      })
      ReduxBugReporter = proxyquiredReduxBugReporter.default
      UnconnectedBugReporter = proxyquiredReduxBugReporter.UnconnectedBugReporter
    })
    it('Server side render', () => {
      clientRender = false
      let store = configureStore()
      let wrapper = mount(
        <Provider store={store}>
          <ReduxBugReporter
            projectName='foo'
            submit='http://redux-bug-reporter.com'
          />
        </Provider>
      )
      let reduxBugReporter = wrapper.find(UnconnectedBugReporter)
      assert.equal(reduxBugReporter.html(), '<span></span>', 'Server render of redux bug reporter should be an empty span' + reduxBugReporter.html())
    })
  })
  describe('Client side render tests', () => {
    beforeEach(function () {
      clientRender = true
      let proxyquiredReduxBugReporter = proxyquire('../../src/redux-bug-reporter.js', {
        './is-client-render': { default: isClientRender }
      })
      ReduxBugReporter = proxyquiredReduxBugReporter.default
      UnconnectedBugReporter = proxyquiredReduxBugReporter.UnconnectedBugReporter
    })
    it('Happy path', (done) => {
      nock('http://redux-bug-reporter.com').post('/').reply(200, {
        bugURL: 'http://redux-bug-reporter.com/id/1'
      })
      let store = configureStore()
      let wrapper = mount(
        <Provider store={store}>
          <ReduxBugReporter
            projectName='foo'
            submit='http://redux-bug-reporter.com'
          />
        </Provider>
      )
      let reduxBugReporter = wrapper.find(UnconnectedBugReporter)
      let showHideButton = wrapper.find('.Redux-Bug-Reporter__show-hide-button')
      assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter'), 'Redux Bug Reporter is rendered')
      assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form').length === 0, 'Redux Bug Reporter is not initially expanded')
      showHideButton.simulate('click')
      assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form').length === 1, 'Redux Bug Reporter expands')
      showHideButton.simulate('click')
      assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form').length === 0, 'Redux Bug Reporter collapses')
      showHideButton.simulate('click')
      assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form').length === 1, 'Redux Bug Reporter expands')

      // Edit the inputs
      // TODO: Validate inputs
      reduxBugReporter.find('.Redux-Bug-Reporter__form-input--reporter').simulate('change', { target: { value: 'Drew Schuster' } })

      // Submit the bug
      let form = wrapper.find('form')
      form.prop('onSubmit')({ preventDefault: () => {} })
      assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__loading-container').length === 1, 'Redux Bug Reporter Loading')

      // Bug submission complete
      setTimeout(() => {
        assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').length === 1, 'Redux Bug Reporter Success displays')
        assert.include(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').html(), 'http://redux-bug-reporter.com/id/1', 'Link to bug displays')

        let closeButton = reduxBugReporter.find('button')
        closeButton.simulate('click')
        assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter'), 'Redux Bug Reporter is rendered')
        assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form').length === 0, 'Redux Bug Reporter is collapsed')
        done()
      }, 200)
    })
    it('customEncode and customDecode properties', (done) => {
      nock('http://redux-bug-reporter.com').post('/').reply(200, {
        bugURL: 'http://redux-bug-reporter.com/id/1'
      })
      const customEncode = (state) => {
        return state.toJSON()
      }
      const customDecode = (state) => {
        return fromJS(state)
      }
      let store = configureImmutableStore()
      let wrapper = mount(
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
      let reduxBugReporter = wrapper.find(UnconnectedBugReporter)
      let showHideButton = wrapper.find('.Redux-Bug-Reporter__show-hide-button')
      assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter'), 'Redux Bug Reporter is rendered')
      assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form').length === 0, 'Redux Bug Reporter is not initially expanded')
      showHideButton.simulate('click')
      assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form').length === 1, 'Redux Bug Reporter expands')
      showHideButton.simulate('click')
      assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form').length === 0, 'Redux Bug Reporter collapses')
      showHideButton.simulate('click')
      assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form').length === 1, 'Redux Bug Reporter expands')

      // Edit the inputs
      // TODO: Validate inputs
      reduxBugReporter.find('.Redux-Bug-Reporter__form-input--reporter').simulate('change', { target: { value: 'Drew Schuster' } })

      // Submit the bug
      let form = wrapper.find('form')
      form.prop('onSubmit')({ preventDefault: () => {} })
      assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__loading-container').length === 1, 'Redux Bug Reporter Loading')

      // Bug submission complete
      setTimeout(() => {
        assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').length === 1, 'Redux Bug Reporter Success displays')
        assert.include(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').html(), 'http://redux-bug-reporter.com/id/1', 'Link to bug displays')

        let closeButton = reduxBugReporter.find('button')
        closeButton.simulate('click')
        assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter'), 'Redux Bug Reporter is rendered')
        assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form').length === 0, 'Redux Bug Reporter is collapsed')
        done()
      }, 200)
    })
    it('Custom submit function', (done) => {
      nock('http://redux-bug-reporter.com').post('/').reply(200, {
        bugURL: 'http://redux-bug-reporter.com/id/2'
      })
      let store = configureStore()
      let submitFn = (newBug) => {
        return fetch('http://redux-bug-reporter.com', {
          method: 'post',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newBug)
        }).then(function (response) {
          if (!response.ok) {
            throw Error(response.statusText)
          }
          return response.json()
        })
      }
      let wrapper = mount(
        <Provider store={store}>
          <ReduxBugReporter
            projectName='foo'
            submit={submitFn}
          />
        </Provider>
      )
      let reduxBugReporter = wrapper.find(UnconnectedBugReporter)
      let showHideButton = wrapper.find('.Redux-Bug-Reporter__show-hide-button')
      assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter'), 'Redux Bug Reporter is rendered')
      showHideButton.simulate('click')
      assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form').length === 1, 'Redux Bug Reporter expands')

      // Submit the bug
      let form = wrapper.find('form')
      form.prop('onSubmit')({ preventDefault: () => {} })
      assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__loading-container').length === 1, 'Redux Bug Reporter Loading')

      // Bug submission complete
      setTimeout(() => {
        assert.isOk(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').length === 1, 'Redux Bug Reporter Success displays')
        assert.include(reduxBugReporter.find('.Redux-Bug-Reporter__form--success').html(), 'http://redux-bug-reporter.com/id/2', 'Link to bug displays')
        done()
      }, 200)
    })
    it('Error listeners', () => {
      errorData.clearErrors()
      let store = configureStore()
      mount(
        <Provider store={store}>
          <ReduxBugReporter
            projectName='foo'
            submit='http://redux-bug-reporter.com'
          />
        </Provider>
      )

      // verify overrides
      assert.isOk(window.console.error.bugReporterOverrideComplete, 'Console.error overridden')
      assert.isOk(window.onerror.bugReporterOverrideComplete, 'Window.onerror overridden')

      // normal console error
      window.console.error('Here is a console error')
      assert.deepEqual(errorData.getErrors(), [{ errorMsg: 'Here is a console error' }], 'Console error is logged')

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
      assert.deepEqual(errorData.getErrors()[1], expected, 'Console stack trace is logged')

      // window onerror
      expected = {
        errorMsg: 'simple error message',
        stackTrace: undefined
      }
      window.onerror('simple error message')
      assert.deepEqual(errorData.getErrors()[2], expected, 'window onerror is logged')

      // window onerror with stack trace
      expected = {
        errorMsg: 'message',
        stackTrace: 'stack trace'
      }
      window.onerror('message', undefined, undefined, undefined, { stack: 'stack trace' })
      assert.deepEqual(errorData.getErrors()[3], expected, 'window onerror is logged')
    })
    it('window.onerror listeners when window.onerror already exists', () => {
      errorData.clearErrors()
      // make window.onerror exist
      let originalCalled = false
      window.onerror = function () {
        originalCalled = true
      }
      let store = configureStore()
      mount(
        <Provider store={store}>
          <ReduxBugReporter
            projectName='foo'
            submit='http://redux-bug-reporter.com'
          />
        </Provider>
      )

      // verify overrides
      assert.isOk(window.onerror.bugReporterOverrideComplete, 'Window.onerror overridden')

      // window onerror
      let expected = {
        errorMsg: 'simple error message',
        stackTrace: undefined
      }
      window.onerror('simple error message')
      assert.deepEqual(errorData.getErrors()[0], expected, 'window onerror is logged')
      assert.isOk(originalCalled, 'original window.onerror was called')

      // window onerror with stack trace
      originalCalled = false
      expected = {
        errorMsg: 'message',
        stackTrace: 'stack trace'
      }
      window.onerror('message', undefined, undefined, undefined, { stack: 'stack trace' })
      assert.deepEqual(errorData.getErrors()[1], expected, 'window onerror is logged')
      assert.isOk(originalCalled, 'original window.onerror was called')
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
