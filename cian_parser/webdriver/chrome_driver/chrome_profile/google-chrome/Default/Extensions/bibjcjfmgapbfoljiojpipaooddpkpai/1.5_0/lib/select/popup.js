class Po {
    constructor() {
        this.init()
    }
    init() {
        try {
            document.addEventListener("contextmenu", a => a.preventDefault())
        } catch (a) {}
        this.storage(), this.localizeHtmlPage(), this.sortDropDownListByText("country_select"), this.share();
        try {
            $("select").wSelect()
        } catch (a) {}
        $("#country_select").change(() => {
            chrome.storage.local.set({
                choice: $("#country_select").val()
            }), chrome.runtime.sendMessage({
                choice: $("#country_select").val()
            })
        }), chrome.storage.local.get("choice", a => {
            a.choice && $("#country_select").val(a.choice).change()
        })
    }
    localizeHtmlPage() {
        for (var a = document.getElementsByTagName("html"), b = 0; b < a.length; b++) {
            var c = a[b],
                e = c.innerHTML.toString(),
                f = e.replace(/__MSG_(\w+)__/g, function(a, b) {
                    return b ? chrome.i18n.getMessage(b) : ""
                });
            f != e && (c.innerHTML = f)
        }
    }
    sortDropDownListByText(a) {
        var b = $("#" + a + " option:first"),
            c = $("#" + a + " option:not(:first)").sort(function(a, b) {
                return a.text == b.text.toLowerCase() ? 0 : a.text.toLowerCase() < b.text.toLowerCase() ? -1 : 1
            });
        $("#" + a).html(c).prepend(b)
    }
    storage() {
        chrome.storage.local.get(null, a => {
            a && Object.keys(a).forEach(b => {
                if ("enabled" == a[b].status) {
                    $("option[value=\"" + b + "\"]").removeAttr("disabled");
                    try {
                        $("#country_select").wSelect("reset")
                    } catch (a) {}
                }
                if ("disabled" == a[b].status) {
                    $("option[value=\"" + b + "\"]").attr("disabled", "disabled");
                    try {
                        $("#country_select").wSelect("reset")
                    } catch (a) {}
                }
            })
        })
    }
    share() {
        const a = chrome.i18n.getUILanguage(),
            b = "https://chrome.google.com/webstore/detail/" + chrome.app.getDetails().id,
            c = "menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600",
            d = "VPN.pro - Free Unlimited and Secure VPN Proxy.",
            f = "VPN.pro - \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0438 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u044B\u0439 VPN \u0431\u0435\u0437 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u0439.",
            g = "VPN.pro is a powerful Google Chrome extension, turning your browser into a powerful SSL VPN proxy and let you unblock websites, protect privac and hide IP address.",
            h = "VPN.pro - \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E\u0435 \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0435 \u0434\u043B\u044F Google Chrome, \u043A\u043E\u0442\u043E\u0440\u043E\u0435 \u043F\u043E\u0437\u0432\u043E\u043B\u044F\u0435\u0442 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C VPN \u0441\u0435\u0440\u0432\u0435\u0440\u0430 \u0434\u043B\u044F \u0440\u0430\u0437\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0438 \u0432\u0435\u0431-\u0441\u0430\u0439\u0442\u043E\u0432, \u0437\u0430\u0449\u0438\u0442\u044B \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0438 \u0438 \u0441\u043A\u0440\u044B\u0442\u0438\u044F \u0441\u0432\u043E\u0435\u0433\u043E \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u0433\u043E IP-\u0430\u0434\u0440\u0435\u0441\u0430.";
        $(".share").on("click", function(i) {
            switch (i.preventDefault(), this.id) {
                case "ok":
                    try {
                        _gaq.push(["_trackEvent", "click", "ok"])
                    } catch (a) {}; - 1 != a.indexOf("ru") || -1 != a.indexOf("uk") ? window.open("https://connect.ok.ru/offer?url=" + b + "&?utm_source=ok_share&title=" + f + "&description=" + h, "", c) : window.open("https://connect.ok.ru/offer?url=" + b + "&?utm_source=ok_share&title=" + d + "&description=" + g, "", c);
                    break;
                case "fb":
                    try {
                        _gaq.push(["_trackEvent", "click", "fb"])
                    } catch (a) {}; - 1 != a.indexOf("ru") || -1 != a.indexOf("uk") ? window.open("https://www.facebook.com/sharer.php?u=" + b + "&?utm_source=fb_share&title=" + f, "", c) : window.open("https://www.facebook.com/sharer.php?u=" + b + "&?utm_source=fb_share&title=" + d, "", c);
                    break;
                default:
                    try {
                        _gaq.push(["_trackEvent", "click", "vk"])
                    } catch (a) {}; - 1 != a.indexOf("ru") || -1 != a.indexOf("uk") ? window.open("https://vk.com/share.php?url=" + b + "&?utm_source=vk_share&title=" + f + "&description=" + h, "", c) : window.open("https://vk.com/share.php?url=" + b + "&?utm_source=vk_share&title=" + d + "&description=" + g, "", c);
            }
        })
    }
}
new Po;