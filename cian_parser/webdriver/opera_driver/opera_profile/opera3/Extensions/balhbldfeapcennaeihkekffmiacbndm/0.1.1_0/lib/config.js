var config = {};

var UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 12_1_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1";

config.welcome = {
  get version () {return app.storage.read("version")},
  set version (val) {app.storage.write("version", val)}
};

config.addon = {
  set state (val) {app.storage.write("state", val)},
  get state () {return app.storage.read("state") || "OFF"}
};

config.useragent = {
  set string (val) {app.storage.write("useragent", val)},
  get string () {return app.storage.read("useragent") || UA}
};
