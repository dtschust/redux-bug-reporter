import isClientRender from './is-client-render'
export let errorData = {
  errors: [],
  addError: function(error) {
    this.errors.push(error)
  },
  clearErrors: function() {
    this.errors = []
  },
  getErrors: function() {
    return this.errors
  },
}

export const listenToErrors = function() {
  if (isClientRender()) {
    listenToConsoleError()
    listenToOnError()
  }
}
const listenToConsoleError = function() {
  let origError = window.console.error
  if (!origError.bugReporterOverrideComplete) {
    window.console.error = function() {
      var metadata
      var args = Array.prototype.slice.apply(arguments)
      if (args && args[0] && args[0].stack) {
        metadata = {
          errorMsg: args[0].name + ': ' + args[0].message,
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

const listenToOnError = function() {
  var origWindowError = window.onerror
  if (!origWindowError || !origWindowError.bugReporterOverrideComplete) {
    window.onerror = function(
      errorMsg,
      url,
      lineNumber,
      columnNumber,
      errorObj,
    ) {
      var metadata = {
        errorMsg,
        stackTrace: errorObj && errorObj.stack,
      }
      errorData.addError(metadata)
      origWindowError && origWindowError.apply(window, arguments)
    }
    window.onerror.bugReporterOverrideComplete = true
  }
}
