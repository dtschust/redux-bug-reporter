import cloneDeep from 'lodash.clonedeep'

export const overloadStoreActionType = 'REDUX_BUG_REPORTER_OVERLOAD_STORE'
const initializePlaybackActionType = 'REDUX_BUG_REPORTER_INITIALIZE_PLAYBACK'
const finishPlaybackActionType = 'REDUX_BUG_REPORTER_FINISH_PLAYBACK'

export const playbackFlag = 'REDUX_BUG_REPORTER_PLAYBACK'

export function overloadStore(payload) {
	return {
		type: overloadStoreActionType,
		payload,
	}
}

export function initializePlayback() {
	return {
		type: initializePlaybackActionType,
	}
}

export function finishPlayback() {
	return {
		type: finishPlaybackActionType,
	}
}

export const enhancerLog = {
	actions: [],
	bugReporterInitialState: {},
	addAction(action) {
		this.actions.push(action)
	},
	clearActions() {
		this.actions = []
	},
	getActions() {
		return this.actions
	},
	setBugReporterInitialState(state) {
		this.bugReporterInitialState = state
	},
	getBugReporterInitialState() {
		return this.bugReporterInitialState
	},
}

const storeEnhancer = createStore => (
	originalReducer,
	initialState,
	enhancer,
) => {
	let playbackEnabled = false
	// Handle the overloading in the reducer here
	function reducer(state, action = {}) {
		if (action.type === overloadStoreActionType) {
			// eslint-disable-next-line no-console
			console.warn(
				'Overriding the store. You should only be doing this if you are using the bug reporter',
			)
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
		if (!playbackEnabled) {
			const actions = enhancerLog.getActions()
			// If this is the first action, log the initial state
			if (actions.length === 0) {
				enhancerLog.setBugReporterInitialState(state)
			}

			// Potentially redact any sensitive data in the action payload
			if (action.meta && action.meta.redactFromBugReporter) {
				let redactedAction = cloneDeep(action)
				const meta = redactedAction.meta
				if (meta.redactFromBugReporterFn) {
					redactedAction = meta.redactFromBugReporterFn(redactedAction)

					// clean up the redaction flags
					delete redactedAction.meta.redactFromBugReporter
					delete redactedAction.meta.redactFromBugReporterFn
				} else {
					// if there's no redactFromBugReporterFn, remove everything except the event type
					redactedAction = { type: redactedAction.type }
				}
				enhancerLog.addAction(redactedAction)
			} else {
				enhancerLog.addAction(action)
			}
		}

		// Remove the playback flag from the payload
		if (action[playbackFlag]) {
			// eslint-disable-next-line no-param-reassign
			delete action[playbackFlag]
		}

		// eslint-disable-next-line prefer-rest-params
		return originalReducer(...arguments)
	}
	const store = createStore(reducer, initialState, enhancer)
	const origDispatch = store.dispatch
	enhancerLog.clearActions()
	enhancerLog.setBugReporterInitialState({})

	// wrap around dispatch to disable all non-playback actions during playback
	function dispatch(action, ...args) {
		// Allow overload and finishPlayback actions
		if (
			action &&
			action.type &&
			(action.type === overloadStoreActionType ||
				action.type === finishPlaybackActionType)
		) {
			return origDispatch(action, ...args)
		}
		if (playbackEnabled && !action[playbackFlag]) {
			// ignore the action
			return store.getState()
		}
		return origDispatch(action, ...args)
	}

	return {
		...store,
		dispatch,
	}
}

export default storeEnhancer
