(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var port = function port(portName) {
    var _this = this;

    var portType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'client';
    var clientConnectedPort = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    _classCallCheck(this, port);

    this.port = null;
    this.portName = null;
    this.portType = null;
    this.throttled = {};

    this.onMessage = function (request) {
        _loglevel2.default.trace('port[%s][%s].onMessage() request %o', _this.portName, _this.portType, request);
        if (_this.onMessageCb) {
            _this.onMessageCb(request);
        }
    };

    this.onMessageCb = function (request) {
        _loglevel2.default.trace('port[%s][%s].onMessageCb() request %o', _this.portName, _this.portType, request);
    };

    this.addOnMessageCb = function (cb) {
        _loglevel2.default.trace('port[%s][%s].addOnMessageCb() with cb %o', _this.portName, _this.portType, cb);
        _this.onMessageCb = cb;
    };

    this.onDisconnect = function () {
        _loglevel2.default.error('port[%s][%s].constructor() port disconnected from other side', _this.portName, _this.portType);
        _this.port = null;
    };

    this.send = function (data) {
        var useThrottling = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var throttlingKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        var throttleTime = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1000;

        _loglevel2.default.trace('port[%s][%s].send()' + (useThrottling ? ' throttled' : '') + ' data %o', _this.portName, _this.portType, data);
        if (!_this.port) {
            _loglevel2.default.debug('port[%s][%s].send() port not connected', _this.portName, _this.portType);
            return;
        }

        try {
            _loglevel2.default.trace('port[%s][%s].send() sending', _this.portName, _this.portType);
            if (!useThrottling || new Date().getTime() - throttleTime > (_this.throttled[throttlingKey] || 0)) {
                _this.port.postMessage(data);
                if (useThrottling) {
                    _this.throttled[throttlingKey] = new Date().getTime();
                }
                _loglevel2.default.debug('port[%s][%s].send() sent data %o', _this.portName, _this.portType, data);
            } else {
                _loglevel2.default.trace('port[%s][%s].send() send canceled due throttling %d ms', _this.portName, _this.portType, throttleTime);
            }
        } catch (e) {
            _this.port = null;
            _loglevel2.default.error("port[%s][%s].send() error while sending %o", _this.portName, _this.portType, e);
        }
    };

    _loglevel2.default.trace('port[%s][%s].constructor() with portType <%s> and client\'s connected port %o', this.portName, this.portType, portType, clientConnectedPort);
    try {
        if (portType == 'client') {
            _loglevel2.default.trace('port[%s][%s].constructor() port connecting', this.portName, this.portType);
            this.port = chrome.runtime.connect({ name: portName });
            _loglevel2.default.trace('port[%s][%s].constructor() port connected', this.portName, this.portType);
        } else if (portType == 'host') {
            this.port = clientConnectedPort;
        }
        this.port.onDisconnect.addListener(this.onDisconnect);
        this.port.onMessage.addListener(this.onMessage);
        this.portType = portType;
        this.portName = portName;
    } catch (e) {
        _loglevel2.default.trace('port[%s][%s].constructor() port connection error %o', this.portName, this.portType, e);
    }
};

exports.default = port;

},{"loglevel":5}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var utils = function () {
    function utils() {
        _classCallCheck(this, utils);
    }

    //проверка URL'а вкладки на предмет Я.Музыки или Я.Радио


    _createClass(utils, null, [{
        key: 'isUrlMatch',
        value: function isUrlMatch(url) {
            if (url.match(/^https?:\/\/(radio|music)\.yandex\.(ru|by|kz|ua)\/.*\.(gif|png|jpg|svg|js|css|ico)$/)) {
                return false;
            }

            var isRadio = url.match(/^https?:\/\/radio\.yandex\.(ru|by|kz|ua)\/.*$/) !== null,
                isMusic = url.match(/^https?:\/\/music\.yandex\.(ru|by|kz|ua)\/.*$/) !== null;

            return isRadio || isMusic ? { isRadio: isRadio, isMusic: isMusic } : false;
        }
    }, {
        key: 'injectScript',


        //inject'им наш код в content-script вкладки
        value: function injectScript(tabId, file) {
            chrome.tabs.executeScript(tabId, { file: file }, function () {
                if (chrome.runtime.lastError) {
                    if (chrome.runtime.lastError.message == 'The tab was closed') {
                        return false;
                    }

                    throw new Error('Inject of file <' + file + '> on tab <' + tabId + '> error: ' + chrome.runtime.lastError.message);
                }
            });
        }
    }, {
        key: 'injectCode',


        //inject кода в пространоство страницы из CS скрипта, который выполняется в песочнице
        value: function injectCode(func) {
            var script = document.createElement('script');

            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            script.textContent = 'try {(' + func + ')(' + args + '); } catch(e) {console.error("injected error", e);};';
            (document.head || document.documentElement).appendChild(script);
            script.parentNode.removeChild(script);
        }
    }, {
        key: 'guid',
        value: function guid() {
            var s4 = function s4() {
                return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
            };
            return '' + s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        }
    }]);

    return utils;
}();

utils.errorHandler = function (e) {
    _loglevel2.default.error('errorHandler() with error', e);
    ga('send', 'event', 'error', 'bg', 'v' + chrome.runtime.getManifest().version + "\n" + e.stack);
};

exports.default = utils;

},{"loglevel":5}],3:[function(require,module,exports){
'use strict';

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _yandex = require('./cs/yandex');

var _yandex2 = _interopRequireDefault(_yandex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_loglevel2.default.setLevel('INFO'); //"TRACE" > "DEBUG" > "INFO" > "WARN" > "ERROR" > "SILENT"
//for debug:
//window.logger = log;

new _yandex2.default().init();

},{"./cs/yandex":4,"loglevel":5}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _utils = require('../common/utils');

var _utils2 = _interopRequireDefault(_utils);

var _port = require('../common/port');

var _port2 = _interopRequireDefault(_port);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var VOLUME_STEP = 0.03;
var SEEK_STEP = 10;
var CUSTOM_EVENT_NAME = 'customInjectedEvt';

var yandex =

//INFO: все args отличные от number должны быть в виде return JSON.stringify(arg)
function yandex() {
    var _this = this;

    _classCallCheck(this, yandex);

    this.storage = {};
    this.commands = {
        next: { fnc: function fnc() {
                externalAPI.next();
            }, args: null },

        play: { fnc: function fnc(trackIndex) {
                typeof trackIndex == 'number' ? externalAPI.play(trackIndex) : externalAPI.togglePause();
            }, args: function args(request) {
                return request.trackIndex;
            } },

        prev: { fnc: function fnc() {
                externalAPI.prev();
            }, args: null },

        info: { fnc: function fnc() {
                document.dispatchEvent(new CustomEvent(window.CUSTOM_EVENT_NAME, { detail: { action: 'info', track: externalAPI.getCurrentTrack() } }));
            }, args: null },

        like: { fnc: function fnc() {
                externalAPI.toggleLike();
            }, args: null },

        dislike: { fnc: function fnc() {
                externalAPI.toggleDislike();
            }, args: null },

        volume: { fnc: function fnc(volume) {
                externalAPI.setVolume(volume);
            }, args: function args(request) {
                return request.value;
            } },

        volumeToggle: { fnc: function fnc() {
                externalAPI.toggleMute();
            }, args: null },

        volumeup: { fnc: function fnc(volumeStep) {
                externalAPI.setVolume(externalAPI.getVolume() + volumeStep);
            }, args: VOLUME_STEP },

        volumedown: { fnc: function fnc(volumeStep) {
                externalAPI.setVolume(externalAPI.getVolume() - volumeStep);
            }, args: VOLUME_STEP },

        seekFwd: { fnc: function fnc(positionStep) {
                externalAPI.setPosition(externalAPI.getProgress().position + positionStep);
            }, args: SEEK_STEP },

        seekBack: { fnc: function fnc(positionStep) {
                externalAPI.setPosition(externalAPI.getProgress().position - positionStep);
            }, args: SEEK_STEP },

        shuffle: { fnc: function fnc() {
                externalAPI.toggleShuffle();
            }, args: null },

        repeat: { fnc: function fnc() {
                externalAPI.toggleRepeat();
            }, args: null },

        position: { fnc: function fnc(position) {
                externalAPI.setPosition(position);
            }, args: function args(request) {
                return request.position;
            } },

        navigate: { fnc: function fnc(url) {
                externalAPI.navigate(url);
            }, args: function args(request) {
                return JSON.stringify(request.url);
            } },

        //playlist load track info
        populate: { fnc: function fnc(from, count) {
                externalAPI.populate(from, count);
            }, args: function args(request) {
                return [request.from, request.count];
            } },

        debug: { fnc: function fnc(level) {
                _loglevel2.default.setLevel(level);
            }, args: function args(request) {
                return request.level;
            }, doNotInject: true },

        //из bg получаем событие, сохраняем в песочнице cs, затем инжектим в песочницу сайта как window.chrome_ext
        storage: {
            fnc: function fnc(storage) {
                _this.storage = storage;
                _utils2.default.injectCode.apply(null, [function (storage) {
                    window.chrome_ext = { storage: storage };
                }].concat(JSON.stringify(storage)));
            }, args: function args(request) {
                return request.storage;
            }, doNotInject: true
        },

        fullstate: {
            fnc: function fnc() {
                document.dispatchEvent(new CustomEvent(window.CUSTOM_EVENT_NAME, {
                    detail: {
                        action: 'fullstate',
                        track: externalAPI.getCurrentTrackWrapper(),
                        progress: externalAPI.getProgress(),
                        source: externalAPI.getSourceInfoWrapper(),
                        controls: {
                            states: externalAPI.getControlsWrapper(),
                            volume: externalAPI.getVolume(),
                            shuffle: externalAPI.getShuffleWrapper(),
                            repeat: externalAPI.getRepeatWrapper()
                        },
                        playlist: {
                            prev: externalAPI.getPrevTrack(),
                            list: externalAPI.getTracksList(),
                            index: externalAPI.getTrackIndex(),
                            next: externalAPI.getNextTrack()
                        },
                        isPlaying: externalAPI.isPlaying(),
                        user: {
                            uid: Mu.blocks.di.repo.auth.user.uid,
                            did: Mu.blocks.di.repo.auth.user.device_id
                        }
                    }
                }));
            }, args: null
        }
    };
    this.extApiEvents = {
        //событие смены состояния play/pause
        'EVENT_STATE': function EVENT_STATE() {
            document.dispatchEvent(new CustomEvent(window.CUSTOM_EVENT_NAME, { detail: { action: 'state', isPlaying: externalAPI.isPlaying() } }));
        },

        //событие смены трека
        'EVENT_TRACK': function EVENT_TRACK() {
            document.dispatchEvent(new CustomEvent(window.CUSTOM_EVENT_NAME, { detail: { action: 'track', track: externalAPI.getCurrentTrackWrapper(), source: externalAPI.getSourceInfoWrapper(), progress: externalAPI.getProgress() } }));
        },

        //событие нажатия на кнопку повтор, шафл, лайк
        'EVENT_CONTROLS': function EVENT_CONTROLS() {
            document.dispatchEvent(new CustomEvent(window.CUSTOM_EVENT_NAME, { detail: { action: 'controls', controls: { states: externalAPI.getControlsWrapper(), volume: externalAPI.getVolume(), shuffle: externalAPI.getShuffleWrapper(), repeat: externalAPI.getRepeatWrapper() } } }));
            //при клике на (диз)лайк срабатывает данное событие, но само состояние (диз)лайка находится в externalAPI.getCurrentTrackWrapper(), поэтому для его обновления вызываем событие track
            document.dispatchEvent(new CustomEvent(window.CUSTOM_EVENT_NAME, { detail: { action: 'track', track: externalAPI.getCurrentTrackWrapper(), source: externalAPI.getSourceInfoWrapper(), progress: externalAPI.getProgress(), secondary: true } }));
        },

        //событие изменения плейлиста с целью поймать его обнуление
        'EVENT_TRACKS_LIST': function EVENT_TRACKS_LIST() {
            document.dispatchEvent(new CustomEvent(window.CUSTOM_EVENT_NAME, { detail: { action: 'trackslist', playlist: { list: externalAPI.getTracksList(), index: externalAPI.getTrackIndex(), prev: externalAPI.getPrevTrack(), next: externalAPI.getNextTrack() } } }));
        },

        //событие изменения громкости
        'EVENT_VOLUME': function EVENT_VOLUME() {
            document.dispatchEvent(new CustomEvent(window.CUSTOM_EVENT_NAME, { detail: { action: 'volume', volume: externalAPI.getVolume() } }));
        },

        //событие прогресса проигрывания
        'EVENT_PROGRESS': function EVENT_PROGRESS() {
            document.dispatchEvent(new CustomEvent(window.CUSTOM_EVENT_NAME, { detail: { action: 'progress', progress: externalAPI.getProgress() } }));
        },

        //событие начала и конца рекламы
        'EVENT_ADVERT': function EVENT_ADVERT(e) {
            document.dispatchEvent(new CustomEvent(window.CUSTOM_EVENT_NAME, { detail: { action: 'advert', info: e, state: e !== false } }));
        }
    };
    this.throttledEvents = { progress: { timer: 0, time: 100 } };
    this.port = null;

    this.onMessage = function (request) {
        _loglevel2.default.debug('yandex.onMessage() action <%s>', request.action);

        if (!_this.commands[request.action]) {
            _loglevel2.default.debug('yandex.onMessage() action not defined');
            return;
        }

        var args = typeof _this.commands[request.action].args == 'function' ? _this.commands[request.action].args.call(_this, request) : _this.commands[request.action].args;

        _loglevel2.default.trace('yandex.onMessage() injecting func %o with args %o', _this.commands[request.action].fnc, args);

        if (!_this.commands[request.action].doNotInject) {
            _utils2.default.injectCode.apply(null, [_this.commands[request.action].fnc].concat(args));
        } else {
            _this.commands[request.action].fnc.apply(null, [].concat(args));
        }
    };

    this.init = function () {
        _loglevel2.default.trace('yandex.init()');

        //добавляем обертки над АПИ
        //TODO: попросить поправить этот момент в АПИ
        _loglevel2.default.trace('yandex.init() injecting externalAPI wrappers');
        _utils2.default.injectCode(function () {
            externalAPI.getCurrentTrackWrapper = function () {
                var t = this.getCurrentTrack();
                if (t) {
                    if (t.version === undefined) {
                        t.version = null;
                    }
                    if (t.cover === undefined) {
                        t.cover = null;
                    }
                }
                return t;
            };
            externalAPI.getControlsWrapper = function () {
                var controls = this.getControls();
                for (var key in controls) {
                    switch (controls[key]) {
                        case externalAPI.CONTROL_ENABLED:
                            controls[key] = 'enabled';
                            break;
                        case externalAPI.CONTROL_DISABLED:
                            controls[key] = 'disabled';
                            break;
                        case externalAPI.CONTROL_DENIED:
                            controls[key] = 'denied';
                            break;
                        case undefined:
                            controls[key] = null;
                            break;
                    }
                }

                return controls;
            };
            externalAPI.getSourceInfoWrapper = function () {
                var t = this.getSourceInfo();
                if (t && t.cover === undefined) {
                    t.cover = null;
                }
                return t;
            };
            externalAPI.getRepeatWrapper = function () {
                switch (externalAPI.getRepeat()) {
                    case externalAPI.REPEAT_ALL:
                        return 2;
                        break;
                    case externalAPI.REPEAT_ONE:
                        return true;
                        break;
                    case externalAPI.REPEAT_NONE:
                    default:
                        return false;
                        break;
                }
            };
            externalAPI.getShuffleWrapper = function () {
                switch (externalAPI.getShuffle()) {
                    case externalAPI.SHUFFLE_ON:
                        return true;
                        break;
                    case externalAPI.SHUFFLE_OFF:
                    default:
                        return false;
                        break;
                }
            };
        });

        //добавляем наш обработчик событий, через который происходит обратная связь
        _loglevel2.default.trace('yandex.init() injecting CUSTOM_EVENT_NAME');
        _utils2.default.injectCode(function (val) {
            window.CUSTOM_EVENT_NAME = val;
        }, JSON.stringify(CUSTOM_EVENT_NAME));

        _loglevel2.default.trace('yandex.init() injecting document CUSTOM_EVENT_NAME event listener');
        document.addEventListener(CUSTOM_EVENT_NAME, function (e) {
            _loglevel2.default.trace('yandex.customEventListener()', e.detail);
            var useThrottling = !!_this.throttledEvents[e.detail.action],
                throttlingKey = e.detail.action,
                throttleTime = useThrottling ? _this.throttledEvents[e.detail.action].time : null;

            _loglevel2.default.trace('yandex.customEventListener() sending to port: useThrottling <%o>, throttlingKey <%s>, throttleTime <%d>', useThrottling, throttlingKey, throttleTime);
            _this.port.send(e.detail, useThrottling, throttlingKey, throttleTime);
        });

        //добавляем слушателей событий externalAPI
        _loglevel2.default.trace('yandex.init() injecting externalAPI events listeners');
        for (var event in _this.extApiEvents) {
            _utils2.default.injectCode(function (evt, fnc) {
                externalAPI.on(externalAPI[evt], fnc);
            }, JSON.stringify(event), _this.extApiEvents[event]);
        }

        //добавляем слушателя стандартных DOM событий
        _loglevel2.default.trace('yandex.init() injecting DOM events listeners');
        _utils2.default.injectCode(function () {
            window.addEventListener('unload', function () {
                document.dispatchEvent(new CustomEvent(window.CUSTOM_EVENT_NAME, { detail: { action: 'shutdown' } }));
            });
            window.addEventListener('beforeunload', function (e) {
                var settingsValue = window.chrome_ext ? window.chrome_ext.storage['store.settings.close_alert'] : true;
                var msg = 'Вы уверены, что хотите закрыть окно во время проигрывания Яндекс.Музыки?';
                if (settingsValue && externalAPI && externalAPI.isPlaying()) {
                    e.returnValue = msg;
                    return msg;
                }
            });
            window.addEventListener('focus', function () {
                document.dispatchEvent(new CustomEvent(window.CUSTOM_EVENT_NAME, { detail: { action: 'focus' } }));
            });
            window.addEventListener('blur', function () {
                document.dispatchEvent(new CustomEvent(window.CUSTOM_EVENT_NAME, { detail: { action: 'blur' } }));
            });
        });

        //формируем и отправляем расширению начальное состояние
        _loglevel2.default.trace('yandex.init() injecting initial player state sync');
        _utils2.default.injectCode(function () {
            document.dispatchEvent(new CustomEvent(window.CUSTOM_EVENT_NAME, {
                detail: {
                    action: 'fullstate',
                    track: externalAPI.getCurrentTrackWrapper(),
                    progress: externalAPI.getProgress(),
                    source: externalAPI.getSourceInfoWrapper(),
                    controls: {
                        states: externalAPI.getControlsWrapper(),
                        volume: externalAPI.getVolume(),
                        shuffle: externalAPI.getShuffleWrapper(),
                        repeat: externalAPI.getRepeatWrapper()
                    },
                    playlist: {
                        prev: externalAPI.getPrevTrack(),
                        list: externalAPI.getTracksList(),
                        index: externalAPI.getTrackIndex(),
                        next: externalAPI.getNextTrack()
                    },
                    isPlaying: externalAPI.isPlaying(),
                    user: {
                        uid: Mu.blocks.di.repo.auth.user.uid,
                        did: Mu.blocks.di.repo.auth.user.device_id
                    }
                }
            }));
        });
    };

    _loglevel2.default.trace('yandex.constructor()');
    //соединение с extension'ом
    this.port = new _port2.default('ymusic', 'client', null);
    //проброс обработчика полученных от extension'а сообщений
    this.port.addOnMessageCb(this.onMessage);

    return this;
};

exports.default = yandex;

},{"../common/port":1,"../common/utils":2,"loglevel":5}],5:[function(require,module,exports){
/*
* loglevel - https://github.com/pimterry/loglevel
*
* Copyright (c) 2013 Tim Perry
* Licensed under the MIT license.
*/
(function (root, definition) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define(definition);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = definition();
    } else {
        root.log = definition();
    }
}(this, function () {
    "use strict";

    // Slightly dubious tricks to cut down minimized file size
    var noop = function() {};
    var undefinedType = "undefined";

    var logMethods = [
        "trace",
        "debug",
        "info",
        "warn",
        "error"
    ];

    // Cross-browser bind equivalent that works at least back to IE6
    function bindMethod(obj, methodName) {
        var method = obj[methodName];
        if (typeof method.bind === 'function') {
            return method.bind(obj);
        } else {
            try {
                return Function.prototype.bind.call(method, obj);
            } catch (e) {
                // Missing bind shim or IE8 + Modernizr, fallback to wrapping
                return function() {
                    return Function.prototype.apply.apply(method, [obj, arguments]);
                };
            }
        }
    }

    // Build the best logging method possible for this env
    // Wherever possible we want to bind, not wrap, to preserve stack traces
    function realMethod(methodName) {
        if (methodName === 'debug') {
            methodName = 'log';
        }

        if (typeof console === undefinedType) {
            return false; // No method possible, for now - fixed later by enableLoggingWhenConsoleArrives
        } else if (console[methodName] !== undefined) {
            return bindMethod(console, methodName);
        } else if (console.log !== undefined) {
            return bindMethod(console, 'log');
        } else {
            return noop;
        }
    }

    // These private functions always need `this` to be set properly

    function replaceLoggingMethods(level, loggerName) {
        /*jshint validthis:true */
        for (var i = 0; i < logMethods.length; i++) {
            var methodName = logMethods[i];
            this[methodName] = (i < level) ?
                noop :
                this.methodFactory(methodName, level, loggerName);
        }

        // Define log.log as an alias for log.debug
        this.log = this.debug;
    }

    // In old IE versions, the console isn't present until you first open it.
    // We build realMethod() replacements here that regenerate logging methods
    function enableLoggingWhenConsoleArrives(methodName, level, loggerName) {
        return function () {
            if (typeof console !== undefinedType) {
                replaceLoggingMethods.call(this, level, loggerName);
                this[methodName].apply(this, arguments);
            }
        };
    }

    // By default, we use closely bound real methods wherever possible, and
    // otherwise we wait for a console to appear, and then try again.
    function defaultMethodFactory(methodName, level, loggerName) {
        /*jshint validthis:true */
        return realMethod(methodName) ||
               enableLoggingWhenConsoleArrives.apply(this, arguments);
    }

    function Logger(name, defaultLevel, factory) {
      var self = this;
      var currentLevel;
      var storageKey = "loglevel";
      if (name) {
        storageKey += ":" + name;
      }

      function persistLevelIfPossible(levelNum) {
          var levelName = (logMethods[levelNum] || 'silent').toUpperCase();

          if (typeof window === undefinedType) return;

          // Use localStorage if available
          try {
              window.localStorage[storageKey] = levelName;
              return;
          } catch (ignore) {}

          // Use session cookie as fallback
          try {
              window.document.cookie =
                encodeURIComponent(storageKey) + "=" + levelName + ";";
          } catch (ignore) {}
      }

      function getPersistedLevel() {
          var storedLevel;

          if (typeof window === undefinedType) return;

          try {
              storedLevel = window.localStorage[storageKey];
          } catch (ignore) {}

          // Fallback to cookies if local storage gives us nothing
          if (typeof storedLevel === undefinedType) {
              try {
                  var cookie = window.document.cookie;
                  var location = cookie.indexOf(
                      encodeURIComponent(storageKey) + "=");
                  if (location !== -1) {
                      storedLevel = /^([^;]+)/.exec(cookie.slice(location))[1];
                  }
              } catch (ignore) {}
          }

          // If the stored level is not valid, treat it as if nothing was stored.
          if (self.levels[storedLevel] === undefined) {
              storedLevel = undefined;
          }

          return storedLevel;
      }

      /*
       *
       * Public logger API - see https://github.com/pimterry/loglevel for details
       *
       */

      self.name = name;

      self.levels = { "TRACE": 0, "DEBUG": 1, "INFO": 2, "WARN": 3,
          "ERROR": 4, "SILENT": 5};

      self.methodFactory = factory || defaultMethodFactory;

      self.getLevel = function () {
          return currentLevel;
      };

      self.setLevel = function (level, persist) {
          if (typeof level === "string" && self.levels[level.toUpperCase()] !== undefined) {
              level = self.levels[level.toUpperCase()];
          }
          if (typeof level === "number" && level >= 0 && level <= self.levels.SILENT) {
              currentLevel = level;
              if (persist !== false) {  // defaults to true
                  persistLevelIfPossible(level);
              }
              replaceLoggingMethods.call(self, level, name);
              if (typeof console === undefinedType && level < self.levels.SILENT) {
                  return "No console available for logging";
              }
          } else {
              throw "log.setLevel() called with invalid level: " + level;
          }
      };

      self.setDefaultLevel = function (level) {
          if (!getPersistedLevel()) {
              self.setLevel(level, false);
          }
      };

      self.enableAll = function(persist) {
          self.setLevel(self.levels.TRACE, persist);
      };

      self.disableAll = function(persist) {
          self.setLevel(self.levels.SILENT, persist);
      };

      // Initialize with the right level
      var initialLevel = getPersistedLevel();
      if (initialLevel == null) {
          initialLevel = defaultLevel == null ? "WARN" : defaultLevel;
      }
      self.setLevel(initialLevel, false);
    }

    /*
     *
     * Top-level API
     *
     */

    var defaultLogger = new Logger();

    var _loggersByName = {};
    defaultLogger.getLogger = function getLogger(name) {
        if (typeof name !== "string" || name === "") {
          throw new TypeError("You must supply a name when creating a logger.");
        }

        var logger = _loggersByName[name];
        if (!logger) {
          logger = _loggersByName[name] = new Logger(
            name, defaultLogger.getLevel(), defaultLogger.methodFactory);
        }
        return logger;
    };

    // Grab the current global log variable in case of overwrite
    var _log = (typeof window !== undefinedType) ? window.log : undefined;
    defaultLogger.noConflict = function() {
        if (typeof window !== undefinedType &&
               window.log === defaultLogger) {
            window.log = _log;
        }

        return defaultLogger;
    };

    defaultLogger.getLoggers = function getLoggers() {
        return _loggersByName;
    };

    return defaultLogger;
}));

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleHRlbnNpb25fc3JjL2NvbW1vbi9wb3J0LmpzIiwiZXh0ZW5zaW9uX3NyYy9jb21tb24vdXRpbHMuanMiLCJleHRlbnNpb25fc3JjL2NzLmpzIiwiZXh0ZW5zaW9uX3NyYy9jcy95YW5kZXguanMiLCJub2RlX21vZHVsZXMvbG9nbGV2ZWwvbGliL2xvZ2xldmVsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUE7Ozs7Ozs7O0lBRU0sSSxHQU9GLGNBQVksUUFBWixFQUF1RTtBQUFBOztBQUFBLFFBQWpELFFBQWlELHVFQUF0QyxRQUFzQztBQUFBLFFBQTVCLG1CQUE0Qix1RUFBTixJQUFNOztBQUFBOztBQUFBLFNBTHZFLElBS3VFLEdBTGhFLElBS2dFO0FBQUEsU0FKdkUsUUFJdUUsR0FKNUQsSUFJNEQ7QUFBQSxTQUh2RSxRQUd1RSxHQUg1RCxJQUc0RDtBQUFBLFNBRnZFLFNBRXVFLEdBRjNELEVBRTJEOztBQUFBLFNBbUJ2RSxTQW5CdUUsR0FtQjNELG1CQUFXO0FBQ25CLDJCQUFJLEtBQUosQ0FBVSxxQ0FBVixFQUFpRCxNQUFLLFFBQXRELEVBQWdFLE1BQUssUUFBckUsRUFBK0UsT0FBL0U7QUFDQSxZQUFJLE1BQUssV0FBVCxFQUFzQjtBQUNsQixrQkFBSyxXQUFMLENBQWlCLE9BQWpCO0FBQ0g7QUFDSixLQXhCc0U7O0FBQUEsU0EwQnZFLFdBMUJ1RSxHQTBCekQsbUJBQVc7QUFDckIsMkJBQUksS0FBSixDQUFVLHVDQUFWLEVBQW1ELE1BQUssUUFBeEQsRUFBa0UsTUFBSyxRQUF2RSxFQUFpRixPQUFqRjtBQUNILEtBNUJzRTs7QUFBQSxTQThCdkUsY0E5QnVFLEdBOEJ0RCxjQUFNO0FBQ25CLDJCQUFJLEtBQUosQ0FBVSwwQ0FBVixFQUFzRCxNQUFLLFFBQTNELEVBQXFFLE1BQUssUUFBMUUsRUFBb0YsRUFBcEY7QUFDQSxjQUFLLFdBQUws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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQgbG9nIGZyb20gJ2xvZ2xldmVsJztcclxuXHJcbmNsYXNzIHBvcnQge1xyXG5cclxuICAgIHBvcnQgPSBudWxsO1xyXG4gICAgcG9ydE5hbWUgPSBudWxsO1xyXG4gICAgcG9ydFR5cGUgPSBudWxsO1xyXG4gICAgdGhyb3R0bGVkID0ge307XHJcblxyXG4gICAgY29uc3RydWN0b3IocG9ydE5hbWUsIHBvcnRUeXBlID0gJ2NsaWVudCcsIGNsaWVudENvbm5lY3RlZFBvcnQgPSBudWxsKSB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCdwb3J0WyVzXVslc10uY29uc3RydWN0b3IoKSB3aXRoIHBvcnRUeXBlIDwlcz4gYW5kIGNsaWVudFxcJ3MgY29ubmVjdGVkIHBvcnQgJW8nLCB0aGlzLnBvcnROYW1lLCB0aGlzLnBvcnRUeXBlLCBwb3J0VHlwZSwgY2xpZW50Q29ubmVjdGVkUG9ydCk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHBvcnRUeXBlID09ICdjbGllbnQnKSB7XHJcbiAgICAgICAgICAgICAgICBsb2cudHJhY2UoJ3BvcnRbJXNdWyVzXS5jb25zdHJ1Y3RvcigpIHBvcnQgY29ubmVjdGluZycsIHRoaXMucG9ydE5hbWUsIHRoaXMucG9ydFR5cGUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3J0ID0gY2hyb21lLnJ1bnRpbWUuY29ubmVjdCh7bmFtZTogcG9ydE5hbWV9KTtcclxuICAgICAgICAgICAgICAgIGxvZy50cmFjZSgncG9ydFslc11bJXNdLmNvbnN0cnVjdG9yKCkgcG9ydCBjb25uZWN0ZWQnLCB0aGlzLnBvcnROYW1lLCB0aGlzLnBvcnRUeXBlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChwb3J0VHlwZSA9PSAnaG9zdCcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9ydCA9IGNsaWVudENvbm5lY3RlZFBvcnQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5wb3J0Lm9uRGlzY29ubmVjdC5hZGRMaXN0ZW5lcih0aGlzLm9uRGlzY29ubmVjdCk7XHJcbiAgICAgICAgICAgIHRoaXMucG9ydC5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIodGhpcy5vbk1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcnRUeXBlID0gcG9ydFR5cGU7XHJcbiAgICAgICAgICAgIHRoaXMucG9ydE5hbWUgPSBwb3J0TmFtZTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGxvZy50cmFjZSgncG9ydFslc11bJXNdLmNvbnN0cnVjdG9yKCkgcG9ydCBjb25uZWN0aW9uIGVycm9yICVvJywgdGhpcy5wb3J0TmFtZSwgdGhpcy5wb3J0VHlwZSwgZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG9uTWVzc2FnZSA9IHJlcXVlc3QgPT4ge1xyXG4gICAgICAgIGxvZy50cmFjZSgncG9ydFslc11bJXNdLm9uTWVzc2FnZSgpIHJlcXVlc3QgJW8nLCB0aGlzLnBvcnROYW1lLCB0aGlzLnBvcnRUeXBlLCByZXF1ZXN0KTtcclxuICAgICAgICBpZiAodGhpcy5vbk1lc3NhZ2VDYikge1xyXG4gICAgICAgICAgICB0aGlzLm9uTWVzc2FnZUNiKHJlcXVlc3QpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgb25NZXNzYWdlQ2IgPSByZXF1ZXN0ID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ3BvcnRbJXNdWyVzXS5vbk1lc3NhZ2VDYigpIHJlcXVlc3QgJW8nLCB0aGlzLnBvcnROYW1lLCB0aGlzLnBvcnRUeXBlLCByZXF1ZXN0KTtcclxuICAgIH07XHJcblxyXG4gICAgYWRkT25NZXNzYWdlQ2IgPSBjYiA9PiB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCdwb3J0WyVzXVslc10uYWRkT25NZXNzYWdlQ2IoKSB3aXRoIGNiICVvJywgdGhpcy5wb3J0TmFtZSwgdGhpcy5wb3J0VHlwZSwgY2IpO1xyXG4gICAgICAgIHRoaXMub25NZXNzYWdlQ2IgPSBjYjtcclxuICAgIH07XHJcblxyXG4gICAgb25EaXNjb25uZWN0ID0gKCkgPT4ge1xyXG4gICAgICAgIGxvZy5lcnJvcigncG9ydFslc11bJXNdLmNvbnN0cnVjdG9yKCkgcG9ydCBkaXNjb25uZWN0ZWQgZnJvbSBvdGhlciBzaWRlJywgdGhpcy5wb3J0TmFtZSwgdGhpcy5wb3J0VHlwZSk7XHJcbiAgICAgICAgdGhpcy5wb3J0ID0gbnVsbDtcclxuICAgIH07XHJcblxyXG4gICAgc2VuZCA9IChkYXRhLCB1c2VUaHJvdHRsaW5nID0gZmFsc2UsIHRocm90dGxpbmdLZXkgPSBudWxsLCB0aHJvdHRsZVRpbWUgPSAxMDAwKSA9PiB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCdwb3J0WyVzXVslc10uc2VuZCgpJyArICh1c2VUaHJvdHRsaW5nID8gJyB0aHJvdHRsZWQnIDogJycpICsgJyBkYXRhICVvJywgdGhpcy5wb3J0TmFtZSwgdGhpcy5wb3J0VHlwZSwgZGF0YSk7XHJcbiAgICAgICAgaWYgKCF0aGlzLnBvcnQpIHtcclxuICAgICAgICAgICAgbG9nLmRlYnVnKCdwb3J0WyVzXVslc10uc2VuZCgpIHBvcnQgbm90IGNvbm5lY3RlZCcsIHRoaXMucG9ydE5hbWUsIHRoaXMucG9ydFR5cGUpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsb2cudHJhY2UoJ3BvcnRbJXNdWyVzXS5zZW5kKCkgc2VuZGluZycsIHRoaXMucG9ydE5hbWUsIHRoaXMucG9ydFR5cGUpO1xyXG4gICAgICAgICAgICBpZiAoIXVzZVRocm90dGxpbmcgfHwgbmV3IERhdGUoKS5nZXRUaW1lKCkgLSB0aHJvdHRsZVRpbWUgPiAodGhpcy50aHJvdHRsZWRbdGhyb3R0bGluZ0tleV0gfHwgMCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9ydC5wb3N0TWVzc2FnZShkYXRhKTtcclxuICAgICAgICAgICAgICAgIGlmICh1c2VUaHJvdHRsaW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50aHJvdHRsZWRbdGhyb3R0bGluZ0tleV0gPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxvZy5kZWJ1ZygncG9ydFslc11bJXNdLnNlbmQoKSBzZW50IGRhdGEgJW8nLCB0aGlzLnBvcnROYW1lLCB0aGlzLnBvcnRUeXBlLCBkYXRhKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxvZy50cmFjZSgncG9ydFslc11bJXNdLnNlbmQoKSBzZW5kIGNhbmNlbGVkIGR1ZSB0aHJvdHRsaW5nICVkIG1zJywgdGhpcy5wb3J0TmFtZSwgdGhpcy5wb3J0VHlwZSwgdGhyb3R0bGVUaW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgdGhpcy5wb3J0ID0gbnVsbDtcclxuICAgICAgICAgICAgbG9nLmVycm9yKFwicG9ydFslc11bJXNdLnNlbmQoKSBlcnJvciB3aGlsZSBzZW5kaW5nICVvXCIsIHRoaXMucG9ydE5hbWUsIHRoaXMucG9ydFR5cGUsIGUpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHBvcnQ7XHJcbiIsImltcG9ydCBsb2cgZnJvbSAnbG9nbGV2ZWwnO1xyXG5cclxuY2xhc3MgdXRpbHMge1xyXG4gICAgY29uc3RydWN0b3IoKSB7fVxyXG5cclxuICAgIC8v0L/RgNC+0LLQtdGA0LrQsCBVUkwn0LAg0LLQutC70LDQtNC60Lgg0L3QsCDQv9GA0LXQtNC80LXRgiDQry7QnNGD0LfRi9C60Lgg0LjQu9C4INCvLtCg0LDQtNC40L5cclxuICAgIHN0YXRpYyBpc1VybE1hdGNoKHVybCkge1xyXG4gICAgICAgIGlmICh1cmwubWF0Y2goL15odHRwcz86XFwvXFwvKHJhZGlvfG11c2ljKVxcLnlhbmRleFxcLihydXxieXxrenx1YSlcXC8uKlxcLihnaWZ8cG5nfGpwZ3xzdmd8anN8Y3NzfGljbykkLykpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGlzUmFkaW8gPSAodXJsLm1hdGNoKC9eaHR0cHM/OlxcL1xcL3JhZGlvXFwueWFuZGV4XFwuKHJ1fGJ5fGt6fHVhKVxcLy4qJC8pICE9PSBudWxsKSxcclxuICAgICAgICAgICAgaXNNdXNpYyA9ICh1cmwubWF0Y2goL15odHRwcz86XFwvXFwvbXVzaWNcXC55YW5kZXhcXC4ocnV8Ynl8a3p8dWEpXFwvLiokLykgIT09IG51bGwpO1xyXG5cclxuICAgICAgICByZXR1cm4gaXNSYWRpbyB8fCBpc011c2ljID8ge2lzUmFkaW86IGlzUmFkaW8sIGlzTXVzaWM6IGlzTXVzaWN9IDogZmFsc2U7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vaW5qZWN0J9C40Lwg0L3QsNGIINC60L7QtCDQsiBjb250ZW50LXNjcmlwdCDQstC60LvQsNC00LrQuFxyXG4gICAgc3RhdGljIGluamVjdFNjcmlwdCh0YWJJZCwgZmlsZSkge1xyXG4gICAgICAgIGNocm9tZS50YWJzLmV4ZWN1dGVTY3JpcHQodGFiSWQsIHtmaWxlOiBmaWxlfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UgPT0gJ1RoZSB0YWIgd2FzIGNsb3NlZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmplY3Qgb2YgZmlsZSA8JyArIGZpbGUgKyAnPiBvbiB0YWIgPCcgKyB0YWJJZCArICc+IGVycm9yOiAnICsgY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vaW5qZWN0INC60L7QtNCwINCyINC/0YDQvtGB0YLRgNCw0L3QvtGB0YLQstC+INGB0YLRgNCw0L3QuNGG0Ysg0LjQtyBDUyDRgdC60YDQuNC/0YLQsCwg0LrQvtGC0L7RgNGL0Lkg0LLRi9C/0L7Qu9C90Y/QtdGC0YHRjyDQsiDQv9C10YHQvtGH0L3QuNGG0LVcclxuICAgIHN0YXRpYyBpbmplY3RDb2RlKGZ1bmMsIC4uLmFyZ3MpIHtcclxuICAgICAgICBsZXQgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XHJcbiAgICAgICAgc2NyaXB0LnRleHRDb250ZW50ID0gJ3RyeSB7KCcgKyBmdW5jICsgJykoJyArIGFyZ3MgKyAnKTsgfSBjYXRjaChlKSB7Y29uc29sZS5lcnJvcihcImluamVjdGVkIGVycm9yXCIsIGUpO307JztcclxuICAgICAgICAoZG9jdW1lbnQuaGVhZCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpLmFwcGVuZENoaWxkKHNjcmlwdCk7XHJcbiAgICAgICAgc2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZ3VpZCgpIHtcclxuICAgICAgICBsZXQgczQgPSBmdW5jdGlvbigpIHsgcmV0dXJuIE1hdGguZmxvb3IoKDEgKyBNYXRoLnJhbmRvbSgpKSAqIDB4MTAwMDApLnRvU3RyaW5nKDE2KS5zdWJzdHJpbmcoMSk7IH07XHJcbiAgICAgICAgcmV0dXJuIGAke3M0KCl9JHtzNCgpfS0ke3M0KCl9LSR7czQoKX0tJHtzNCgpfS0ke3M0KCl9JHtzNCgpfSR7czQoKX1gO1xyXG4gICAgfTtcclxuXHJcbiAgICBzdGF0aWMgZXJyb3JIYW5kbGVyID0gZSA9PiB7XHJcbiAgICAgICAgbG9nLmVycm9yKCdlcnJvckhhbmRsZXIoKSB3aXRoIGVycm9yJywgZSk7XHJcbiAgICAgICAgZ2EoJ3NlbmQnLCAnZXZlbnQnLCAnZXJyb3InLCAnYmcnLCAndicgKyBjaHJvbWUucnVudGltZS5nZXRNYW5pZmVzdCgpLnZlcnNpb24gKyBcIlxcblwiICsgZS5zdGFjayk7XHJcbiAgICB9O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB1dGlscztcclxuIiwiaW1wb3J0IGxvZyBmcm9tICdsb2dsZXZlbCc7XHJcbmltcG9ydCB5YW5kZXhDbGFzcyBmcm9tICcuL2NzL3lhbmRleCc7XHJcblxyXG5sb2cuc2V0TGV2ZWwoJ0lORk8nKTsgLy9cIlRSQUNFXCIgPiBcIkRFQlVHXCIgPiBcIklORk9cIiA+IFwiV0FSTlwiID4gXCJFUlJPUlwiID4gXCJTSUxFTlRcIlxyXG4vL2ZvciBkZWJ1ZzpcclxuLy93aW5kb3cubG9nZ2VyID0gbG9nO1xyXG5cclxubmV3IHlhbmRleENsYXNzKCkuaW5pdCgpO1xyXG4iLCJpbXBvcnQgbG9nIGZyb20gJ2xvZ2xldmVsJztcclxuaW1wb3J0IHV0aWxzIGZyb20gJy4uL2NvbW1vbi91dGlscyc7XHJcbmltcG9ydCBwb3J0Q2xhc3MgZnJvbSAnLi4vY29tbW9uL3BvcnQnO1xyXG5cclxuY29uc3QgVk9MVU1FX1NURVAgPSAwLjAzO1xyXG5jb25zdCBTRUVLX1NURVAgPSAxMDtcclxuY29uc3QgQ1VTVE9NX0VWRU5UX05BTUUgPSAnY3VzdG9tSW5qZWN0ZWRFdnQnO1xyXG5cclxuY2xhc3MgeWFuZGV4IHtcclxuICAgIHN0b3JhZ2UgPSB7fTtcclxuXHJcbiAgICAvL0lORk86INCy0YHQtSBhcmdzINC+0YLQu9C40YfQvdGL0LUg0L7RgiBudW1iZXIg0LTQvtC70LbQvdGLINCx0YvRgtGMINCyINCy0LjQtNC1IHJldHVybiBKU09OLnN0cmluZ2lmeShhcmcpXHJcbiAgICBjb21tYW5kcyA9IHtcclxuICAgICAgICBuZXh0OiB7Zm5jOiAoKSA9PiB7IGV4dGVybmFsQVBJLm5leHQoKTsgfSwgYXJnczogbnVsbH0sXHJcblxyXG4gICAgICAgIHBsYXk6IHtmbmM6IHRyYWNrSW5kZXggPT4geyAodHlwZW9mIHRyYWNrSW5kZXggPT0gJ251bWJlcicpID8gZXh0ZXJuYWxBUEkucGxheSh0cmFja0luZGV4KSA6IGV4dGVybmFsQVBJLnRvZ2dsZVBhdXNlKCk7IH0sIGFyZ3M6IChyZXF1ZXN0KSA9PiByZXF1ZXN0LnRyYWNrSW5kZXh9LFxyXG5cclxuICAgICAgICBwcmV2OiB7Zm5jOiAoKSA9PiB7IGV4dGVybmFsQVBJLnByZXYoKTsgfSwgYXJnczogbnVsbH0sXHJcblxyXG4gICAgICAgIGluZm86IHtmbmM6ICgpID0+IHsgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQod2luZG93LkNVU1RPTV9FVkVOVF9OQU1FLCB7ZGV0YWlsOiB7YWN0aW9uOiAnaW5mbycsIHRyYWNrOiBleHRlcm5hbEFQSS5nZXRDdXJyZW50VHJhY2soKX19KSk7fSwgYXJnczogbnVsbH0sXHJcblxyXG4gICAgICAgIGxpa2U6IHtmbmM6ICgpID0+IHsgZXh0ZXJuYWxBUEkudG9nZ2xlTGlrZSgpOyB9LCBhcmdzOiBudWxsfSxcclxuXHJcbiAgICAgICAgZGlzbGlrZToge2ZuYzogKCkgPT4geyBleHRlcm5hbEFQSS50b2dnbGVEaXNsaWtlKCk7IH0sIGFyZ3M6IG51bGx9LFxyXG5cclxuICAgICAgICB2b2x1bWU6IHtmbmM6IHZvbHVtZSA9PiB7IGV4dGVybmFsQVBJLnNldFZvbHVtZSh2b2x1bWUpOyB9LCBhcmdzOiAocmVxdWVzdCkgPT4gcmVxdWVzdC52YWx1ZX0sXHJcblxyXG4gICAgICAgIHZvbHVtZVRvZ2dsZToge2ZuYzogKCkgPT4geyBleHRlcm5hbEFQSS50b2dnbGVNdXRlKCk7IH0sIGFyZ3M6IG51bGx9LFxyXG5cclxuICAgICAgICB2b2x1bWV1cDoge2ZuYzogdm9sdW1lU3RlcCA9PiB7IGV4dGVybmFsQVBJLnNldFZvbHVtZShleHRlcm5hbEFQSS5nZXRWb2x1bWUoKSArIHZvbHVtZVN0ZXApOyB9LCBhcmdzOiBWT0xVTUVfU1RFUH0sXHJcblxyXG4gICAgICAgIHZvbHVtZWRvd246IHtmbmM6IHZvbHVtZVN0ZXAgPT4geyBleHRlcm5hbEFQSS5zZXRWb2x1bWUoZXh0ZXJuYWxBUEkuZ2V0Vm9sdW1lKCkgLSB2b2x1bWVTdGVwKTsgfSwgYXJnczogVk9MVU1FX1NURVB9LFxyXG5cclxuICAgICAgICBzZWVrRndkOiB7Zm5jOiBwb3NpdGlvblN0ZXAgPT4geyBleHRlcm5hbEFQSS5zZXRQb3NpdGlvbihleHRlcm5hbEFQSS5nZXRQcm9ncmVzcygpLnBvc2l0aW9uICsgcG9zaXRpb25TdGVwKTsgfSwgYXJnczogU0VFS19TVEVQfSxcclxuXHJcbiAgICAgICAgc2Vla0JhY2s6IHtmbmM6IHBvc2l0aW9uU3RlcCA9PiB7IGV4dGVybmFsQVBJLnNldFBvc2l0aW9uKGV4dGVybmFsQVBJLmdldFByb2dyZXNzKCkucG9zaXRpb24gLSBwb3NpdGlvblN0ZXApOyB9LCBhcmdzOiBTRUVLX1NURVB9LFxyXG5cclxuICAgICAgICBzaHVmZmxlOiB7Zm5jOiAoKSA9PiB7IGV4dGVybmFsQVBJLnRvZ2dsZVNodWZmbGUoKTsgfSwgYXJnczogbnVsbH0sXHJcblxyXG4gICAgICAgIHJlcGVhdDoge2ZuYzogKCkgPT4geyBleHRlcm5hbEFQSS50b2dnbGVSZXBlYXQoKTsgfSwgYXJnczogbnVsbH0sXHJcblxyXG4gICAgICAgIHBvc2l0aW9uOiB7Zm5jOiBwb3NpdGlvbiA9PiB7IGV4dGVybmFsQVBJLnNldFBvc2l0aW9uKHBvc2l0aW9uKTsgfSwgYXJnczogKHJlcXVlc3QpID0+IHJlcXVlc3QucG9zaXRpb259LFxyXG5cclxuICAgICAgICBuYXZpZ2F0ZToge2ZuYzogdXJsID0+IHsgZXh0ZXJuYWxBUEkubmF2aWdhdGUodXJsKTsgfSwgYXJnczogKHJlcXVlc3QpID0+IEpTT04uc3RyaW5naWZ5KHJlcXVlc3QudXJsKX0sXHJcblxyXG4gICAgICAgIC8vcGxheWxpc3QgbG9hZCB0cmFjayBpbmZvXHJcbiAgICAgICAgcG9wdWxhdGU6IHtmbmM6IChmcm9tLCBjb3VudCkgPT4geyBleHRlcm5hbEFQSS5wb3B1bGF0ZShmcm9tLCBjb3VudCk7IH0sIGFyZ3M6IChyZXF1ZXN0KSA9PiBbcmVxdWVzdC5mcm9tLCByZXF1ZXN0LmNvdW50XX0sXHJcblxyXG4gICAgICAgIGRlYnVnOiB7Zm5jOiBsZXZlbCA9PiB7IGxvZy5zZXRMZXZlbChsZXZlbCk7IH0sIGFyZ3M6IChyZXF1ZXN0KSA9PiByZXF1ZXN0LmxldmVsLCBkb05vdEluamVjdDogdHJ1ZX0sXHJcblxyXG4gICAgICAgIC8v0LjQtyBiZyDQv9C+0LvRg9GH0LDQtdC8INGB0L7QsdGL0YLQuNC1LCDRgdC+0YXRgNCw0L3Rj9C10Lwg0LIg0L/QtdGB0L7Rh9C90LjRhtC1IGNzLCDQt9Cw0YLQtdC8INC40L3QttC10LrRgtC40Lwg0LIg0L/QtdGB0L7Rh9C90LjRhtGDINGB0LDQudGC0LAg0LrQsNC6IHdpbmRvdy5jaHJvbWVfZXh0XHJcbiAgICAgICAgc3RvcmFnZToge1xyXG4gICAgICAgICAgICBmbmM6IHN0b3JhZ2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdG9yYWdlID0gc3RvcmFnZTtcclxuICAgICAgICAgICAgICAgIHV0aWxzLmluamVjdENvZGUuYXBwbHkobnVsbCwgW1xyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKHN0b3JhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmNocm9tZV9leHQgPSB7c3RvcmFnZTogc3RvcmFnZX07XHJcbiAgICAgICAgICAgICAgICAgICAgfV0uY29uY2F0KEpTT04uc3RyaW5naWZ5KHN0b3JhZ2UpKSk7XHJcbiAgICAgICAgICAgIH0sIGFyZ3M6IChyZXF1ZXN0KSA9PiByZXF1ZXN0LnN0b3JhZ2UsIGRvTm90SW5qZWN0OiB0cnVlLFxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGZ1bGxzdGF0ZToge1xyXG4gICAgICAgICAgICBmbmM6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KHdpbmRvdy5DVVNUT01fRVZFTlRfTkFNRSwge1xyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdmdWxsc3RhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFjazogZXh0ZXJuYWxBUEkuZ2V0Q3VycmVudFRyYWNrV3JhcHBlcigpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzczogZXh0ZXJuYWxBUEkuZ2V0UHJvZ3Jlc3MoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBleHRlcm5hbEFQSS5nZXRTb3VyY2VJbmZvV3JhcHBlcigpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVzOiBleHRlcm5hbEFQSS5nZXRDb250cm9sc1dyYXBwZXIoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZvbHVtZTogZXh0ZXJuYWxBUEkuZ2V0Vm9sdW1lKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaHVmZmxlOiBleHRlcm5hbEFQSS5nZXRTaHVmZmxlV3JhcHBlcigpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwZWF0OiBleHRlcm5hbEFQSS5nZXRSZXBlYXRXcmFwcGVyKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYXlsaXN0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2OiBleHRlcm5hbEFQSS5nZXRQcmV2VHJhY2soKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpc3Q6IGV4dGVybmFsQVBJLmdldFRyYWNrc0xpc3QoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiBleHRlcm5hbEFQSS5nZXRUcmFja0luZGV4KCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0OiBleHRlcm5hbEFQSS5nZXROZXh0VHJhY2soKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNQbGF5aW5nOiBleHRlcm5hbEFQSS5pc1BsYXlpbmcoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdWlkOiBNdS5ibG9ja3MuZGkucmVwby5hdXRoLnVzZXIudWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlkOiBNdS5ibG9ja3MuZGkucmVwby5hdXRoLnVzZXIuZGV2aWNlX2lkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIH0sIGFyZ3M6IG51bGwsXHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcblxyXG4gICAgZXh0QXBpRXZlbnRzID0ge1xyXG4gICAgICAgIC8v0YHQvtCx0YvRgtC40LUg0YHQvNC10L3RiyDRgdC+0YHRgtC+0Y/QvdC40Y8gcGxheS9wYXVzZVxyXG4gICAgICAgICdFVkVOVF9TVEFURSc6ICgpID0+IHtcclxuICAgICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQod2luZG93LkNVU1RPTV9FVkVOVF9OQU1FLCB7ZGV0YWlsOiB7YWN0aW9uOiAnc3RhdGUnLCBpc1BsYXlpbmc6IGV4dGVybmFsQVBJLmlzUGxheWluZygpfX0pKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvL9GB0L7QsdGL0YLQuNC1INGB0LzQtdC90Ysg0YLRgNC10LrQsFxyXG4gICAgICAgICdFVkVOVF9UUkFDSyc6ICgpID0+IHtcclxuICAgICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQod2luZG93LkNVU1RPTV9FVkVOVF9OQU1FLCB7ZGV0YWlsOiB7YWN0aW9uOiAndHJhY2snLCB0cmFjazogZXh0ZXJuYWxBUEkuZ2V0Q3VycmVudFRyYWNrV3JhcHBlcigpLCBzb3VyY2U6IGV4dGVybmFsQVBJLmdldFNvdXJjZUluZm9XcmFwcGVyKCksIHByb2dyZXNzOiBleHRlcm5hbEFQSS5nZXRQcm9ncmVzcygpfX0pKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvL9GB0L7QsdGL0YLQuNC1INC90LDQttCw0YLQuNGPINC90LAg0LrQvdC+0L/QutGDINC/0L7QstGC0L7RgCwg0YjQsNGE0LssINC70LDQudC6XHJcbiAgICAgICAgJ0VWRU5UX0NPTlRST0xTJzogKCkgPT4ge1xyXG4gICAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCh3aW5kb3cuQ1VTVE9NX0VWRU5UX05BTUUsIHtkZXRhaWw6IHthY3Rpb246ICdjb250cm9scycsIGNvbnRyb2xzOiB7c3RhdGVzOiBleHRlcm5hbEFQSS5nZXRDb250cm9sc1dyYXBwZXIoKSwgdm9sdW1lOiBleHRlcm5hbEFQSS5nZXRWb2x1bWUoKSwgc2h1ZmZsZTogZXh0ZXJuYWxBUEkuZ2V0U2h1ZmZsZVdyYXBwZXIoKSwgcmVwZWF0OiBleHRlcm5hbEFQSS5nZXRSZXBlYXRXcmFwcGVyKCl9fX0pKTtcclxuICAgICAgICAgICAgLy/Qv9GA0Lgg0LrQu9C40LrQtSDQvdCwICjQtNC40Lcp0LvQsNC50Log0YHRgNCw0LHQsNGC0YvQstCw0LXRgiDQtNCw0L3QvdC+0LUg0YHQvtCx0YvRgtC40LUsINC90L4g0YHQsNC80L4g0YHQvtGB0YLQvtGP0L3QuNC1ICjQtNC40Lcp0LvQsNC50LrQsCDQvdCw0YXQvtC00LjRgtGB0Y8g0LIgZXh0ZXJuYWxBUEkuZ2V0Q3VycmVudFRyYWNrV3JhcHBlcigpLCDQv9C+0Y3RgtC+0LzRgyDQtNC70Y8g0LXQs9C+INC+0LHQvdC+0LLQu9C10L3QuNGPINCy0YvQt9GL0LLQsNC10Lwg0YHQvtCx0YvRgtC40LUgdHJhY2tcclxuICAgICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQod2luZG93LkNVU1RPTV9FVkVOVF9OQU1FLCB7ZGV0YWlsOiB7YWN0aW9uOiAndHJhY2snLCB0cmFjazogZXh0ZXJuYWxBUEkuZ2V0Q3VycmVudFRyYWNrV3JhcHBlcigpLCBzb3VyY2U6IGV4dGVybmFsQVBJLmdldFNvdXJjZUluZm9XcmFwcGVyKCksIHByb2dyZXNzOiBleHRlcm5hbEFQSS5nZXRQcm9ncmVzcygpLCBzZWNvbmRhcnk6IHRydWV9fSkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8v0YHQvtCx0YvRgtC40LUg0LjQt9C80LXQvdC10L3QuNGPINC/0LvQtdC50LvQuNGB0YLQsCDRgSDRhtC10LvRjNGOINC/0L7QudC80LDRgtGMINC10LPQviDQvtCx0L3Rg9C70LXQvdC40LVcclxuICAgICAgICAnRVZFTlRfVFJBQ0tTX0xJU1QnOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KHdpbmRvdy5DVVNUT01fRVZFTlRfTkFNRSwge2RldGFpbDoge2FjdGlvbjogJ3RyYWNrc2xpc3QnLCBwbGF5bGlzdDoge2xpc3Q6IGV4dGVybmFsQVBJLmdldFRyYWNrc0xpc3QoKSwgaW5kZXg6IGV4dGVybmFsQVBJLmdldFRyYWNrSW5kZXgoKSwgcHJldjogZXh0ZXJuYWxBUEkuZ2V0UHJldlRyYWNrKCksIG5leHQ6IGV4dGVybmFsQVBJLmdldE5leHRUcmFjaygpfX19KSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy/RgdC+0LHRi9GC0LjQtSDQuNC30LzQtdC90LXQvdC40Y8g0LPRgNC+0LzQutC+0YHRgtC4XHJcbiAgICAgICAgJ0VWRU5UX1ZPTFVNRSc6ICgpID0+IHtcclxuICAgICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQod2luZG93LkNVU1RPTV9FVkVOVF9OQU1FLCB7ZGV0YWlsOiB7YWN0aW9uOiAndm9sdW1lJywgdm9sdW1lOiBleHRlcm5hbEFQSS5nZXRWb2x1bWUoKX19KSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy/RgdC+0LHRi9GC0LjQtSDQv9GA0L7Qs9GA0LXRgdGB0LAg0L/RgNC+0LjQs9GA0YvQstCw0L3QuNGPXHJcbiAgICAgICAgJ0VWRU5UX1BST0dSRVNTJzogKCkgPT4ge1xyXG4gICAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCh3aW5kb3cuQ1VTVE9NX0VWRU5UX05BTUUsIHtkZXRhaWw6IHthY3Rpb246ICdwcm9ncmVzcycsIHByb2dyZXNzOiBleHRlcm5hbEFQSS5nZXRQcm9ncmVzcygpfX0pKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvL9GB0L7QsdGL0YLQuNC1INC90LDRh9Cw0LvQsCDQuCDQutC+0L3RhtCwINGA0LXQutC70LDQvNGLXHJcbiAgICAgICAgJ0VWRU5UX0FEVkVSVCc6IGUgPT4ge1xyXG4gICAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCh3aW5kb3cuQ1VTVE9NX0VWRU5UX05BTUUsIHtkZXRhaWw6IHthY3Rpb246ICdhZHZlcnQnLCBpbmZvOiBlLCBzdGF0ZTogZSAhPT0gZmFsc2V9fSkpO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG5cclxuICAgIHRocm90dGxlZEV2ZW50cyA9IHtwcm9ncmVzczoge3RpbWVyOiAwLCB0aW1lOiAxMDB9fTtcclxuXHJcbiAgICBwb3J0ID0gbnVsbDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBsb2cudHJhY2UoJ3lhbmRleC5jb25zdHJ1Y3RvcigpJyk7XHJcbiAgICAgICAgLy/RgdC+0LXQtNC40L3QtdC90LjQtSDRgSBleHRlbnNpb24n0L7QvFxyXG4gICAgICAgIHRoaXMucG9ydCA9IG5ldyBwb3J0Q2xhc3MoJ3ltdXNpYycsICdjbGllbnQnLCBudWxsKTtcclxuICAgICAgICAvL9C/0YDQvtCx0YDQvtGBINC+0LHRgNCw0LHQvtGC0YfQuNC60LAg0L/QvtC70YPRh9C10L3QvdGL0YUg0L7RgiBleHRlbnNpb24n0LAg0YHQvtC+0LHRidC10L3QuNC5XHJcbiAgICAgICAgdGhpcy5wb3J0LmFkZE9uTWVzc2FnZUNiKHRoaXMub25NZXNzYWdlKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgb25NZXNzYWdlID0gcmVxdWVzdCA9PiB7XHJcbiAgICAgICAgbG9nLmRlYnVnKCd5YW5kZXgub25NZXNzYWdlKCkgYWN0aW9uIDwlcz4nLCByZXF1ZXN0LmFjdGlvbik7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5jb21tYW5kc1tyZXF1ZXN0LmFjdGlvbl0pIHtcclxuICAgICAgICAgICAgbG9nLmRlYnVnKCd5YW5kZXgub25NZXNzYWdlKCkgYWN0aW9uIG5vdCBkZWZpbmVkJyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBhcmdzID0gKHR5cGVvZiB0aGlzLmNvbW1hbmRzW3JlcXVlc3QuYWN0aW9uXS5hcmdzID09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgID8gdGhpcy5jb21tYW5kc1tyZXF1ZXN0LmFjdGlvbl0uYXJncy5jYWxsKHRoaXMsIHJlcXVlc3QpXHJcbiAgICAgICAgICAgIDogdGhpcy5jb21tYW5kc1tyZXF1ZXN0LmFjdGlvbl0uYXJncztcclxuXHJcbiAgICAgICAgbG9nLnRyYWNlKCd5YW5kZXgub25NZXNzYWdlKCkgaW5qZWN0aW5nIGZ1bmMgJW8gd2l0aCBhcmdzICVvJywgdGhpcy5jb21tYW5kc1tyZXF1ZXN0LmFjdGlvbl0uZm5jLCBhcmdzKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmNvbW1hbmRzW3JlcXVlc3QuYWN0aW9uXS5kb05vdEluamVjdCkge1xyXG4gICAgICAgICAgICB1dGlscy5pbmplY3RDb2RlLmFwcGx5KG51bGwsIFt0aGlzLmNvbW1hbmRzW3JlcXVlc3QuYWN0aW9uXS5mbmNdLmNvbmNhdChhcmdzKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5jb21tYW5kc1tyZXF1ZXN0LmFjdGlvbl0uZm5jLmFwcGx5KG51bGwsIFtdLmNvbmNhdChhcmdzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBpbml0ID0gKCkgPT4ge1xyXG4gICAgICAgIGxvZy50cmFjZSgneWFuZGV4LmluaXQoKScpO1xyXG5cclxuICAgICAgICAvL9C00L7QsdCw0LLQu9GP0LXQvCDQvtCx0LXRgNGC0LrQuCDQvdCw0LQg0JDQn9CYXHJcbiAgICAgICAgLy9UT0RPOiDQv9C+0L/RgNC+0YHQuNGC0Ywg0L/QvtC/0YDQsNCy0LjRgtGMINGN0YLQvtGCINC80L7QvNC10L3RgiDQsiDQkNCf0JhcclxuICAgICAgICBsb2cudHJhY2UoJ3lhbmRleC5pbml0KCkgaW5qZWN0aW5nIGV4dGVybmFsQVBJIHdyYXBwZXJzJyk7XHJcbiAgICAgICAgdXRpbHMuaW5qZWN0Q29kZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGV4dGVybmFsQVBJLmdldEN1cnJlbnRUcmFja1dyYXBwZXIgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGxldCB0ID0gdGhpcy5nZXRDdXJyZW50VHJhY2soKTtcclxuICAgICAgICAgICAgICAgIGlmICh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQudmVyc2lvbiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHQudmVyc2lvbiA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0LmNvdmVyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdC5jb3ZlciA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHQ7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGV4dGVybmFsQVBJLmdldENvbnRyb2xzV3JhcHBlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbnRyb2xzID0gdGhpcy5nZXRDb250cm9scygpO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIGNvbnRyb2xzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChjb250cm9sc1trZXldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgZXh0ZXJuYWxBUEkuQ09OVFJPTF9FTkFCTEVEOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbHNba2V5XSA9ICdlbmFibGVkJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIGV4dGVybmFsQVBJLkNPTlRST0xfRElTQUJMRUQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sc1trZXldID0gJ2Rpc2FibGVkJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIGV4dGVybmFsQVBJLkNPTlRST0xfREVOSUVEOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbHNba2V5XSA9ICdkZW5pZWQnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbHNba2V5XSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRyb2xzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBleHRlcm5hbEFQSS5nZXRTb3VyY2VJbmZvV3JhcHBlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHQgPSB0aGlzLmdldFNvdXJjZUluZm8oKTtcclxuICAgICAgICAgICAgICAgIGlmICh0ICYmIHQuY292ZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHQuY292ZXIgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHQ7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGV4dGVybmFsQVBJLmdldFJlcGVhdFdyYXBwZXIgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoZXh0ZXJuYWxBUEkuZ2V0UmVwZWF0KCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIGV4dGVybmFsQVBJLlJFUEVBVF9BTEw6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIGV4dGVybmFsQVBJLlJFUEVBVF9PTkU6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIGV4dGVybmFsQVBJLlJFUEVBVF9OT05FOlxyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGV4dGVybmFsQVBJLmdldFNodWZmbGVXcmFwcGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGV4dGVybmFsQVBJLmdldFNodWZmbGUoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgZXh0ZXJuYWxBUEkuU0hVRkZMRV9PTjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgZXh0ZXJuYWxBUEkuU0hVRkZMRV9PRkY6XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy/QtNC+0LHQsNCy0LvRj9C10Lwg0L3QsNGIINC+0LHRgNCw0LHQvtGC0YfQuNC6INGB0L7QsdGL0YLQuNC5LCDRh9C10YDQtdC3INC60L7RgtC+0YDRi9C5INC/0YDQvtC40YHRhdC+0LTQuNGCINC+0LHRgNCw0YLQvdCw0Y8g0YHQstGP0LfRjFxyXG4gICAgICAgIGxvZy50cmFjZSgneWFuZGV4LmluaXQoKSBpbmplY3RpbmcgQ1VTVE9NX0VWRU5UX05BTUUnKTtcclxuICAgICAgICB1dGlscy5pbmplY3RDb2RlKHZhbCA9PiB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5DVVNUT01fRVZFTlRfTkFNRSA9IHZhbDtcclxuICAgICAgICB9LCBKU09OLnN0cmluZ2lmeShDVVNUT01fRVZFTlRfTkFNRSkpO1xyXG5cclxuICAgICAgICBsb2cudHJhY2UoJ3lhbmRleC5pbml0KCkgaW5qZWN0aW5nIGRvY3VtZW50IENVU1RPTV9FVkVOVF9OQU1FIGV2ZW50IGxpc3RlbmVyJyk7XHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihDVVNUT01fRVZFTlRfTkFNRSwgZSA9PiB7XHJcbiAgICAgICAgICAgIGxvZy50cmFjZSgneWFuZGV4LmN1c3RvbUV2ZW50TGlzdGVuZXIoKScsIGUuZGV0YWlsKTtcclxuICAgICAgICAgICAgbGV0IHVzZVRocm90dGxpbmcgPSAoISF0aGlzLnRocm90dGxlZEV2ZW50c1tlLmRldGFpbC5hY3Rpb25dKSxcclxuICAgICAgICAgICAgICAgIHRocm90dGxpbmdLZXkgPSBlLmRldGFpbC5hY3Rpb24sXHJcbiAgICAgICAgICAgICAgICB0aHJvdHRsZVRpbWUgPSB1c2VUaHJvdHRsaW5nID8gdGhpcy50aHJvdHRsZWRFdmVudHNbZS5kZXRhaWwuYWN0aW9uXS50aW1lIDogbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGxvZy50cmFjZSgneWFuZGV4LmN1c3RvbUV2ZW50TGlzdGVuZXIoKSBzZW5kaW5nIHRvIHBvcnQ6IHVzZVRocm90dGxpbmcgPCVvPiwgdGhyb3R0bGluZ0tleSA8JXM+LCB0aHJvdHRsZVRpbWUgPCVkPicsIHVzZVRocm90dGxpbmcsIHRocm90dGxpbmdLZXksIHRocm90dGxlVGltZSk7XHJcbiAgICAgICAgICAgIHRoaXMucG9ydC5zZW5kKGUuZGV0YWlsLCB1c2VUaHJvdHRsaW5nLCB0aHJvdHRsaW5nS2V5LCB0aHJvdHRsZVRpbWUpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvL9C00L7QsdCw0LLQu9GP0LXQvCDRgdC70YPRiNCw0YLQtdC70LXQuSDRgdC+0LHRi9GC0LjQuSBleHRlcm5hbEFQSVxyXG4gICAgICAgIGxvZy50cmFjZSgneWFuZGV4LmluaXQoKSBpbmplY3RpbmcgZXh0ZXJuYWxBUEkgZXZlbnRzIGxpc3RlbmVycycpO1xyXG4gICAgICAgIGZvciAoY29uc3QgZXZlbnQgaW4gdGhpcy5leHRBcGlFdmVudHMpIHtcclxuICAgICAgICAgICAgdXRpbHMuaW5qZWN0Q29kZSgoZXZ0LCBmbmMpID0+IHtcclxuICAgICAgICAgICAgICAgIGV4dGVybmFsQVBJLm9uKGV4dGVybmFsQVBJW2V2dF0sIGZuYyk7XHJcbiAgICAgICAgICAgIH0sIEpTT04uc3RyaW5naWZ5KGV2ZW50KSwgdGhpcy5leHRBcGlFdmVudHNbZXZlbnRdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8v0LTQvtCx0LDQstC70Y/QtdC8INGB0LvRg9GI0LDRgtC10LvRjyDRgdGC0LDQvdC00LDRgNGC0L3Ri9GFIERPTSDRgdC+0LHRi9GC0LjQuVxyXG4gICAgICAgIGxvZy50cmFjZSgneWFuZGV4LmluaXQoKSBpbmplY3RpbmcgRE9NIGV2ZW50cyBsaXN0ZW5lcnMnKTtcclxuICAgICAgICB1dGlscy5pbmplY3RDb2RlKCgpID0+IHtcclxuICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3VubG9hZCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQod2luZG93LkNVU1RPTV9FVkVOVF9OQU1FLCB7ZGV0YWlsOiB7YWN0aW9uOiAnc2h1dGRvd24nfX0pKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzZXR0aW5nc1ZhbHVlID0gd2luZG93LmNocm9tZV9leHQgPyB3aW5kb3cuY2hyb21lX2V4dC5zdG9yYWdlWydzdG9yZS5zZXR0aW5ncy5jbG9zZV9hbGVydCddIDogdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1zZyA9ICfQktGLINGD0LLQtdGA0LXQvdGLLCDRh9GC0L4g0YXQvtGC0LjRgtC1INC30LDQutGA0YvRgtGMINC+0LrQvdC+INCy0L4g0LLRgNC10LzRjyDQv9GA0L7QuNCz0YDRi9Cy0LDQvdC40Y8g0K/QvdC00LXQutGBLtCc0YPQt9GL0LrQuD8nO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzVmFsdWUgJiYgZXh0ZXJuYWxBUEkgJiYgZXh0ZXJuYWxBUEkuaXNQbGF5aW5nKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBlLnJldHVyblZhbHVlID0gbXNnO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtc2c7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KHdpbmRvdy5DVVNUT01fRVZFTlRfTkFNRSwge2RldGFpbDoge2FjdGlvbjogJ2ZvY3VzJ319KSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQod2luZG93LkNVU1RPTV9FVkVOVF9OQU1FLCB7ZGV0YWlsOiB7YWN0aW9uOiAnYmx1cid9fSkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy/RhNC+0YDQvNC40YDRg9C10Lwg0Lgg0L7RgtC/0YDQsNCy0LvRj9C10Lwg0YDQsNGB0YjQuNGA0LXQvdC40Y4g0L3QsNGH0LDQu9GM0L3QvtC1INGB0L7RgdGC0L7Rj9C90LjQtVxyXG4gICAgICAgIGxvZy50cmFjZSgneWFuZGV4LmluaXQoKSBpbmplY3RpbmcgaW5pdGlhbCBwbGF5ZXIgc3RhdGUgc3luYycpO1xyXG4gICAgICAgIHV0aWxzLmluamVjdENvZGUoKCkgPT4ge1xyXG4gICAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCh3aW5kb3cuQ1VTVE9NX0VWRU5UX05BTUUsIHtcclxuICAgICAgICAgICAgICAgIGRldGFpbDoge1xyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2Z1bGxzdGF0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgdHJhY2s6IGV4dGVybmFsQVBJLmdldEN1cnJlbnRUcmFja1dyYXBwZXIoKSxcclxuICAgICAgICAgICAgICAgICAgICBwcm9ncmVzczogZXh0ZXJuYWxBUEkuZ2V0UHJvZ3Jlc3MoKSxcclxuICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IGV4dGVybmFsQVBJLmdldFNvdXJjZUluZm9XcmFwcGVyKCksXHJcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVzOiBleHRlcm5hbEFQSS5nZXRDb250cm9sc1dyYXBwZXIoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdm9sdW1lOiBleHRlcm5hbEFQSS5nZXRWb2x1bWUoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2h1ZmZsZTogZXh0ZXJuYWxBUEkuZ2V0U2h1ZmZsZVdyYXBwZXIoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVwZWF0OiBleHRlcm5hbEFQSS5nZXRSZXBlYXRXcmFwcGVyKCksXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBwbGF5bGlzdDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2OiBleHRlcm5hbEFQSS5nZXRQcmV2VHJhY2soKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGlzdDogZXh0ZXJuYWxBUEkuZ2V0VHJhY2tzTGlzdCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogZXh0ZXJuYWxBUEkuZ2V0VHJhY2tJbmRleCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0OiBleHRlcm5hbEFQSS5nZXROZXh0VHJhY2soKSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGlzUGxheWluZzogZXh0ZXJuYWxBUEkuaXNQbGF5aW5nKCksXHJcbiAgICAgICAgICAgICAgICAgICAgdXNlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1aWQ6IE11LmJsb2Nrcy5kaS5yZXBvLmF1dGgudXNlci51aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpZDogTXUuYmxvY2tzLmRpLnJlcG8uYXV0aC51c2VyLmRldmljZV9pZCxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgeWFuZGV4O1xyXG4iLCIvKlxuKiBsb2dsZXZlbCAtIGh0dHBzOi8vZ2l0aHViLmNvbS9waW10ZXJyeS9sb2dsZXZlbFxuKlxuKiBDb3B5cmlnaHQgKGMpIDIwMTMgVGltIFBlcnJ5XG4qIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiovXG4oZnVuY3Rpb24gKHJvb3QsIGRlZmluaXRpb24pIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShkZWZpbml0aW9uKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3QubG9nID0gZGVmaW5pdGlvbigpO1xuICAgIH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgLy8gU2xpZ2h0bHkgZHViaW91cyB0cmlja3MgdG8gY3V0IGRvd24gbWluaW1pemVkIGZpbGUgc2l6ZVxuICAgIHZhciBub29wID0gZnVuY3Rpb24oKSB7fTtcbiAgICB2YXIgdW5kZWZpbmVkVHlwZSA9IFwidW5kZWZpbmVkXCI7XG5cbiAgICB2YXIgbG9nTWV0aG9kcyA9IFtcbiAgICAgICAgXCJ0cmFjZVwiLFxuICAgICAgICBcImRlYnVnXCIsXG4gICAgICAgIFwiaW5mb1wiLFxuICAgICAgICBcIndhcm5cIixcbiAgICAgICAgXCJlcnJvclwiXG4gICAgXTtcblxuICAgIC8vIENyb3NzLWJyb3dzZXIgYmluZCBlcXVpdmFsZW50IHRoYXQgd29ya3MgYXQgbGVhc3QgYmFjayB0byBJRTZcbiAgICBmdW5jdGlvbiBiaW5kTWV0aG9kKG9iaiwgbWV0aG9kTmFtZSkge1xuICAgICAgICB2YXIgbWV0aG9kID0gb2JqW21ldGhvZE5hbWVdO1xuICAgICAgICBpZiAodHlwZW9mIG1ldGhvZC5iaW5kID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gbWV0aG9kLmJpbmQob2JqKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kLmNhbGwobWV0aG9kLCBvYmopO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIC8vIE1pc3NpbmcgYmluZCBzaGltIG9yIElFOCArIE1vZGVybml6ciwgZmFsbGJhY2sgdG8gd3JhcHBpbmdcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHkuYXBwbHkobWV0aG9kLCBbb2JqLCBhcmd1bWVudHNdKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQnVpbGQgdGhlIGJlc3QgbG9nZ2luZyBtZXRob2QgcG9zc2libGUgZm9yIHRoaXMgZW52XG4gICAgLy8gV2hlcmV2ZXIgcG9zc2libGUgd2Ugd2FudCB0byBiaW5kLCBub3Qgd3JhcCwgdG8gcHJlc2VydmUgc3RhY2sgdHJhY2VzXG4gICAgZnVuY3Rpb24gcmVhbE1ldGhvZChtZXRob2ROYW1lKSB7XG4gICAgICAgIGlmIChtZXRob2ROYW1lID09PSAnZGVidWcnKSB7XG4gICAgICAgICAgICBtZXRob2ROYW1lID0gJ2xvZyc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgPT09IHVuZGVmaW5lZFR5cGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gTm8gbWV0aG9kIHBvc3NpYmxlLCBmb3Igbm93IC0gZml4ZWQgbGF0ZXIgYnkgZW5hYmxlTG9nZ2luZ1doZW5Db25zb2xlQXJyaXZlc1xuICAgICAgICB9IGVsc2UgaWYgKGNvbnNvbGVbbWV0aG9kTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGJpbmRNZXRob2QoY29uc29sZSwgbWV0aG9kTmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY29uc29sZS5sb2cgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGJpbmRNZXRob2QoY29uc29sZSwgJ2xvZycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUaGVzZSBwcml2YXRlIGZ1bmN0aW9ucyBhbHdheXMgbmVlZCBgdGhpc2AgdG8gYmUgc2V0IHByb3Blcmx5XG5cbiAgICBmdW5jdGlvbiByZXBsYWNlTG9nZ2luZ01ldGhvZHMobGV2ZWwsIGxvZ2dlck5hbWUpIHtcbiAgICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsb2dNZXRob2RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbWV0aG9kTmFtZSA9IGxvZ01ldGhvZHNbaV07XG4gICAgICAgICAgICB0aGlzW21ldGhvZE5hbWVdID0gKGkgPCBsZXZlbCkgP1xuICAgICAgICAgICAgICAgIG5vb3AgOlxuICAgICAgICAgICAgICAgIHRoaXMubWV0aG9kRmFjdG9yeShtZXRob2ROYW1lLCBsZXZlbCwgbG9nZ2VyTmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZWZpbmUgbG9nLmxvZyBhcyBhbiBhbGlhcyBmb3IgbG9nLmRlYnVnXG4gICAgICAgIHRoaXMubG9nID0gdGhpcy5kZWJ1ZztcbiAgICB9XG5cbiAgICAvLyBJbiBvbGQgSUUgdmVyc2lvbnMsIHRoZSBjb25zb2xlIGlzbid0IHByZXNlbnQgdW50aWwgeW91IGZpcnN0IG9wZW4gaXQuXG4gICAgLy8gV2UgYnVpbGQgcmVhbE1ldGhvZCgpIHJlcGxhY2VtZW50cyBoZXJlIHRoYXQgcmVnZW5lcmF0ZSBsb2dnaW5nIG1ldGhvZHNcbiAgICBmdW5jdGlvbiBlbmFibGVMb2dnaW5nV2hlbkNvbnNvbGVBcnJpdmVzKG1ldGhvZE5hbWUsIGxldmVsLCBsb2dnZXJOYW1lKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IHVuZGVmaW5lZFR5cGUpIHtcbiAgICAgICAgICAgICAgICByZXBsYWNlTG9nZ2luZ01ldGhvZHMuY2FsbCh0aGlzLCBsZXZlbCwgbG9nZ2VyTmFtZSk7XG4gICAgICAgICAgICAgICAgdGhpc1ttZXRob2ROYW1lXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIEJ5IGRlZmF1bHQsIHdlIHVzZSBjbG9zZWx5IGJvdW5kIHJlYWwgbWV0aG9kcyB3aGVyZXZlciBwb3NzaWJsZSwgYW5kXG4gICAgLy8gb3RoZXJ3aXNlIHdlIHdhaXQgZm9yIGEgY29uc29sZSB0byBhcHBlYXIsIGFuZCB0aGVuIHRyeSBhZ2Fpbi5cbiAgICBmdW5jdGlvbiBkZWZhdWx0TWV0aG9kRmFjdG9yeShtZXRob2ROYW1lLCBsZXZlbCwgbG9nZ2VyTmFtZSkge1xuICAgICAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgICAgICByZXR1cm4gcmVhbE1ldGhvZChtZXRob2ROYW1lKSB8fFxuICAgICAgICAgICAgICAgZW5hYmxlTG9nZ2luZ1doZW5Db25zb2xlQXJyaXZlcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIExvZ2dlcihuYW1lLCBkZWZhdWx0TGV2ZWwsIGZhY3RvcnkpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBjdXJyZW50TGV2ZWw7XG4gICAgICB2YXIgc3RvcmFnZUtleSA9IFwibG9nbGV2ZWxcIjtcbiAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgIHN0b3JhZ2VLZXkgKz0gXCI6XCIgKyBuYW1lO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBwZXJzaXN0TGV2ZWxJZlBvc3NpYmxlKGxldmVsTnVtKSB7XG4gICAgICAgICAgdmFyIGxldmVsTmFtZSA9IChsb2dNZXRob2RzW2xldmVsTnVtXSB8fCAnc2lsZW50JykudG9VcHBlckNhc2UoKTtcblxuICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSB1bmRlZmluZWRUeXBlKSByZXR1cm47XG5cbiAgICAgICAgICAvLyBVc2UgbG9jYWxTdG9yYWdlIGlmIGF2YWlsYWJsZVxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc3RvcmFnZUtleV0gPSBsZXZlbE5hbWU7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGNhdGNoIChpZ25vcmUpIHt9XG5cbiAgICAgICAgICAvLyBVc2Ugc2Vzc2lvbiBjb29raWUgYXMgZmFsbGJhY2tcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICB3aW5kb3cuZG9jdW1lbnQuY29va2llID1cbiAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoc3RvcmFnZUtleSkgKyBcIj1cIiArIGxldmVsTmFtZSArIFwiO1wiO1xuICAgICAgICAgIH0gY2F0Y2ggKGlnbm9yZSkge31cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZ2V0UGVyc2lzdGVkTGV2ZWwoKSB7XG4gICAgICAgICAgdmFyIHN0b3JlZExldmVsO1xuXG4gICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09IHVuZGVmaW5lZFR5cGUpIHJldHVybjtcblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHN0b3JlZExldmVsID0gd2luZG93LmxvY2FsU3RvcmFnZVtzdG9yYWdlS2V5XTtcbiAgICAgICAgICB9IGNhdGNoIChpZ25vcmUpIHt9XG5cbiAgICAgICAgICAvLyBGYWxsYmFjayB0byBjb29raWVzIGlmIGxvY2FsIHN0b3JhZ2UgZ2l2ZXMgdXMgbm90aGluZ1xuICAgICAgICAgIGlmICh0eXBlb2Ygc3RvcmVkTGV2ZWwgPT09IHVuZGVmaW5lZFR5cGUpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgIHZhciBjb29raWUgPSB3aW5kb3cuZG9jdW1lbnQuY29va2llO1xuICAgICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gY29va2llLmluZGV4T2YoXG4gICAgICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHN0b3JhZ2VLZXkpICsgXCI9XCIpO1xuICAgICAgICAgICAgICAgICAgaWYgKGxvY2F0aW9uICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgIHN0b3JlZExldmVsID0gL14oW147XSspLy5leGVjKGNvb2tpZS5zbGljZShsb2NhdGlvbikpWzFdO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGNhdGNoIChpZ25vcmUpIHt9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gSWYgdGhlIHN0b3JlZCBsZXZlbCBpcyBub3QgdmFsaWQsIHRyZWF0IGl0IGFzIGlmIG5vdGhpbmcgd2FzIHN0b3JlZC5cbiAgICAgICAgICBpZiAoc2VsZi5sZXZlbHNbc3RvcmVkTGV2ZWxdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgc3RvcmVkTGV2ZWwgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHN0b3JlZExldmVsO1xuICAgICAgfVxuXG4gICAgICAvKlxuICAgICAgICpcbiAgICAgICAqIFB1YmxpYyBsb2dnZXIgQVBJIC0gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waW10ZXJyeS9sb2dsZXZlbCBmb3IgZGV0YWlsc1xuICAgICAgICpcbiAgICAgICAqL1xuXG4gICAgICBzZWxmLm5hbWUgPSBuYW1lO1xuXG4gICAgICBzZWxmLmxldmVscyA9IHsgXCJUUkFDRVwiOiAwLCBcIkRFQlVHXCI6IDEsIFwiSU5GT1wiOiAyLCBcIldBUk5cIjogMyxcbiAgICAgICAgICBcIkVSUk9SXCI6IDQsIFwiU0lMRU5UXCI6IDV9O1xuXG4gICAgICBzZWxmLm1ldGhvZEZhY3RvcnkgPSBmYWN0b3J5IHx8IGRlZmF1bHRNZXRob2RGYWN0b3J5O1xuXG4gICAgICBzZWxmLmdldExldmVsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBjdXJyZW50TGV2ZWw7XG4gICAgICB9O1xuXG4gICAgICBzZWxmLnNldExldmVsID0gZnVuY3Rpb24gKGxldmVsLCBwZXJzaXN0KSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBsZXZlbCA9PT0gXCJzdHJpbmdcIiAmJiBzZWxmLmxldmVsc1tsZXZlbC50b1VwcGVyQ2FzZSgpXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgIGxldmVsID0gc2VsZi5sZXZlbHNbbGV2ZWwudG9VcHBlckNhc2UoKV07XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0eXBlb2YgbGV2ZWwgPT09IFwibnVtYmVyXCIgJiYgbGV2ZWwgPj0gMCAmJiBsZXZlbCA8PSBzZWxmLmxldmVscy5TSUxFTlQpIHtcbiAgICAgICAgICAgICAgY3VycmVudExldmVsID0gbGV2ZWw7XG4gICAgICAgICAgICAgIGlmIChwZXJzaXN0ICE9PSBmYWxzZSkgeyAgLy8gZGVmYXVsdHMgdG8gdHJ1ZVxuICAgICAgICAgICAgICAgICAgcGVyc2lzdExldmVsSWZQb3NzaWJsZShsZXZlbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVwbGFjZUxvZ2dpbmdNZXRob2RzLmNhbGwoc2VsZiwgbGV2ZWwsIG5hbWUpO1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgPT09IHVuZGVmaW5lZFR5cGUgJiYgbGV2ZWwgPCBzZWxmLmxldmVscy5TSUxFTlQpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBcIk5vIGNvbnNvbGUgYXZhaWxhYmxlIGZvciBsb2dnaW5nXCI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aHJvdyBcImxvZy5zZXRMZXZlbCgpIGNhbGxlZCB3aXRoIGludmFsaWQgbGV2ZWw6IFwiICsgbGV2ZWw7XG4gICAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgc2VsZi5zZXREZWZhdWx0TGV2ZWwgPSBmdW5jdGlvbiAobGV2ZWwpIHtcbiAgICAgICAgICBpZiAoIWdldFBlcnNpc3RlZExldmVsKCkpIHtcbiAgICAgICAgICAgICAgc2VsZi5zZXRMZXZlbChsZXZlbCwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHNlbGYuZW5hYmxlQWxsID0gZnVuY3Rpb24ocGVyc2lzdCkge1xuICAgICAgICAgIHNlbGYuc2V0TGV2ZWwoc2VsZi5sZXZlbHMuVFJBQ0UsIHBlcnNpc3QpO1xuICAgICAgfTtcblxuICAgICAgc2VsZi5kaXNhYmxlQWxsID0gZnVuY3Rpb24ocGVyc2lzdCkge1xuICAgICAgICAgIHNlbGYuc2V0TGV2ZWwoc2VsZi5sZXZlbHMuU0lMRU5ULCBwZXJzaXN0KTtcbiAgICAgIH07XG5cbiAgICAgIC8vIEluaXRpYWxpemUgd2l0aCB0aGUgcmlnaHQgbGV2ZWxcbiAgICAgIHZhciBpbml0aWFsTGV2ZWwgPSBnZXRQZXJzaXN0ZWRMZXZlbCgpO1xuICAgICAgaWYgKGluaXRpYWxMZXZlbCA9PSBudWxsKSB7XG4gICAgICAgICAgaW5pdGlhbExldmVsID0gZGVmYXVsdExldmVsID09IG51bGwgPyBcIldBUk5cIiA6IGRlZmF1bHRMZXZlbDtcbiAgICAgIH1cbiAgICAgIHNlbGYuc2V0TGV2ZWwoaW5pdGlhbExldmVsLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgLypcbiAgICAgKlxuICAgICAqIFRvcC1sZXZlbCBBUElcbiAgICAgKlxuICAgICAqL1xuXG4gICAgdmFyIGRlZmF1bHRMb2dnZXIgPSBuZXcgTG9nZ2VyKCk7XG5cbiAgICB2YXIgX2xvZ2dlcnNCeU5hbWUgPSB7fTtcbiAgICBkZWZhdWx0TG9nZ2VyLmdldExvZ2dlciA9IGZ1bmN0aW9uIGdldExvZ2dlcihuYW1lKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIiB8fCBuYW1lID09PSBcIlwiKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIllvdSBtdXN0IHN1cHBseSBhIG5hbWUgd2hlbiBjcmVhdGluZyBhIGxvZ2dlci5cIik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbG9nZ2VyID0gX2xvZ2dlcnNCeU5hbWVbbmFtZV07XG4gICAgICAgIGlmICghbG9nZ2VyKSB7XG4gICAgICAgICAgbG9nZ2VyID0gX2xvZ2dlcnNCeU5hbWVbbmFtZV0gPSBuZXcgTG9nZ2VyKFxuICAgICAgICAgICAgbmFtZSwgZGVmYXVsdExvZ2dlci5nZXRMZXZlbCgpLCBkZWZhdWx0TG9nZ2VyLm1ldGhvZEZhY3RvcnkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsb2dnZXI7XG4gICAgfTtcblxuICAgIC8vIEdyYWIgdGhlIGN1cnJlbnQgZ2xvYmFsIGxvZyB2YXJpYWJsZSBpbiBjYXNlIG9mIG92ZXJ3cml0ZVxuICAgIHZhciBfbG9nID0gKHR5cGVvZiB3aW5kb3cgIT09IHVuZGVmaW5lZFR5cGUpID8gd2luZG93LmxvZyA6IHVuZGVmaW5lZDtcbiAgICBkZWZhdWx0TG9nZ2VyLm5vQ29uZmxpY3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IHVuZGVmaW5lZFR5cGUgJiZcbiAgICAgICAgICAgICAgIHdpbmRvdy5sb2cgPT09IGRlZmF1bHRMb2dnZXIpIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2cgPSBfbG9nO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlZmF1bHRMb2dnZXI7XG4gICAgfTtcblxuICAgIGRlZmF1bHRMb2dnZXIuZ2V0TG9nZ2VycyA9IGZ1bmN0aW9uIGdldExvZ2dlcnMoKSB7XG4gICAgICAgIHJldHVybiBfbG9nZ2Vyc0J5TmFtZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGRlZmF1bHRMb2dnZXI7XG59KSk7XG4iXX0=
