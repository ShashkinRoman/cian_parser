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

window.setInterval(function () {
  var unread = document.querySelectorAll("span[ng-bind*='.unreadCount']");
  if (unread && unread.length) {
    var count = 0;
    for (var i = 0; i < unread.length; i++) {
      var CLASS = unread[i].getAttribute("class");
      var MUTED = CLASS ? CLASS.indexOf("_muted") !== -1 : false;
      if (!MUTED) count = count + parseInt(unread[i].textContent);
    }
    /*  */
    background.send("check-notifications", {"count": count});
  } else background.send("check-notifications", {"count": 0});
}, 3000);
