window.injectIntoThis = function () {
  var args = Array.prototype.slice.call(arguments);
  return inject(function ($injector) {
    for (var i = 0; i < args.length; i++) {
      var injectable = args[i];
      this[injectable] = $injector.get(injectable);
    }
  });
};
