'use strict'

// This is the browser adapter using XMLHttpRequest
module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data
    var requestHeaders = config.headers || {}

    var request = new XMLHttpRequest()

    request.open(config.method.toUpperCase(), config.url, true)

    // Set the request timeout in MS
    request.timeout = config.timeout || 0

    // Listen for ready state
    request.onreadystatechange = function handleLoad() {
      if (!request || request.readyState !== 4) {
        return
      }

      // The request errored out and we didn't get a response, this will be
      // handled by onerror instead
      if (
        request.status === 0 &&
        !(request.responseURL && request.responseURL.indexOf('file:') === 0)
      ) {
        return
      }

      // Prepare the response
      var responseData = request.responseText
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: {},
        config: config,
        request: request,
      }

      resolve(response)

      // Clean up request
      request = null
    }

    // Handle browser request cancellation
    request.onabort = function handleAbort() {
      if (!request) {
        return
      }
      reject(new Error('Request aborted'))
      request = null
    }

    // Handle low level network errors
    request.onerror = function handleError() {
      reject(new Error('Network Error'))
      request = null
    }

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      reject(new Error('timeout of ' + config.timeout + 'ms exceeded'))
      request = null
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      for (var key in requestHeaders) {
        if (Object.prototype.hasOwnProperty.call(requestHeaders, key)) {
          request.setRequestHeader(key, requestHeaders[key])
        }
      }
    }

    if (!requestData) {
      requestData = null
    }

    // Send the request
    request.send(requestData)
  })
}
