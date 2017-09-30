/* eslint-env mocha */
import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

import storeEnhancer, {overloadStore, initializePlayback, finishPlayback, playbackFlag, enhancerLog} from '../../src/store-enhancer'

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
    const store = configureStore()
    let expected = [
      { type: '@@redux/INIT' }
    ]
    expected.push({ type: '1' }, { type: '2' }, { type: '3' })
    store.dispatch({ type: '1' })
    store.dispatch({ type: '2' })
    store.dispatch({ type: '3' })

    expect(store.getState()).toEqual(expected);

    // Initialize playback
    store.dispatch(initializePlayback())
    expected = [{ type: 'A' }, { type: 'B' }, { type: 'C' }]

    // Dispatch ignored actions and reinitialized the store to initial bug state
    store.dispatch({ type: 'Fake action that should be ignored' })
    store.dispatch(overloadStore(expected))
    store.dispatch({ type: 'Fake action that should be ignored' })

    expect(store.getState()).toEqual(expected);

    // Dispatch a replay action and a fake action
    store.dispatch({ type: 'Fake action that should be ignored' })
    store.dispatch({ type: 'D', [playbackFlag]: true })
    expected.push({ type: 'D' })

    expect(store.getState()).toEqual(expected);

    // Finish playback, verify that actions can be dispatched as normal
    store.dispatch(finishPlayback())
    store.dispatch({ type: 'E' })
    expected.push({ type: 'E' })

    expect(store.getState()).toEqual(expected);
  })
  it('middleware functionality', () => {
    const initialState = [ {type: 'INITIAL_STATE'} ]
    const store = configureStore(initialState)
    initialState.push({ type: '@@redux/INIT' })
    const expected = [{ type: '1' }, { type: '2' }, { type: '3' }]
    store.dispatch({ type: '1' })
    store.dispatch({ type: '2' })
    store.dispatch({ type: '3' })

    expect(enhancerLog.getBugReporterInitialState()).toEqual(initialState)
    expect(enhancerLog.getActions()).toEqual(expected)

    // Test simple redaction
    store.dispatch({
      type: 'redaction A',
      name: 'Drew Schuster',
      meta: {
        redactFromBugReporter: true
      }
    })
    expected.push({ type: 'redaction A' })
    expect(enhancerLog.getActions()).toEqual(expected)

    // Test custom redaction
    store.dispatch({
      type: 'redaction A',
      name: 'Drew Schuster',
      meta: {
        unrelatedMeta: 'foo',
        redactFromBugReporter: true,
        redactFromBugReporterFn (action) {
          return {...action, name: '▮▮▮▮ ▮▮▮▮▮'}
        }
      }
    })
    expected.push({ type: 'redaction A', name: '▮▮▮▮ ▮▮▮▮▮', meta: { unrelatedMeta: 'foo' } })
    expect(enhancerLog.getActions()).toEqual(expected)
  })

  // TODO: Test thunked actions
})
