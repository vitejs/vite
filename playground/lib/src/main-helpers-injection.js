// Trigger wrong helpers injection if not properly constrained
;(function () {
  var getEvalledConstructor = function (expressionSyntax) {
    try {
      return $Function(
        '"use strict"; return (' + expressionSyntax + ').constructor;',
      )()
    } catch (e) {}
  }
  console.log(getEvalledConstructor(0))
})()
