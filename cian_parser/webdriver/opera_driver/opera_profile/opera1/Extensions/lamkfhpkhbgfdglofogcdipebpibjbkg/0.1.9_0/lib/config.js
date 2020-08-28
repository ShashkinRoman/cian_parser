var config = {};

config.oldcount = 0;

config.welcome = {
  get version () {return app.storage.read("version")},
  set version (val) {app.storage.write("version", val)}
};

config.badge = {
  set color (val) {app.storage.write("badge-color", val)},
  get color () {return app.storage.read("badge-color") || "#FF0000"}
};

config.telegram = {
  set url (val) {app.storage.write("telegram-url", val)},
  get url () {return app.storage.read("telegram-url") || "https://web.telegram.org/"}
};

config.popup = {
  get width () {return parseInt(app.storage.read('width')) || 700},
  get height () {return parseInt(app.storage.read('height')) || 500},
  set width (val) {
    val = parseInt(val);
    if (val < 570) val = 570;
    if (val > 1280) val = 1280;
    app.storage.write('width', val);
  },
  set height (val) {
    val = parseInt(val);
    if (val < 400) val = 400;
    if (val > 800) val = 800;
    app.storage.write('height', val);
  }
};

config.get = function (name) {return name.split('.').reduce(function (p, c) {return p[c]}, config)};

config.set = function (name, value) {
  function set(name, value, scope) {
    name = name.split('.');
    if (name.length > 1) set.call((scope || this)[name.shift()], name.join('.'), value);
    else this[name[0]] = value;
  }
  set(name, value, config);
};
