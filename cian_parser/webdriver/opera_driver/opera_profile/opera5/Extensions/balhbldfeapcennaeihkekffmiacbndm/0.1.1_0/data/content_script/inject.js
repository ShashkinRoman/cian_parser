var background = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path === 'background-to-page') {
          if (request.method === id) _tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {_tmp[id] = callback},
    "send": function (id, data) {chrome.runtime.sendMessage({"path": 'page-to-background', "method": id, "data": data})}
  }
})();

var remove = function () {
  var script = document.getElementById("mobile-view-switcher");
  if (script) script.parentNode.removeChild(script);
};

background.receive("storage", function (data) {
  if (data.useragent) {
    remove();
    /*  */
    var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("id", "mobile-view-switcher");
    script.textContent = 'navigator.__defineGetter__("userAgent", function () {return "' + data.useragent + '"})';
    document.documentElement.appendChild(script);
  }
});

remove();
background.send("load");
