var background = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path === 'background-to-options') {
          if (request.method === id) _tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {_tmp[id] = callback},
    "send": function (id, data) {chrome.runtime.sendMessage({"path": 'options-to-background', "method": id, "data": data})}
  }
})();

var connect = function (elem, pref) {
  var att = "value";
  if (elem) {
    if (elem.type === "checkbox") att = "checked";
    if (elem.localName === "span") att = "textContent";
    if (elem.localName === "select") att = "selectedIndex";
    var pref = elem.getAttribute("data-pref");
    background.send("get", pref);
    elem.addEventListener("change", function () {background.send("changed", {"pref": pref, "value": this[att]})});
  }
  /*  */
  return {
    get value () {return elem[att]},
    set value (val) {
      if (elem.type === "file") return;
      elem[att] = val;
    }
  }
};

var pickColor = function (type) {
  var handle = function () {
    background.send("changed", {"pref": type, "value": document.getElementById('hexBox').textContent});
    colorContainer.removeEventListener('click', handle);
  };
  /*  */
  var colorContainer = document.getElementById('colorContainer');
  colorContainer.addEventListener('click', handle);
};

var init = function () {
  var prefs = document.querySelectorAll("*[data-pref]");
  [].forEach.call(prefs, function (elem) {
    var pref = elem.getAttribute("data-pref");
    window[pref] = connect(elem, pref);
  });
  /*  */
  window.setTimeout(function () {
    var colorPicker = document.querySelector('span[class="colorChooser"]');
    colorPicker.addEventListener('click', function () {pickColor("badge.color")});
    colorPicker.style.backgroundColor = window["badge.color"].value;
  }, 300);
  /*  */
  window.removeEventListener("load", init, false);
};

window.addEventListener("load", init, false);
background.receive("set", function (o) {if (window[o.pref]) window[o.pref].value = o.value});