window.setTimeout(function () {
  var version = config.welcome.version;
  if (!version) {
    app.tab.open(app.homepage() + "?v=" + app.version() + "&type=install");
    config.welcome.version = app.version();
  }
}, 3000);

var setbadge = function () {app.button.badgeColor = config.badge.color};

app.popup.receive("load", function () {
  app.popup.send("load", {
    "url": config.telegram.url,
    "width": config.popup.width,
    "height": config.popup.height
  });
});

app.content_script.receive("check-notifications", function (e) {
  var count = e.count;
  var parseIntCount = parseInt(count);
  if ((parseIntCount + '') !== (count + '')) return;
  /*  */
  count = parseIntCount;
  if (count !== config.oldcount) {
    config.oldcount = count;
    count = count <= 0 ? '' : (count > 99 ? "99+" : count);
    app.button.badge = count + '';
  }
});

app.options.receive("changed", function (o) {
  config.set(o.pref, o.value);
  app.options.send("set", {"pref": o.pref, "value": config.get(o.pref)});
  setbadge();
});

window.setTimeout(setbadge, 300);
app.options.receive("get", function (pref) {app.options.send("set", {"pref": pref, "value": config.get(pref)})});
