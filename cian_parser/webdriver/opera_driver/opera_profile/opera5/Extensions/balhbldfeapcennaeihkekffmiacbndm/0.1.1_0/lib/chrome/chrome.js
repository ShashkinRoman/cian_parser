var app = {};

app.version = function () {return chrome.runtime.getManifest().version};
app.homepage = function () {return chrome.runtime.getManifest().homepage_url};
app.Hotkey = function (callback) {chrome.commands.onCommand.addListener(function (e) {if (e === "toggle-default-mode") callback("_mode")})};
if (chrome.runtime.setUninstallURL) chrome.runtime.setUninstallURL(app.homepage() + "?v=" + app.version() + "&type=uninstall", function () {});

app.tab = {
  "reload": function (tabId) {chrome.tabs.reload(tabId)},
  "update": function (tabId, url) {chrome.tabs.update(tabId, {"url": url})},
  "open": function (url) {chrome.tabs.create({"url": url, "active": true})},
  "active": function (callback) {
    chrome.tabs.query({"active": true}, function (tabs) {
      if (tabs && tabs[0]) callback(tabs[0]);
    });
  }
};

app.button = {
  "click": function (callback) {chrome.browserAction.onClicked.addListener(callback)},
  "badge": function (state) {
    chrome.browserAction.setIcon({
      "path": {
        "16": "../../data/icons" + (state ? "/" + state : '') + "/16.png",
        "32": "../../data/icons" + (state ? "/" + state : '') + "/32.png",
        "48": "../../data/icons" + (state ? "/" + state : '') + "/48.png",
        "64": "../../data/icons" + (state ? "/" + state : '') + "/64.png"
      }
    });
  }
};

app.onBeforeSendHeaders = function (callback) {
  var top = {};
  var onBeforeSendHeaders = function (info) {
    var url = info.url, id = info.tabId;
    if (info.type === 'main_frame') top[id] = url;
    return callback(top[id], info.requestHeaders);
  };
  /*  */
  chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, {"urls" : ["http://*/*", "https://*/*"]}, ["blocking", "requestHeaders"]);
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

app.content_script = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path === 'page-to-background') {
          if (request.method === id) {
            var _data = request.data || {};
            if (sender.tab) {
              _data["top"] = sender.tab.url;
              _data["tabId"] = sender.tab.id;
            }
            _tmp[id](_data);
          }
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
          if (!tabId || (tabId && tab.id === tabId)) {
            var _data = data || {};
            _data["top"] = tab.url;
            _data["tabId"] = tab.id;
            chrome.tabs.sendMessage(tab.id, {"path": 'background-to-page', "method": id, "data": _data}, function () {});
          }
        });
      });
    }
  }
})();
