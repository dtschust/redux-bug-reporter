import { combineReducers } from 'redux'
import todos from './todos'
import { fromJS } from 'immutable'
function input (state = fromJS({ value: 'Change this input, and all changes will be logged', numChanges: 0 }), action) {
  if (action.type === 'CHANGED_INPUT') {
    return state.set('value', action.payload)
  } else if (action.type === 'INCREMENT_CHANGE_COUNTER') {
    return state.update('numChanges', value => value + 1)
  }

  return state
}
const rootReducer = combineReducers({
  todos,
  input
})

export default rootReducer
