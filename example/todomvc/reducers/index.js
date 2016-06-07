import { combineReducers } from 'redux'
import todos from './todos'

function input (state = { value: 'Change this input, and all changes will be logged', numChanges: 0 }, action) {
  let newState = state
  if (action.type === 'CHANGED_INPUT') {
    newState = {...newState, value: action.payload}
  } else if (action.type === 'INCREMENT_CHANGE_COUNTER') {
    newState = {...newState, numChanges: newState.numChanges + 1}
  }

  return newState
}
const rootReducer = combineReducers({
  todos,
  input
})

export default rootReducer
