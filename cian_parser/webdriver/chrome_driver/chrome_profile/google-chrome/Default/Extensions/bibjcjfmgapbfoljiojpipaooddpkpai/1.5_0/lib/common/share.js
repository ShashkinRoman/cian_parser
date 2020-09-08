! function() {
    function a(a) {
        return document.getElementById(a)
    }
    function b(a) {
        chrome.tabs.create({url: a})
    }
    function c() {
        for (var a = document.getElementsByTagName("html"), b = 0; b < a.length; b++) {
            var c = a[b],
                e = c.innerHTML.toString(),
                f = e.replace(/__MSG_(\w+)__/g, function(a, b) {
                    return b ? chrome.i18n.getMessage(b) : ""
                });
            f != e && (c.innerHTML = f)
        }
    }
    function d() {
        const b = a("show"),
            c = a("ask"),
            d = a("mail"),
            e = a("good"),
            f = a("bad");
        b.style.display = "none", e.onclick = a => {a.preventDefault(), c.style.display = "none", b.style.display = "block"}, 
		f.onclick = a => {a.preventDefault(), c.style.display = "none", d.style.display = "block"}
    }
    function e() {
        const c = a("ws");
        c.onclick = a => {
            a.preventDefault(), b(`https://chrome.google.com/webstore/detail/${chrome.runtime.id}?utm_source=chromewebstore_share`)
        }
    }(function() {
        c(), d(), e()
    })()
}();