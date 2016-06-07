import cloneDeep from 'lodash.clonedeep'
import isClientRender from './is-client-render'

export const overloadStoreActionType = 'REDUX_BUG_REPORTER_OVERLOAD_STORE'
const initializePlaybackActionType = 'REDUX_BUG_REPORTER_INITIALIZE_PLAYBACK'
const finishPlaybackActionType = 'REDUX_BUG_REPORTER_FINISH_PLAYBACK'

export const playbackFlag = 'REDUX_BUG_REPORTER_PLAYBACK'

export const overloadStore = function (payload) {
  return {
    type: overloadStoreActionType,
    payload
  }
}

export const initializePlayback = function () {
  return {
    type: initializePlaybackActionType
  }
}

export const finishPlayback = function (payload) {
  return {
    type: finishPlaybackActionType
  }
}
let storeEnhancer = f => f
if (isClientRender()) {
  storeEnhancer = (createStore) => (originalReducer, initialState, enhancer) => {
    let playbackEnabled = false
    // Handle the overloading in the reducer here
    let reducer = function (state, action = {}) {
      if (action.type === overloadStoreActionType) {
        console.warn('Overriding the store. You should only be doing this if you are using the bug reporter')
        return action.payload
      } else if (action.type === initializePlaybackActionType) {
        // starting playback
        playbackEnabled = true
        return state
      } else if (action.type === finishPlaybackActionType) {
        // stopping playback
        playbackEnabled = false
        return state
      }

      // Log the action
      if (isClientRender() && !playbackEnabled) {
        let actions = middlewareData.getActions()
        // If this is the first action, log the initial state
        if (actions.length === 0) {
          middlewareData.setBugReporterInitialState(state)
        }

        // Potentially redact any sensitive data in the action payload
        if (action.meta && action.meta.redactFromBugReporter) {
          let redactedAction = cloneDeep(action)
          let meta = redactedAction.meta
          if (meta.redactFromBugReporterFn) {
            redactedAction = meta.redactFromBugReporterFn(redactedAction)

            // clean up the redaction flags
            delete redactedAction.meta.redactFromBugReporter
            delete redactedAction.meta.redactFromBugReporterFn
          } else {
            // if there's no redactFromBugReporterFn, remove everything except the event type
            redactedAction = {type: redactedAction.type}
          }
          middlewareData.addAction(redactedAction)
        } else {
          middlewareData.addAction(action)
        }
      }

      // Remove the playback flag from the payload
      if (action[playbackFlag]) {
        delete action[playbackFlag]
      }

      return originalReducer(...arguments)
    }
    let store = createStore(reducer, initialState, enhancer)
    let origDispatch = store.dispatch
    middlewareData.clearActions()
    middlewareData.setBugReporterInitialState({})

    // wrap around dispatch disable all non-playback actions during playback
    let dispatch = function (action) {
      // Allow overload and finishPlayback actions
      if (action && action.type &&
        (action.type === overloadStoreActionType || action.type === finishPlaybackActionType)) {
        return origDispatch(...arguments)
      }
      if (playbackEnabled && !action[playbackFlag]) {
        // ignore the action
        return
      }
      return origDispatch(...arguments)
    }

    return {
      ...store,
      dispatch
    }
  }
}

export let middlewareData = {
  actions: [],
  bugReporterInitialState: {},
  addAction: function (action) {
    this.actions.push(action)
  },
  clearActions: function () {
    this.actions = []
  },
  getActions: function () {
    return this.actions
  },
  setBugReporterInitialState: function (state) {
    this.bugReporterInitialState = state
  },
  getBugReporterInitialState: function () {
    return this.bugReporterInitialState
  }
}

export default storeEnhancer
