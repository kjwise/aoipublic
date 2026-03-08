(function () {
  function patchGetContext(proto) {
    if (!proto || typeof proto.getContext !== "function") return;
    if (proto.getContext.__plotlyWillReadFrequentlyPatched) return;

    var originalGetContext = proto.getContext;
    var patchedGetContext = function (contextType, attributes) {
      if (contextType !== "2d") {
        return originalGetContext.apply(this, arguments);
      }

      var nextAttributes = {};
      if (attributes && typeof attributes === "object") {
        for (var key in attributes) {
          if (Object.prototype.hasOwnProperty.call(attributes, key)) {
            nextAttributes[key] = attributes[key];
          }
        }
      }
      nextAttributes.willReadFrequently = true;

      if (arguments.length <= 1) {
        return originalGetContext.call(this, contextType, nextAttributes);
      }

      var nextArgs = Array.prototype.slice.call(arguments);
      nextArgs[1] = nextAttributes;
      return originalGetContext.apply(this, nextArgs);
    };

    patchedGetContext.__plotlyWillReadFrequentlyPatched = true;
    proto.getContext = patchedGetContext;
  }

  patchGetContext(window.HTMLCanvasElement && window.HTMLCanvasElement.prototype);
  patchGetContext(window.OffscreenCanvas && window.OffscreenCanvas.prototype);
})();
