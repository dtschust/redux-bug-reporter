import React from 'react'
import PropTypes from 'proptypes'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import isEqual from 'lodash.isequal'
import isFunction from 'lodash.isfunction'
import {
	enhancerLog,
	overloadStore,
	initializePlayback,
	finishPlayback,
	playbackFlag,
} from './store-enhancer'

import { listenToErrors, errorData } from './utils'
import createSubmit from './integrations/default'

require('es6-promise').polyfill()

const loadingLayout = (
	<div className="Redux-Bug-Reporter">
		<div className="Redux-Bug-Reporter__loading-container">
			<span className="Redux-Bug-Reporter__loading" />
		</div>
	</div>
)

const propTypes = {
	// passed in from parent
	submit: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
	projectName: PropTypes.string.isRequired,
	redactStoreState: PropTypes.func,
	name: PropTypes.string,
	meta: PropTypes.any, // eslint-disable-line react/forbid-prop-types
	customEncode: PropTypes.func,
	customDecode: PropTypes.func,
	// Passed in by redux-bug-reporter
	dispatch: PropTypes.func.isRequired,
	storeState: PropTypes.any.isRequired, // eslint-disable-line react/forbid-prop-types
	overloadStore: PropTypes.func.isRequired,
	initializePlayback: PropTypes.func.isRequired,
	finishPlayback: PropTypes.func.isRequired,
}

const defaultProps = {
	// passed in from parent
	redactStoreState: undefined,
	name: undefined,
	meta: undefined,
	customEncode: undefined,
	customDecode: undefined,
}

class UnconnectedBugReporter extends React.Component {
	constructor(props) {
		super()
		this.state = {
			expanded: false,
			loading: false,
			bugFiled: false,
			reporter: props.name || '',
			description: '',
			screenshotURL: '',
			notes: '',
			error: '',
			bugURL: '',
		}

		this.toggleExpanded = this.toggleExpanded.bind(this)
		this.bugReporterPlayback = this.bugReporterPlayback.bind(this)
		this.submit = this.submit.bind(this)
		this.dismiss = this.dismiss.bind(this)
		this.handleChange = this.handleChange.bind(this)
	}

	componentDidMount() {
		listenToErrors()
		// Global function to play back a bug
		window.bugReporterPlayback = this.bugReporterPlayback
	}

	shouldComponentUpdate(nextProps, nextState) {
		// Do not bother rerendering every props change.
		// Rerender only needs to occur on state change
		if (this.state !== nextState) {
			return true
		}
		return false
	}

	toggleExpanded() {
		this.setState({ expanded: !this.state.expanded })
	}

	bugReporterPlayback(actions, initialState, finalState, delay = 100) {
		// eslint-disable-next-line no-shadow
		const { dispatch, overloadStore, customDecode } = this.props
		if (delay === -1) {
			// Do not playback, just jump to the final state
			overloadStore(finalState)
			return
		}

		this.props.initializePlayback()
		if (customDecode) {
			/* eslint-disable no-param-reassign */
			initialState = customDecode(initialState)
			finalState = customDecode(finalState)
			/* eslint-enable no-param-reassign */
		}
		overloadStore(initialState)

		const performNextAction = () => {
			const action = actions[0]

			// Let store know this is a playback action
			action[playbackFlag] = true

			dispatch(action)
			actions.splice(0, 1)
			/* eslint-disable no-console */
			if (actions.length > 0) {
				setTimeout(performNextAction, delay)
			} else {
				this.props.finishPlayback()
				const storeState = this.props.storeState
				const keys = Object.keys(storeState)
				keys.forEach(key => {
					if (
						!isEqual(storeState[key], finalState[key]) &&
						// In case reducer is an immutableJS object, call toJSON on it.
						!(
							storeState[key].toJSON &&
							/* istanbul ignore next */
							finalState[key].toJSON &&
							/* istanbul ignore next */
							isEqual(storeState[key].toJSON(), finalState[key].toJSON())
						)
					) {
						console.log(
							`The following reducer does not strictly equal the bug report final state: ${key}. I'll print them both out so you can see the differences.`,
						)
						console.log(
							`${key} current state:`,
							storeState[key],
							`\n${key} bug report state:`,
							finalState[key],
						)
					}
				})
				console.log('Playback complete!')
			}
			/* eslint-enable no-console */
		}

		performNextAction()
	}

	submit(e) {
		e.preventDefault()
		const {
			submit,
			projectName,
			storeState,
			redactStoreState,
			meta,
			customEncode,
		} = this.props
		const { reporter, description, screenshotURL, notes } = this.state
		this.setState({ loading: true })

		let state = storeState
		let initialState = enhancerLog.getBugReporterInitialState()
		let promise
		if (redactStoreState) {
			initialState = redactStoreState(initialState)
			state = redactStoreState(state)
		}

		if (customEncode) {
			initialState = customEncode(initialState)
			state = customEncode(state)
		}

		const newBug = {
			projectName,
			state,
			initialState,
			actions: enhancerLog.getActions(),
			consoleErrors: errorData.getErrors(),
			reporter,
			description,
			screenshotURL,
			notes,
			meta,
			useragent: window.navigator.userAgent,
			windowDimensions: [window.innerWidth, window.innerHeight],
			windowLocation: window.location.href,
		}

		// if submit is a function, call it instead of fetching
		// and attach to the promise returned
		if (isFunction(submit)) {
			promise = submit(newBug)
		} else {
			const submitFn = createSubmit({ url: submit })
			promise = submitFn(newBug)
		}

		promise
			.then((json = {}) => {
				const { bugURL } = json
				this.setState({
					loading: false,
					bugFiled: true,
					bugURL,
					expanded: true,
				})
			})
			.catch(error => {
				// eslint-disable-next-line no-console
				console.error('Error filing bug', error)
				this.setState({
					loading: false,
					bugFiled: true,
					error,
					expanded: true,
				})
			})
	}

	dismiss(e) {
		e.preventDefault()
		this.setState({ bugFiled: false, expanded: false, bugURL: '' })
	}

	handleChange(field) {
		return e => {
			this.setState({ [field]: e.target.value })
		}
	}

	render() {
		const {
			reporter,
			description,
			screenshotURL,
			notes,
			loading,
			bugFiled,
			error,
			expanded,
			bugURL,
		} = this.state
		if (loading) {
			return loadingLayout
		}

		if (bugFiled) {
			return (
				<div className="Redux-Bug-Reporter">
					<div
						className={`Redux-Bug-Reporter__form Redux-Bug-Reporter__form--${error
							? 'fail'
							: 'success'}`}
					>
						{error ? (
							<div>
								<div>Oops, something went wrong!</div>
								<div>Please try again later</div>
							</div>
						) : (
							<div>
								<div>Your bug has been filed successfully!</div>
								{bugURL && (
									<div>
										<a target="_blank" href={bugURL}>
											Here is a link to it!
										</a>
									</div>
								)}
							</div>
						)}
					</div>
					<div className="Redux-Bug-Reporter__show-hide-container">
						<button
							className={`Redux-Bug-Reporter__show-hide-button Redux-Bug-Reporter__show-hide-button--${error
								? 'expanded'
								: 'collapsed'}`}
							onClick={this.dismiss}
						/>
					</div>
				</div>
			)
		}

		return (
			<div className="Redux-Bug-Reporter">
				{expanded && (
					<div className="Redux-Bug-Reporter__form">
						<form onSubmit={this.submit}>
							<input
								className="Redux-Bug-Reporter__form-input Redux-Bug-Reporter__form-input--reporter"
								onChange={this.handleChange('reporter')}
								value={reporter}
								placeholder="Name"
							/>
							<input
								className="Redux-Bug-Reporter__form-input Redux-Bug-Reporter__form-input--description"
								onChange={this.handleChange('description')}
								value={description}
								placeholder="Description"
							/>
							<input
								className="Redux-Bug-Reporter__form-input Redux-Bug-Reporter__form-input--screenshotURL"
								onChange={this.handleChange('screenshotURL')}
								value={screenshotURL}
								placeholder="Screenshot URL"
							/>
							<textarea
								className="Redux-Bug-Reporter__form-input Redux-Bug-Reporter__form-input--notes"
								onChange={this.handleChange('notes')}
								value={notes}
								placeholder="Notes"
							/>
							<button
								className="Redux-Bug-Reporter__submit-button"
								type="submit"
							>
								File Bug
							</button>
						</form>
					</div>
				)}
				<div className="Redux-Bug-Reporter__show-hide-container">
					<button
						className={`Redux-Bug-Reporter__show-hide-button Redux-Bug-Reporter__show-hide-button--${this
							.state.expanded
							? 'expanded'
							: 'collapsed'}`}
						onClick={this.toggleExpanded}
					/>
				</div>
			</div>
		)
	}
}

UnconnectedBugReporter.displayName = 'Bug Reporter'
UnconnectedBugReporter.propTypes = propTypes
UnconnectedBugReporter.defaultProps = defaultProps

const mapStateToProps = store => ({
	storeState: store,
})

const mapDispatchToProps = dispatch => {
	const boundActions = bindActionCreators(
		{ overloadStore, initializePlayback, finishPlayback },
		dispatch,
	)
	return {
		dispatch,
		...boundActions,
	}
}

const ConnectedBugReporter = connect(mapStateToProps, mapDispatchToProps)(
	UnconnectedBugReporter,
)

export { UnconnectedBugReporter }
export default ConnectedBugReporter
