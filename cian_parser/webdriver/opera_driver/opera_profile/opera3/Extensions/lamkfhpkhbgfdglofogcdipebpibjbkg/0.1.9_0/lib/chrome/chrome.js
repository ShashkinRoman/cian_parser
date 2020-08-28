var app = {};

app.manifest = chrome.runtime.getURL('');
app.version = function () {return chrome.runtime.getManifest().version};
app.homepage = function () {return chrome.runtime.getManifest().homepage_url};
if (chrome.runtime.setUninstallURL) chrome.runtime.setUninstallURL(app.homepage() + "?v=" + app.version() + "&type=uninstall", function () {});

app.tab = {
  "open": function (url) {chrome.tabs.create({"url": url, "active": true})},
  "openOptions": function () {chrome.runtime.openOptionsPage(function () {})}
};

app.storage = (function () {
  var objs = {};
  window.setTimeout(function () {
    chrome.storage.local.get(null, function (o) {
      objs = o;
      var script = document.createElement("script");
      script.src = "../common.js";
      document.body.appendChild(script);
    });
  }, 300);
  /*  */
  return {
    "read": function (id) {return objs[id]},
    "write": function (id, data) {
      var tmp = {};
      tmp[id] = data;
      objs[id] = data;
      chrome.storage.local.set(tmp, function () {});
    }
  }
})();

app.button = (function () {
  var callback;
  chrome.browserAction.onClicked.addListener(function () {if (callback) callback()});
  /*  */
  return {
    "onCommand": function (c) {callback = c},
    set label (val) {chrome.browserAction.setTitle({"title": val})},
    set badge (val) {chrome.browserAction.setBadgeText({"text": (val ? val : '') + ''})},
    set badgeColor (val) {chrome.browserAction.setBadgeBackgroundColor({"color": (val ? val : "#FF0000")})}
  }
})();

app.popup = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path === 'popup-to-background') {
          if (request.method === id) _tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {_tmp[id] = callback},
    "send": function (id, data, tabId) {
      chrome.runtime.sendMessage({"path": 'background-to-popup', "method": id, "data": data});
    }
  }
})();

app.options = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path === 'options-to-background') {
          if (request.method === id) _tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {_tmp[id] = callback},
    "send": function (id, data, tabId) {
      chrome.runtime.sendMessage({"path": 'background-to-options', "method": id, "data": data});
    }
  }
})();

chrome.webRequest.onHeadersReceived.addListener(function (info) {
  if (info.tabId > -1) return;
  var headers = info.responseHeaders;
  for (var i = 0; i < headers.length; i++) {
    var name = headers[i].name.toLowerCase();
    if (name === 'x-frame-options' || name === 'frame-options') {
      headers.splice(i, 1);
      return {"responseHeaders": headers};
    }
  }
}, {"urls": ["*://*.web.telegram.org/*", "*://*.vesta.web.telegram.org/*"]}, ["blocking", "responseHeaders"]);

chrome.runtime.onConnect.addListener(function (port) {
  var panel = "/data/content_script/panel.html";
  var iframe = document.getElementById("background-iframe");
  if (port.name === "POPUP") {
    if (port.sender.url.indexOf(panel) !== -1) {
      iframe.src = "about:blank";
    }
  }
  /*  */
  port.onDisconnect.addListener(function (e) {
    if (e && e.name === "POPUP") {
      if (e.sender.url.indexOf(panel) !== -1) {
        iframe.src = config.telegram.url;
      }
    }
  });
});

app.content_script = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path === 'page-to-background') {
          if (request.method === id) _tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {_tmp[id] = callback},
    "send": function (id, data, tabId) {
      chrome.tabs.query({}, function (tabs) {
        tabs.forEach(function (tab) {
          chrome.tabs.sendMessage(tab.id, {"path": 'background-to-page', "method": id, "data": data}, function () {});
        });
      });
    }
  }
})();
