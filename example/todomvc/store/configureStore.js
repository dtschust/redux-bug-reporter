import { createStore, applyMiddleware, compose } from 'redux'
import rootReducer from '../reducers'
import { storeEnhancer } from '../../../src/index'
import thunk from 'redux-thunk'
export default function configureStore (preloadedState) {
  const store = createStore(rootReducer, preloadedState,
    compose(storeEnhancer, applyMiddleware(thunk), window.devToolsExtension ? window.devToolsExtension() : f => f))

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextReducer = require('../reducers').default
      store.replaceReducer(nextReducer)
    })
  }

  return store
}
