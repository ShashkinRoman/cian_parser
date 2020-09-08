
(function() {

    var version = chrome.runtime.getManifest().version;
    var browserName = "chrome";
    var actualVersion = version;
    var deadProxies = new DeadProxyStorage(1 * 60 * 60 * 1000); //1 h
    var isControllableSettings;
    var isEnabled = true;
    var validateDelay = 2 * 1000; //2 sec
    var checkNotificationsDelay = 1 * 60 * 10 * 1000; //10 min
    var checkHealthzDelay = 1 * 60 * 25 * 1000; //25 min
    var validateInterval;
    var checkNotificationsInterval;
    var checkHealthzInterval;

    var proxyHosts = [
        'rutracker.org',
        '*.rutracker.org',
        '*.rutracker.cc'
    ];

    // Default
    var server = {
        protocol: 'https',
        host: 'rtk1.pass.xzvpn.net',
        port: 443
    };

    function processPlugin(forceReload) {
        if (isEnabled) {
            chrome.proxy.settings.get({incognito: false}, function(details) {
                var isControllableSettingsRuntime = isControllableProxySettings(details);

                if (forceReload || isControllableSettingsRuntime !== isControllableSettings) {
                    isControllableSettings = isControllableSettingsRuntime;
                    validatePopupIfOpened();
                    processIcon();

                    if (isControllableSettings) {
                        processProxy();
                    }
                }
            });
        }
        else {
            processIcon();
            clearProxy();
        }
    }

    function processNotifications() {
        XHR({
            method: "GET",
            url: "http://nrtk.rmcontrol.net/api/v1/",
            timeout: 2000,
            onSuccess: function(response) {
                if (response && Array.isArray(response)) {
                    actualizeNotifications(response);
                }

                validatePopupIfOpened();
                processIcon();

                console.log('Notifications have been updated');
            },
            onFail: function() {
                console.log('Failed to load notifications');
            }
        });
    }

    function processHealthz() {
        XHR({
            method: "GET",
            url: "http://rutracker.org/healthz",
            timeout: 5000,
            onSuccess: function (response) {
                if (response && response.status === 'ok') {
                    console.log('Proxy ' + server.host + ' is alive');
                } else {
                    deadProxies.add(server.host);
                    processPlugin(true);

                    console.log('Proxy ' + server.host + ' seems to be dead');
                }
            },
            onFail: function () {
                deadProxies.add(server.host);
                processPlugin(true);

                console.log('Proxy ' + server.host + ' seems to be dead');
            },
            onComplete: function() {
                var dp = deadProxies.getAll();

                console.log('Dead proxies are: ' + (dp.length ? dp.join(',') : 'none'));
            }
        });
    }

    function processProxy() {
        // Download remote configuration
        XHR({
            url: "https://rtk.rmcontrol.net",
            timeout: 2000,
            data: {
                api_version: 2,
                browser_name: browserName,
                plugin_version: version,
                exclusions: deadProxies.getAll().join(',')
            },
            onSuccess: function(response) {
                if (!response.error && response.protocol && response.host && response.port) {
                    server = {
                        protocol: response.protocol,
                        host: response.host,
                        port: response.port
                    };
                    actualVersion = response.actual_plugin_version;

                    validatePopupIfOpened();
                    processIcon();
                }
            },
            onFail: function() {
                console.log('Failed to load remote configuration');
            },
            onComplete: function() {
                applyProxy(server, proxyHosts);
            }
        });
    }

    function processIcon() {
        if (!isEnabled) {
            setInactiveIcon();
        }
        else if (hasActualNotifications()) {
            setProblemIcon();
        }
        else if (!isControllableSettings) {
            setProblemIcon();
        }
        else if (isAvailableUpdate(version, actualVersion)) {
            setProblemIcon();
        }
        else {
            setDefaultIcon();
        }
    }

    function validatePopupIfOpened() {
        var popup = chrome.extension.getViews({type:"popup"})[0];

        if (popup) {
            popup.validateView(isEnabled);
            console.log('Popup has been validated');
        }
    }

    function enableTimers() {
        validateInterval = setInterval(processPlugin, validateDelay);
        checkNotificationsInterval = setInterval(processNotifications, checkNotificationsDelay);
        checkHealthzInterval = setInterval(processHealthz, checkHealthzDelay);
    }

    function disableTimers() {
        clearInterval(validateInterval);
        clearInterval(checkNotificationsInterval);
        clearInterval(checkHealthzInterval);
    }

    // Register popup messages listener
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        /* getters */
        if ('is_enabled_proxy' === request.get) {
            sendResponse({
                is_enabled_proxy: isEnabled
            });
        }

        if ('current_state' === request.get) {
            sendResponse({
                is_enabled_proxy: isEnabled,
                is_available_update: isAvailableUpdate(version, actualVersion),
                is_controllable_settings: isControllableSettings,
                notifications: Options.getOption('notifications').actual.map(function (notification) {
                    notification.published_at = formatDate(notification.published_at);

                    return notification;
                })
            });
        }

        /* setters */
        if ('is_enabled_proxy' === request.set) {
            // if changed
            if (request.value !== isEnabled) {
                isEnabled = request.value;
                Options.setOption('is_enabled_proxy', isEnabled);

                disableTimers();
                processPlugin(true);

                if (isEnabled) {
                    processNotifications();
                    enableTimers();
                }
            }
        }

        if ('mark_notification_as_shown' === request.action) {
            markNotificationAsShown(request.id);
            validatePopupIfOpened();
            processIcon();
        }
    });

    initOptionsIfNecessary();
    isEnabled = Options.getOption('is_enabled_proxy');
    processPlugin();

    if (isEnabled) {
        processNotifications();
        enableTimers();
    }

})();
