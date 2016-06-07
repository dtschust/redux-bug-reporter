/* eslint-env mocha */
import storeEnhancer, {overloadStore, initializePlayback, finishPlayback, playbackFlag, middlewareData} from '../../src/store-enhancer'
import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import { assert } from 'chai'

function reducer (state = [], action) {
  if (action) {
    return [...state, action]
  }
  return state
}

function configureStore (initialState) {
  return createStore(reducer, initialState, compose(storeEnhancer, applyMiddleware(thunk)))
}

describe('Store Enhancer tests', () => {
  it('bug playback functionality', () => {
    let store = configureStore()
    assert.isOk(true, 'here are some more tests')
    let expected = [
      { type: '@@redux/INIT' }
    ]
    expected.push({ type: '1' }, { type: '2' }, { type: '3' })
    store.dispatch({ type: '1' })
    store.dispatch({ type: '2' })
    store.dispatch({ type: '3' })
    assert.deepEqual(store.getState(), expected, 'Normal action dispatch')

    // Initialize playback
    store.dispatch(initializePlayback())
    expected = [{ type: 'A' }, { type: 'B' }, { type: 'C' }]

    // Dispatch ignored actions and reinitialized the store to initial bug state
    store.dispatch({ type: 'Fake action that should be ignored' })
    store.dispatch(overloadStore(expected))
    store.dispatch({ type: 'Fake action that should be ignored' })
    assert.deepEqual(store.getState(), expected, 'Overload Store action')

    // Dispatch a replay action and a fake action
    store.dispatch({ type: 'Fake action that should be ignored' })
    store.dispatch({ type: 'D', [playbackFlag]: true })
    expected.push({ type: 'D' })
    assert.deepEqual(store.getState(), expected, 'Only honors replayed actions')

    // Finish playback, verify that actions can be dispatched as normal
    store.dispatch(finishPlayback())
    store.dispatch({ type: 'E' })
    expected.push({ type: 'E' })
    assert.deepEqual(store.getState(), expected, 'Finish playback')
  })
  it('middleware functionality', () => {
    let initialState = [ {type: 'INITIAL_STATE'} ]
    let store = configureStore(initialState)
    initialState.push({ type: '@@redux/INIT' })
    let expected = [{ type: '1' }, { type: '2' }, { type: '3' }]
    store.dispatch({ type: '1' })
    store.dispatch({ type: '2' })
    store.dispatch({ type: '3' })
    assert.deepEqual(middlewareData.getBugReporterInitialState(), initialState, 'Initial state is stored')
    assert.deepEqual(middlewareData.getActions(), expected, 'Normal actions are caught')

    // Test simple redaction
    store.dispatch({
      type: 'redaction A',
      name: 'Drew Schuster',
      meta: {
        redactFromBugReporter: true
      }
    })
    expected.push({ type: 'redaction A' })
    assert.deepEqual(middlewareData.getActions(), expected, 'Redacted action is redacted')

    // Test custom redaction
    store.dispatch({
      type: 'redaction A',
      name: 'Drew Schuster',
      meta: {
        unrelatedMeta: 'foo',
        redactFromBugReporter: true,
        redactFromBugReporterFn: function (action) {
          return {...action, name: '▮▮▮▮ ▮▮▮▮▮'}
        }
      }
    })
    expected.push({ type: 'redaction A', name: '▮▮▮▮ ▮▮▮▮▮', meta: { unrelatedMeta: 'foo' } })
    assert.deepEqual(middlewareData.getActions(), expected, 'Redacted action is redacted')
  })

  // TODO: Test thunked actions
})
