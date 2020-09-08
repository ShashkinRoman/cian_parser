! function() {
    (function() {
        const a = chrome.i18n.getUILanguage(),
            b = document.getElementsByClassName("en"),
            c = document.getElementsByClassName("ru"); - 1 != a.indexOf("ru") || -1 != a.indexOf("uk") ? [].forEach.call(b, a => {a.style.display = "none"}) : [].forEach.call(c, a => {a.style.display = "none"})
    })(),
    function() {
        for (var a = document.getElementsByTagName("html"), b = 0; b < a.length; b++) {
            var c = a[b],
                e = c.innerHTML.toString(),
                f = e.replace(/__MSG_(\w+)__/g, function(a, b) {
                    return b ? chrome.i18n.getMessage(b) : ""
                });
            f != e && (c.innerHTML = f)
        }
    }()
}();