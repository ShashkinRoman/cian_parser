var port = chrome.runtime.connect({"name": "POPUP"});

var background = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path === 'background-to-popup') {
          if (request.method === id) _tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {_tmp[id] = callback},
    "send": function (id, data) {chrome.runtime.sendMessage({"path": 'popup-to-background', "method": id, "data": data})}
  }
})();

var load = function (o) {
  var iframe = document.getElementById("popup-iframe");
  if (iframe.src === "about:blank") {
    iframe.src = o.url;
    /*  */
    iframe.setAttribute("width", o.width);
    iframe.setAttribute("height", o.height);
    document.body.style.width = o.width + "px";
    document.documentElement.style.width = o.width + "px";
    if (navigator.userAgent.indexOf("Firefox") === -1) {
      document.body.style.height = o.height + "px";
      document.documentElement.style.height = o.height + "px";
    }
  }
};

background.receive("load", load);
window.addEventListener("load", function () {background.send("load")}, false);
