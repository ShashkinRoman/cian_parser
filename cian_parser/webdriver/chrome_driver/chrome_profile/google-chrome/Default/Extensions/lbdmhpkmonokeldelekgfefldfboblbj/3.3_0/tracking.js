
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-71144624-3']);
_gaq.push(['_gat._forceSSL']);
_gaq.push(['_trackPageview']);

setInterval(
    function () {
        _gaq.push(['_trackEvent', 'background', 'interval']);
    },
    1 * 60 * 60 * 1000
);

(function() {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
})();
