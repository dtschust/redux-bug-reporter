export const errorData = {
  errors: [],
  addError(error) {
    this.errors.push(error)
  },
  clearErrors() {
    this.errors = []
  },
  getErrors() {
    return this.errors
  },
}

function listenToConsoleError() {
  const origError = window.console.error
  if (!origError.bugReporterOverrideComplete) {
    window.console.error = function error(...args) {
      let metadata
      if (args && args[0] && args[0].stack) {
        metadata = {
          errorMsg: `${args[0].name}: ${args[0].message}`,
          stackTrace: args[0].stack,
        }
      } else {
        metadata = {
          errorMsg: args && args[0],
        }
      }
      errorData.addError(metadata)
      origError.apply(this, args)
    }
    window.console.error.bugReporterOverrideComplete = true
  }
}

function listenToOnError() {
  const origWindowError = window.onerror
  if (!origWindowError || !origWindowError.bugReporterOverrideComplete) {
    window.onerror = function onerror(
      errorMsg,
      url,
      lineNumber,
      columnNumber,
      errorObj,
    ) {
      const metadata = {
        errorMsg,
        stackTrace: errorObj && errorObj.stack,
      }
      errorData.addError(metadata)
      if (origWindowError) {
        // eslint-disable-next-line prefer-rest-params
        origWindowError.apply(window, arguments)
      }
    }
    window.onerror.bugReporterOverrideComplete = true
  }
}

export function listenToErrors() {
  listenToConsoleError()
  listenToOnError()
}
