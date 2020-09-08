(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _utils = require('./common/utils');

var _utils2 = _interopRequireDefault(_utils);

var _ext = require('./bg/ext');

var _ext2 = _interopRequireDefault(_ext);

var _tabs = require('./bg/tabs');

var _tabs2 = _interopRequireDefault(_tabs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_loglevel2.default.setLevel('INFO'); //"TRACE" > "DEBUG" > "INFO" > "WARN" > "ERROR" > "SILENT"
//for debug:
//window.logger = log;


//TODO: временное решение для popup'а, в идеале надо через port гонять всю инфу
window.tabs = _tabs2.default;

/*** GA ***/
(function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments);
    }, i[r].l = 1 * new Date();
    a = s.createElement(o), m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m);
})(window, document, 'script', 'https://ssl.google-analytics.com/analytics.js', 'ga');
ga('create', 'UA-56927760-1');
ga('set', 'checkProtocolTask', function () {});
/*** GA ends ***/

try {
    _ext2.default.init();
} catch (e) {
    _utils2.default.errorHandler(e);
}

},{"./bg/ext":4,"./bg/tabs":9,"./common/utils":11,"loglevel":14}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _storage = require('./storage');

var _storage2 = _interopRequireDefault(_storage);

var _tabs = require('./tabs');

var _tabs2 = _interopRequireDefault(_tabs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DOUBLE_CLICK_TIME = 250;

var browserAction = function browserAction() {
    var _this = this;

    _classCallCheck(this, browserAction);

    this.titles = {
        na: 'Управление Яндекс.Музыкой/Радио: недоступно, нет открытых вкладок',
        musicPlay: 'Управление Яндекс.Музыкой: играет',
        radioPlay: 'Управление Яндекс.Радио: играет',
        musicPause: 'Управление Яндекс.Музыкой: пауза',
        radioPause: 'Управление Яндекс.Радио: пауза',
        musicWait: 'Управление Яндекс.Музыкой: в ожидании',
        radioWait: 'Управление Яндекс.Радио: в ожидании'
    };
    this.icons = {
        na: 'images/icon_38_2_na.png',
        musicPlay: 'images/icon_38_2_play.png',
        radioPlay: 'images/icon_38_2_play.png',
        musicPause: 'images/icon_38_2_pause.png',
        radioPause: 'images/icon_38_2_pause.png',
        musicWait: 'images/icon_38_2.png',
        radioWait: 'images/icon_38_2.png'
    };
    this.link = 'popup/popup.html';
    this.clickTimer = null;

    this.init = function () {
        _loglevel2.default.trace('browserAction.init()');
        switch (_storage2.default.get('global_mode')) {
            case 'popup':
                //если режим попап, то убираем слушатель клика по иконке, т.к. у нас выпадающее окно
                _this.removeClickListener();
                break;
            case 'button':
                //если режим кнопка, то попап не работает и добавляем слушатель клика по иконке
                _this.addClickListener();
                break;
        }
    };

    this.removeClickListener = function () {
        _loglevel2.default.trace('browserAction.removeClickListener()');
        chrome.browserAction.onClicked.removeListener(_this.clickHandler);
    };

    this.addClickListener = function () {
        _loglevel2.default.trace('browserAction.addClickListener()');
        chrome.browserAction.onClicked.addListener(_this.clickHandler);
    };

    this.clickHandler = function () {
        _loglevel2.default.trace('browserAction.clickHandler()');
        //с помощью таймера ловим даблклик если успеть кликнуть дважды до DOUBLE_CLICK_TIME мс
        if (_this.clickTimer) {
            window.clearTimeout(_this.clickTimer);
            _this.clickTimer = null;
            _tabs2.default.getActiveTab().send({ action: 'next' });
        } else {
            _this.clickTimer = window.setTimeout(function () {
                _this.clickTimer = null;
                _tabs2.default.getActiveTab().send({ action: 'play' });
            }, DOUBLE_CLICK_TIME);
        }
    };

    this.update = function () {
        _loglevel2.default.trace('browserAction.update()');

        //все вкладки закрыты
        if (!_tabs2.default.count()) {
            _loglevel2.default.trace('browserAction.update() all tabs closed, all set NA');
            chrome.browserAction.setIcon({ path: _this.icons.na });
            chrome.browserAction.setTitle({ title: _this.titles.na });
            //если открытых вкладок нет, то даже в режиме кнопки оставляем попап с возможностью открыть Я.М/Я.Р
            chrome.browserAction.setPopup({ popup: _this.link });
            return;
        }

        //есть активная вкладка
        var activeTab = _tabs2.default.getActiveTab();
        if (activeTab) {
            _loglevel2.default.trace('browserAction.update() set to ' + (_storage2.default.get('global_mode') ? _this.link : '<null>'));

            //добавляем ссылку на попап в режиме попапа и удаляем ссылку в режиме кнопки
            switch (_storage2.default.get('global_mode')) {
                case 'popup':
                    chrome.browserAction.setPopup({ popup: _this.link });
                    break;
                case 'button':
                    chrome.browserAction.setPopup({ popup: '' });
                    break;
            }

            if (activeTab.player.isPlaying === true) {
                _loglevel2.default.trace('browserAction.update() icon set to playing');
                chrome.browserAction.setIcon({ path: _this.icons[activeTab.type + 'Play'] });
                chrome.browserAction.setTitle({ title: _this.titles[activeTab.type + 'Play'] });
            } else if (activeTab.player.isPlaying === false) {
                _loglevel2.default.trace('browserAction.update() icon set to paused');
                chrome.browserAction.setIcon({ path: _this.icons[activeTab.type + 'Pause'] });
                chrome.browserAction.setTitle({ title: _this.titles[activeTab.type + 'Pause'] });
            } else {
                _loglevel2.default.trace('browserAction.update() icon set to waiting');
                chrome.browserAction.setIcon({ path: _this.icons[activeTab.type + 'Wait'] });
                chrome.browserAction.setTitle({ title: _this.titles[activeTab.type + 'Wait'] });
            }
        }
    };

    this.closePopup = function () {
        _loglevel2.default.trace('browserAction.closePopup()');

        var popups = chrome.extension.getViews({ type: 'popup' });
        if (popups.length) {
            popups[0].close();
            _loglevel2.default.trace('browserAction.closePopup() closed');
        }
    };

    _loglevel2.default.trace('browserAction.constructor()');
    this.init();
};

exports.default = new browserAction();

},{"./storage":7,"./tabs":9,"loglevel":14}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var downloader = {
    fileLink: null,
    createLinkToTextFile: function createLinkToTextFile(text) {
        var data = new Blob([text], { type: 'text/plain' });
        this.fileLink = window.URL.createObjectURL(data);
        return this.fileLink;
    },
    deleteFileLink: function deleteFileLink() {
        window.URL.revokeObjectURL(this.fileLink);
    },
    download: function download(filename, text) {
        var _this = this;

        chrome.downloads.setShelfEnabled(false);
        chrome.downloads.onChanged.addListener(function (data) {
            if (data.state && data.state.current === 'complete') {
                chrome.downloads.setShelfEnabled(true);
                _this.deleteFileLink();
            }
        });
        chrome.downloads.download({
            url: this.createLinkToTextFile(text),
            filename: filename,
            conflictAction: 'overwrite'
        });
    }
};

exports.default = downloader;

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _storage = require('./storage');

var _storage2 = _interopRequireDefault(_storage);

var _tabs = require('./tabs');

var _tabs2 = _interopRequireDefault(_tabs);

var _news = require('../../options_src/app/news');

var _news2 = _interopRequireDefault(_news);

var _port = require('../common/port');

var _port2 = _interopRequireDefault(_port);

var _notifications = require('./notifications');

var _notifications2 = _interopRequireDefault(_notifications);

var _browserAction = require('./browserAction');

var _browserAction2 = _interopRequireDefault(_browserAction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//for debug
//window.storage = storage;

var EXTERNAL_EXTENSION_ID = 'aofainoofnonhpfljipdaoagmjmhcidl';

var ext =
//список зарегистрированных в manifest.json команд и действия при их получении
//action - действие
//[confirm] - подтверждение {title, icon, storageOptionName}
//[beforeCb] - предусловие выполнения действия
//[afterCb]  - действия после отправки команды
function ext() {
    var _this = this;

    _classCallCheck(this, ext);

    this.commands = {
        player_next: { action: 'next' },
        player_play: { action: 'play' },
        player_prev: { action: 'prev' },
        player_info: { action: 'info' },
        player_volume_up: { action: 'volumeup' },
        player_volume_toggle: { action: 'volumeToggle' },
        player_volume_down: { action: 'volumedown' },
        player_shuffle: { action: 'shuffle' },
        player_repeat: {
            action: 'repeat',
            afterCb: function afterCb() {
                if (_notifications2.default.notificationsGranted && _storage2.default.get('hotkey_repeat_notif')) {
                    var title = ['\nВключен повтор всех треков', '\nВыключен повтор', '\nВключен повтор трека'],
                        repeatMode = ~~_tabs2.default.getActiveTab().player.controls.repeat;
                    _notifications2.default.createToast('images/repeat_' + repeatMode + '.png', title[repeatMode]);
                }
            }
        },
        player_like: {
            action: 'like',
            beforeCb: function beforeCb() {
                if (!_tabs2.default.getActiveTab().player.track.liked) {
                    return true;
                }

                switch (_storage2.default.get('hotkey_like_action')) {
                    case 'remove':
                        return true;
                    case 'none':
                        return false;
                    case 'ask':
                        if (_notifications2.default.notificationsGranted) {
                            _notifications2.default.createConfirmation('like', 'Вы уверены что хотите убрать у трека отметку "Мне нравится"?', 'images/like-notif.png');
                            return false;
                        } else {
                            _loglevel2.default.warn('ext.onCommand() confirmation not granted, disabling confirmation');
                            return true;
                        }
                }
            }
        },
        player_dislike: {
            action: 'dislike',
            confirm: {
                title: function title() {
                    return _tabs2.default.getActiveTab().type != 'radio' ? 'Вы уверены что хотите отметить трек как "Не рекомендовать"?' : 'Вы уверены что хотите отметить трек как "Не нравится"?';
                },
                icon: function icon() {
                    return _tabs2.default.getActiveTab().type != 'radio' ? 'images/dontrec-notif.png' : 'images/dislike-notif.png';
                },
                storageOptionName: 'hotkey_dislike_action'
            }
        },
        player_seek_fwd: { action: 'seekFwd' },
        player_seek_back: { action: 'seekBack' }
    };
    this.popupConnection = null;

    this.init = function () {
        _loglevel2.default.trace('ext.init()');

        //добавляем логгеру метод для трансляции уровня логирования в CS
        _loglevel2.default.cs = function () {
            var tab = _tabs2.default.getActiveTab();
            if (tab) {
                tab.send({ action: 'debug', level: _loglevel2.default.getLevel() });
            }
        };

        //установка или обновление расширения
        _loglevel2.default.trace('ext.init() adding onInstalled event listener');
        chrome.runtime.onInstalled.addListener(_this.onInstalled);

        //добавляем слушатель событий, пришедших от CS скрипта из вкладки
        chrome.runtime.onConnect.addListener(_this.onConnect);

        //добавляем слушатель горячих клавищ
        chrome.commands.onCommand.addListener(_this.onCommand);

        //добавляем слушатель сообщений, пришедших из другого расширения
        chrome.runtime.onMessageExternal.addListener(_this.onMessageExternal);

        //задаем реакцию на событие изменения конфигурации
        _storage2.default.addOnStorageChangeCb(_this.onStorageChange);

        //загружено расширение
        ga('send', 'event', 'background', 'init', _storage2.default.get('user_id'));
    };

    this.onStorageChange = function (e) {
        _loglevel2.default.trace('ext.onStorageChange() with key <%s>', e.key);
        switch (e.key) {
            case 'store.settings.global_mode':
                _browserAction2.default.init();
                _browserAction2.default.update();
                break;

            case 'store.settings.popup_show_var':
                _browserAction2.default.closePopup();
                break;
        }
        //при изменениях storage отправляем их в cs
        var tab = _tabs2.default.getActiveTab();
        if (tab !== false) {
            tab.send({ action: 'storage', storage: _storage2.default.getAll() });
        }
    };

    this.onConnect = function (port) {
        _loglevel2.default.trace('ext.onConnect() port %o', port);

        if (port.sender.tab && port.name === 'ymusic') {
            _loglevel2.default.trace('ext.onConnect() connect from CS from tab', port.sender.tab);
            var tab = _tabs2.default.getById(port.sender.tab.id);
            tab.addPort(port);
            //при открытии порта отправляем текущее состояние storage в cs
            tab.send({ action: 'storage', storage: _storage2.default.getAll() });
        }

        //соединение с extension'ом
        if (port.name === 'popup') {
            _this.popupConnection = new _port2.default('popup', 'host', port);
            _this.popupConnection.addOnMessageCb(_this.onPopupMessage);
        }
    };

    this.onCommand = function (command) {
        _loglevel2.default.debug('ext.onCommand() with command <%s>', command);

        try {
            if (_tabs2.default.getActiveTab() === false) {
                _loglevel2.default.trace('ext.onCommand() there is no active tab');
                return;
            }
            if (!_this.commands[command]) {
                _loglevel2.default.trace('ext.onCommand() command unknown');
                return;
            }

            if (_this.commands[command].confirm && _storage2.default.get(_this.commands[command].confirm.storageOptionName)) {
                _loglevel2.default.debug('ext.onCommand() confirmation needed', _this.commands[command].confirm);
                if (_notifications2.default.notificationsGranted) {
                    _notifications2.default.createConfirmation(_this.commands[command].action, typeof _this.commands[command].confirm.title === 'function' ? _this.commands[command].confirm.title() : _this.commands[command].confirm.title, typeof _this.commands[command].confirm.icon == 'function' ? _this.commands[command].confirm.icon() : _this.commands[command].confirm.icon);
                } else {
                    _loglevel2.default.warn('ext.onCommand() confirmation not granted, applying action');
                    _tabs2.default.getActiveTab().send({ action: _this.commands[command].action });
                    if (typeof _this.commands[command].afterCb == 'function') {
                        _this.commands[command].afterCb();
                    }
                }
            } else if (typeof _this.commands[command].beforeCb != 'function' || _this.commands[command].beforeCb()) {
                _loglevel2.default.debug('ext.onCommand() confirmation not needed');
                _tabs2.default.getActiveTab().send({ action: _this.commands[command].action });
                if (typeof _this.commands[command].afterCb == 'function') {
                    _this.commands[command].afterCb();
                }
            }
        } catch (e) {
            utils.errorHandler(e);
        }
    };

    this.onInstalled = function (details) {
        _loglevel2.default.trace('ext.onInstalled()');
        try {
            //инициализируем хранилище настроек
            _storage2.default.init();

            //установка
            if (details.reason == 'install') {
                ga('send', 'event', 'background', 'installed', chrome.runtime.getManifest().version);
            } //обновление (при условии, что версия изменилась)
            else if (details.reason == 'update' && details.previousVersion != chrome.runtime.getManifest().version) {
                    ga('send', 'event', 'background', 'updated', details.previousVersion + '>' + chrome.runtime.getManifest().version);

                    //если в настройках стоит открытие страницы настроек на вкладке история изменений и в новостях есть описание
                    //данной версии - открываем страницу настроек автоматом
                    if (_storage2.default.get('autoopen') && _news2.default[chrome.runtime.getManifest().version] || _news2.default[chrome.runtime.getManifest().version] && _news2.default[chrome.runtime.getManifest().version].urgent) {
                        chrome.tabs.create({ url: '/options/index.html' });
                    }
                }
        } catch (e) {
            utils.errorHandler(e);
        }
    };

    this.onMessageExternal = function (request, sender, sendResponse) {
        _loglevel2.default.trace('ext.onMessageExternal() request %o from sender %o', request, sender);
        if (sender.id != EXTERNAL_EXTENSION_ID) {
            _loglevel2.default.trace('ext.onMessageExternal() message from unknown sender, skipped');
            return;
        }

        _loglevel2.default.trace('ext.onMessageExternal() make some action');

        //    if (request.command == 'state')
        //    {
        //        sendResponse({result: true, state: bg.tabs.getActiveTab().player});
        //        return;
        //    }
        //
        //    this.onCommand("player_"+request.command);
        //    sendResponse({result: true});
    };

    this.onPopupDisconnect = function () {
        _loglevel2.default.trace('ext.onPopupDisconnect()');
        //до рефакторинга возникала проблема когда при изменении урла страницы не происходит событие onunload и это
        //приводит к ошибке, но зато происходит событие onDisconnect у порта, поэтому дублируем функционал закрытия
        //вкладки
        //tabs.shutdown(this.id);
        //this.popupConnection = null;
    };

    this.onPopupMessage = function (msg, port) {
        _loglevel2.default.trace('ext.onPopupMessage() with message %o from port %o', msg, port);
        //if (!msg.action)
        //{
        //    log.trace("ext.onPopupMessage() invalid message");
        //    return;
        //}
        //const actionListenerName = `on${msg.action.capitalize()}Action`;
        //
        //if (!this.hasOwnProperty(actionListenerName))
        //{
        //    log.trace("ext.onPopupMessage() listener of action <%s> not defined", msg.action);
        //    return;
        //}
        //
        //try {
        //    const isActive = (tabs.getActiveTab().id == this.id);
        //    log.trace("ext.onPopupMessage() calling action listener <%s>, is active tab <%o>", actionListenerName, isActive);
        //    this[actionListenerName].call(this, msg, isActive);
        //}
        //catch (e) { utils.errorHandler(e); }
    };

    _loglevel2.default.trace('ext.constructor()');
}

//канал для связи с popup'ом
;

exports.default = new ext();

},{"../../options_src/app/news":15,"../common/port":10,"./browserAction":2,"./notifications":5,"./storage":7,"./tabs":9,"loglevel":14}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _storage = require('./storage');

var _storage2 = _interopRequireDefault(_storage);

var _tabs = require('./tabs');

var _tabs2 = _interopRequireDefault(_tabs);

var _utils = require('../common/utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//подразумевается, что в один момент времени возможно только одно уведомление от расширения
var notifications = function () {
    //флаг находится ли уведомление в стадии подтверждения

    //идентификатор

    //таймер автозакрытия уведомления

    //список доступных кнопок и действий по их нажатию
    function notifications() {
        var _this = this;

        _classCallCheck(this, notifications);

        this.buttons = {
            //2 возможные кнопки в режиме музыки
            music: [{
                value: function value() {
                    return _storage2.default.get('dislike');
                },
                action: 'dislike',
                title: 'Не рекомендовать',
                icon: 'images/dontrecommend.svg',
                confirm: {
                    title: 'Вы уверены что хотите отметить трек как "Не рекомендовать"?',
                    icon: 'images/dontrec-notif.png',
                    option: 'mr_dislike_action'
                }
            }, {
                value: function value() {
                    return _storage2.default.get('addto');
                },
                action: 'like',
                title: ['Убрать из "Моей музыки"', 'Добавить в "Мою музыку"'],
                icon: ['images/like.svg', 'images/unlike.svg'],
                invParam: 'liked'
            }, {
                value: function value() {
                    return _storage2.default.get('next');
                },
                action: 'next',
                title: 'Следующий трек',
                icon: 'images/ya_next.svg'
            }],
            //3 возможные кнопки в режиме музыки-радио
            musicradio: [{
                value: function value() {
                    return _storage2.default.get('mr_dislike');
                },
                action: 'dislike',
                title: 'Не нравится',
                icon: 'images/radio_dislike.svg',
                confirm: {
                    title: 'Вы уверены что хотите отметить трек как "Не нравится"?',
                    icon: 'images/dislike-notif.png',
                    option: 'mr_dislike_action'
                }
            }, {
                value: function value() {
                    return _storage2.default.get('mr_addto');
                },
                action: 'like',
                title: ['Убрать из "Моей музыки"', 'Добавить в "Мою музыку"'],
                icon: ['images/like.svg', 'images/unlike.svg'],
                invParam: 'liked'
            }, {
                value: function value() {
                    return _storage2.default.get('mr_next');
                },
                action: 'next',
                title: 'Следующий трек',
                icon: 'images/ya_next.svg'
            }],
            //3 возможные кнопки в режиме радио
            radio: [{
                value: function value() {
                    return _storage2.default.get('radio_dislike');
                },
                action: 'dislike',
                title: 'Не нравится',
                icon: 'images/radio_dislike.svg',
                confirm: {
                    title: 'Вы уверены что хотите отметить трек как "Не нравится"?',
                    icon: 'images/dislike-notif.png',
                    option: 'radio_dislike_action'
                }
            }, {
                value: function value() {
                    return _storage2.default.get('radio_like');
                },
                action: 'like',
                title: ['Убрать отметку "Нравится"', 'Нравится'],
                icon: ['images/like.svg', 'images/radio_like.svg'],
                invParam: 'liked'
            }, {
                value: function value() {
                    return _storage2.default.get('radio_next');
                },
                action: 'next',
                title: 'Следующий трек',
                icon: 'images/ya_next.svg'
            }]
        };
        this.confirmButtons = [{ title: 'Да', confirm: true }, { title: 'Нет' }];
        this.confirmTimeout = 5000;
        this.notificationsGranted = false;
        this.autoCloseTimer = null;
        this.autoCloseTimerToast = null;
        this.id = null;
        this.toastId = null;
        this.isConfirm = false;
        this.playerMode = null;

        this.onClosed = function (id, byUser) {
            _loglevel2.default.debug('notifications.onClosed() with id <%s>, byUser <%o>', id, byUser);
            if (_this.id && id == _this.id) {
                clearTimeout(_this.autoCloseTimer);
                _this.id = null;
            }
            if (_this.toastId && id == _this.toastId) {
                clearTimeout(_this.autoCloseTimerToast);
                _this.toastId = null;
            }
        };

        this.clear = function (id) {
            _loglevel2.default.debug('notifications.clear()');
            return new Promise(function (resolve, reject) {
                if (!id) {
                    resolve();
                }
                //вызовет событие onClosed
                chrome.notifications.clear(id, function () {
                    return resolve();
                });
            });
        };

        this.createConfirmation = function (action, question, icon) {
            _loglevel2.default.debug('notifications.createConfirmation() with action <%s>, question <%s>, icon <%s>', action, question, icon);

            var tab = _tabs2.default.getActiveTab();

            clearTimeout(_this.autoCloseTimer);

            if (!tab) {
                _loglevel2.default.debug('notifications.createConfirmation() there is no active tabs');
                _this.clear(_this.id);
                return;
            }

            var btns = [];
            _this.confirmButtons.forEach(function (button) {
                btns.push({ title: button.title });
            });

            //убираем уведомление и далее создаем новое
            _this.clear(_this.id).then(function () {
                _this._createNotification(icon, question, btns, _this.autoCloseTimer, _this.confirmTimeout).then(function (id) {
                    _this.confirmAction = action;
                    _this.isConfirm = true;
                    _this.id = id;
                });
            });
        };

        this.onClicked = function (id) {
            _loglevel2.default.trace('notifications.onClicked() with id <%s>', id);
            if (!_tabs2.default.getActiveTab()) {
                _loglevel2.default.trace('notifications.onClicked() there is no active tabs');
            } else if (_storage2.default.get('focus')) //if (id.indexOf("confirm_") !== 0 && storage.get('focus'))
                {
                    _loglevel2.default.trace('notifications.onClicked() focusing window after click');
                    chrome.tabs.update(_tabs2.default.getActiveTab().id, { active: true });
                }
            _this.clear(id);
        };

        this.onButtonClicked = function (id, index) {
            _loglevel2.default.debug('notifications.onButtonClicked() with id <%s>, index <%d>', id, index);

            var tab = _tabs2.default.getActiveTab();
            if (!tab) {
                _loglevel2.default.debug('notifications.onButtonClicked() there is no active tabs');
                _this.clear(id);
                return;
            }

            clearTimeout(_this.autoCloseTimer);

            if (_this.isConfirm) {
                if (!_this.confirmButtons[index].confirm) {
                    _loglevel2.default.debug('notifications.onButtonClicked() confirm canceled');
                } else {
                    _loglevel2.default.debug('notifications.onButtonClicked() confirm approved');
                    tab.send({ action: _this.confirmAction });
                }
            } else {
                var button = _this.buttons[_this.playerMode].filter(function (item) {
                    return item.value();
                })[index];

                _loglevel2.default.debug('notifications.onButtonClicked() regular button click on button %o', button);

                if (button.confirm !== undefined && _storage2.default.get(button.confirm.option)) {
                    _loglevel2.default.debug('notifications.onButtonClicked() creating confirmation %o of action <%s>', button.confirm, button.action);
                    _this.createConfirmation(button.action, button.confirm.title, button.confirm.icon);
                } else {
                    _loglevel2.default.debug('notifications.onButtonClicked() sending action <%s> to active tab', button.action);
                    tab.send({ action: button.action });
                }
            }
            _this.clear(id);
        };

        _loglevel2.default.debug('notifications.constructor()');

        //проверка прав на уведомления
        chrome.notifications.getPermissionLevel(function (level) {
            if (level == 'granted') {
                _loglevel2.default.debug('notifications.constructor() notifications granted');
                _this.notificationsGranted = true;

                //слушатель кликов по уведомлению
                chrome.notifications.onClicked.addListener(_this.onClicked);
                //слушатель кликов по кнопкам уведомления
                chrome.notifications.onButtonClicked.addListener(_this.onButtonClicked);
                //слушатель закрытия уведомления
                chrome.notifications.onClosed.addListener(_this.onClosed);
            } else {
                _loglevel2.default.warn('notifications.constructor() notifications denied');
            }
        });

        this.create = this.create.bind(this);
    }
    //тип плеера

    //идентификатор

    //флаг разрешенных уведомлений


    _createClass(notifications, [{
        key: '_createNotification',
        value: function _createNotification(icon, msg) {
            var buttons = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
            var timerVar = arguments[3];

            var _this2 = this;

            var timer = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : _storage2.default.get('time') * 1000;
            var notifId = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : _utils2.default.guid();

            _loglevel2.default.debug('notifications._createNotification() with message <%s> and icon <%s>', msg, icon);
            return new Promise(function (resolve, reject) {
                if (!_this2.notificationsGranted) {
                    _loglevel2.default.debug('notifications._createNotification() notifications not granted');
                    resolve();
                }

                //создаем тело уведомления
                var options = {
                    title: msg,
                    iconUrl: icon,
                    type: 'basic',
                    message: ''
                };
                if (buttons && buttons.length) {
                    options.buttons = buttons;
                }
                _loglevel2.default.debug('notifications._createNotification() creating notification, options %o', options);
                chrome.notifications.create(notifId, options, function (id) {
                    //запускаем таймер актозакрытия по таймеру
                    timerVar = setTimeout(function () {
                        _this2.clear(id);
                    }, timer);

                    //возвращаем идентификатор
                    resolve(id);
                });
            });
        }
    }, {
        key: 'create',
        value: function create(player, playerMode) {
            var _this3 = this;

            _loglevel2.default.debug('notifications.create() with player %o and playerMode <%s>', player, playerMode);

            //убираем уведомление и далее создаем новое
            this.clear(this.id).then(function () {
                //создаем кнопки
                var btns = [];
                _this3.buttons[playerMode].filter(function (item) {
                    return item.value();
                }).forEach(function (item) {
                    btns.push({
                        title: !item.invParam ? item.title : item.title[~~!player.track[item.invParam]],
                        iconUrl: !item.invParam ? item.icon : item.icon[~~!player.track[item.invParam]]
                    });
                });

                _this3._createNotification(player.getCoverURL('80x80'), player.getArtists() + ' - ' + player.track.title + (_storage2.default.get('popup_show_version') && player.track.version ? ' (' + player.track.version + ')' : ''), btns, _this3.autoCloseTimer).then(function (id) {
                    _this3.playerMode = playerMode;
                    _this3.isConfirm = false;
                    _this3.id = id;
                });
            });
        }
    }, {
        key: 'createToast',
        value: function createToast(icon, msg) {
            var _this4 = this;

            _loglevel2.default.debug('notifications.createToast() with message <%s> and icon <%s>', msg, icon);

            //убираем уведомление и далее создаем новое
            this.clear(this.toastId).then(function () {
                _this4._createNotification(icon, msg, null, _this4.autoCloseTimerToast).then(function (id) {
                    _this4.toastId = id;
                });
            });
        }
    }]);

    return notifications;
}();

exports.default = new notifications();

},{"../common/utils":11,"./storage":7,"./tabs":9,"loglevel":14}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _jqueryExtend = require('jquery-extend');

var _jqueryExtend2 = _interopRequireDefault(_jqueryExtend);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var player = function player() {
    var _this = this;

    _classCallCheck(this, player);

    this.isPlaying = false;
    this.isAdvert = false;
    this.track = {
        album: null,
        artists: null,
        cover: null,
        disliked: null,
        liked: null,
        link: null,
        title: null,
        version: null
    };
    this.progress = {
        position: null,
        duration: null,
        loaded: null
    };
    this.source = {
        title: null,
        link: null,
        type: null,
        cover: null,
        owner: null
    };
    this.controls = {
        states: {
            dislike: null,
            index: null,
            like: null,
            next: null,
            prev: null,
            repeat: null,
            shuffle: null
        },
        shuffle: null,
        repeat: null,
        volume: null
    };
    this.playlist = {
        prev: null,
        list: null,
        index: null,
        next: null
    };

    this.getArtists = function () {
        _loglevel2.default.trace('player.getArtists()');
        return _this.track.artists ? _this.track.artists.map(function (i) {
            return i.title;
        }).join(', ') : null;
    };

    this.getCoverURL = function (size) {
        var ctx = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _this;

        _loglevel2.default.trace('player.getCoverURL() with size <%s>', size);

        var _cover = 'https://music.yandex.ru/blocks/playlist-cover-stack/playlist-cover_no_cover3.png';
        var cover = _cover;

        if (!ctx.track) {
            return _cover;
        }

        if (ctx.track.cover) {
            cover = ctx.track.cover;
        } else if (ctx.track.album && ctx.track.album.cover) {
            cover = ctx.track.album.cover;
        } else if (ctx.source.cover) {
            cover = ctx.source.cover;
        }

        if ((typeof cover === 'undefined' ? 'undefined' : _typeof(cover)) == 'object') {
            cover = cover.length ? cover[0] : _cover;
        }

        cover = cover.replace('%%', size);
        if (cover.indexOf('http') == -1) {
            cover = 'https://' + cover;
        }

        return cover;
    };

    this.update = function (data) {
        var deep = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        _loglevel2.default.trace('player.update() with data %o', data);
        if (deep) {
            (0, _jqueryExtend2.default)(deep, _this, data);
        } else {
            Object.keys(data).forEach(function (key) {
                _this[key] = data[key];
            });
        }
        _loglevel2.default.trace("player.update() updated player %o", _this);
    };
};

exports.default = player;

},{"jquery-extend":12,"loglevel":14}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _utils = require('../common/utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var storage = function storage() {
    var _this = this;

    _classCallCheck(this, storage);

    this.defaults = {
        addto: true,
        mr_addto: true,
        radio_like: true,
        dislike: false,
        mr_dislike: true,
        radio_dislike: true,
        next: true,
        mr_next: false,
        radio_next: false,
        focus: true,
        time: 4,
        type: 'hotk_tr',
        autoopen: true,
        hotkey_like_action: 'ask',
        hotkey_dislike_action: true,
        hotkey_repeat_notif: false,
        m_dislike_action: true,
        mr_dislike_action: true,
        radio_dislike_action: true,
        new_tab_pinned: false,
        global_mode: 'popup',
        popup_show_var: 'full',
        popup_show_version: true,
        popup_show_r_sh: true,
        popup_volume_click_toggle: '0',
        close_alert: true,
        scrobbling: false,
        scrobbling_filename: 'ymusic.txt',
        scrobbling_format: 'Сейчас играет: %artists% - %track%',
        user_id: function user_id() {
            return _utils2.default.guid();
        }
    };

    this.onStorageChange = function (e) {
        if (_this.onStorageChangeCb) {
            _this.onStorageChangeCb(e);
        }
    };

    this.onStorageChangeCb = function (request) {};

    this.addOnStorageChangeCb = function (cb) {
        _this.onStorageChangeCb = cb;
    };

    this.getAll = function () {
        var removePrefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

        var all = {};
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key.indexOf('store.settings') != -1) {
                all[removePrefix ? key.replace('store.settings.', '') : key] = JSON.parse(localStorage.getItem(key));
            }
        }
        return all;
    };

    this.get = function (key) {
        var value = localStorage.getItem('store.settings.' + key);
        return value === null ? _this.defaults[key] : JSON.parse(value);
    };

    this.set = function (key, value) {
        if (!_this.defaults.hasOwnProperty(key)) //this.defaults[key] === undefined)
            {
                return;
            }
        return localStorage.setItem('store.settings.' + key, JSON.stringify(value));
    };

    this.init = function () {
        Object.keys(_this.defaults).forEach(function (key) {
            if (localStorage.getItem('store.settings.' + key) === null) {
                _this.set(key, typeof _this.defaults[key] == 'function' ? _this.defaults[key]() : _this.defaults[key]);
            }
        });
    };

    this.clear = function () {
        localStorage.clear();
    };

    window.addEventListener('storage', this.onStorageChange);
};

exports.default = new storage();

},{"../common/utils":11}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _tabs = require('./tabs');

var _tabs2 = _interopRequireDefault(_tabs);

var _player = require('./player');

var _player2 = _interopRequireDefault(_player);

var _ext = require('../bg/ext');

var _ext2 = _interopRequireDefault(_ext);

var _browserAction = require('./browserAction');

var _browserAction2 = _interopRequireDefault(_browserAction);

var _notifications = require('./notifications');

var _notifications2 = _interopRequireDefault(_notifications);

var _storage = require('./storage');

var _storage2 = _interopRequireDefault(_storage);

var _utils = require('../common/utils');

var _utils2 = _interopRequireDefault(_utils);

var _downloader = require('./downloader');

var _downloader2 = _interopRequireDefault(_downloader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};
Object.prototype.filter = function (predicate) {
    var result = {};
    for (var key in this) {
        if (this.hasOwnProperty(key) && predicate(this[key])) {
            result[key] = this[key];
        }
    }
    return result;
};

var tab =
//плеер

//тип вкладки: радио или музыка

//идентификатор
function tab(tabId, tabType) {
    var _this = this;

    _classCallCheck(this, tab);

    this.timer = null;
    this.id = null;
    this.focused = false;
    this.type = null;
    this.openedTime = null;
    this.player = null;
    this.csConnection = null;

    this.aliveCheck = function () {
        _loglevel2.default.trace('tab.aliveCheck()');

        chrome.tabs.get(_this.id, function (tab) {
            if (chrome.runtime.lastError) {
                _loglevel2.default.trace('tab', _this.id, 'removed due it\'s unavailability');
                _loglevel2.default.error('Tab closed via it\'s unavailability while alive check');
                //вкладка не найдена, удаляем вкладку (таймер будет очищен в методе shutdown)
                _tabs2.default.shutdown(_this.id);
            } else {
                //TODO: надо добавить некую дополнительную логику проверки вкладки на живучесть js
            }
        });
    };

    this.addPort = function (port) {
        _loglevel2.default.trace('tab.addPort() with port %o', port);
        _this.csConnection = port;
        _this.csConnection.onMessage.addListener(_this.onMessage);
        _this.csConnection.onDisconnect.addListener(_this.onDisconnect);
    };

    this.onDisconnect = function () {
        _loglevel2.default.trace('tab.onDisconnect()');
        //до рефакторинга возникала проблема когда при изменении урла страницы не происходит событие onunload и это
        //приводит к ошибке, но зато происходит событие onDisconnect у порта, поэтому дублируем функционал закрытия
        //вкладки
        _loglevel2.default.error('Tab closed via cs port disconnected');
        _tabs2.default.shutdown(_this.id);
        //this.csConnection = null;
    };

    this.onMessage = function (msg, port) {
        _loglevel2.default.trace('tab.onMessage() with message %o from port %o', msg, port);

        if (!msg.action) {
            _loglevel2.default.trace('tab.onMessage() invalid message');
            return;
        }
        var actionListenerName = 'on' + msg.action.capitalize() + 'Action';

        if (!_this.hasOwnProperty(actionListenerName)) {
            _loglevel2.default.trace('tab.onMessage() listener of action <%s> not defined', msg.action);
            return;
        }

        try {
            var isActive = _tabs2.default.getActiveTab().id == _this.id;
            _loglevel2.default.trace('tab.onMessage() calling action listener <%s>, is active tab <%o>', actionListenerName, isActive);
            _this[actionListenerName].call(_this, msg, isActive);
        } catch (e) {
            _utils2.default.errorHandler(e);
        }
    };

    this.send = function (data) {
        _loglevel2.default.trace('tab.send() with data %o', data);
        if (_this.csConnection) {
            try {
                _this.csConnection.postMessage(data);
            } catch (e) {
                _loglevel2.default.error('tab.send() error', e);
                _this.csConnection = null;
            }
        }
    };

    this.onFullstateAction = function (msg, isActive) {
        _loglevel2.default.trace('tab.onFullstate() with message %o, is active tab %o', msg, isActive);

        _storage2.default.set('user_id', msg.user.uid ? msg.user.uid : msg.user.did);

        _this.player.update({
            'track': msg.track,
            'progress': msg.progress,
            'source': msg.source,
            'controls': msg.controls,
            'playlist': msg.playlist,
            'isPlaying': msg.isPlaying
        });
        if (isActive) {
            //обновляем иконку на панели браузера
            _browserAction2.default.update();

            if (_ext2.default.popupConnection) {
                //old
                _ext2.default.popupConnection.send(['track', 'progress', 'source', 'controls', 'playlist', 'isPlaying']);
                //new
                _ext2.default.popupConnection.send({ action: 'track', payload: msg.track });
                _ext2.default.popupConnection.send({ action: 'progress', payload: msg.progress });
                _ext2.default.popupConnection.send({ action: 'source', payload: _extends({}, msg.source, { tabType: _this.type }) });
                _ext2.default.popupConnection.send({ action: 'controls', payload: msg.controls });
                _ext2.default.popupConnection.send({ action: 'playlist', payload: msg.playlist });
                _ext2.default.popupConnection.send({ action: 'isPlaying', payload: msg.isPlaying });
                //этот параметр мы храним в состоянии фоновой страницы, т.к. контент-страница не имеет метода,
                //возвращающего флаг реклама сейчас или нет и обновляется только через onAdvertAction, полученного
                //от контент-страницы.
                _ext2.default.popupConnection.send({ action: 'advert', payload: _this.player.isAdvert });
                _loglevel2.default.trace('tab.onFullstate() event sent to popup');
            }
        }
    };

    this.onStateAction = function (msg, isActive) {
        _loglevel2.default.trace('tab.onState() with message %o, is active tab %o', msg, isActive);
        _this.player.update({ 'isPlaying': msg.isPlaying });
        if (isActive) {
            //обновляем иконку на панели браузера
            _browserAction2.default.update();

            if (_ext2.default.popupConnection) {
                //old
                _ext2.default.popupConnection.send(['isPlaying']);
                //new
                _ext2.default.popupConnection.send({ action: 'isPlaying', payload: msg.isPlaying });
                _loglevel2.default.trace('tab.onState() event sent to popup');
            }
        }
    };

    this.onShutdownAction = function (msg, isActive) {
        _loglevel2.default.trace('tab.onShutdown() with message %o, is active tab %o', msg, isActive);
        _loglevel2.default.error('Tab closed via cs shutdown action');
        _tabs2.default.shutdown(_this.id);
    };

    this.onFocusAction = function (msg, isActive) {
        _loglevel2.default.trace('tab.onFocus() with message %o, is active tab %o', msg, isActive);
        _this.focused = true;
    };

    this.onBlurAction = function (msg, isActive) {
        _loglevel2.default.trace('tab.onBlur() with message %o, is active tab %o', msg, isActive);
        _this.focused = false;
    };

    this.onVolumeAction = function (msg, isActive) {
        _loglevel2.default.trace('tab.onVolume() with message %o, is active tab %o', msg, isActive);
        _this.player.update({ 'controls': { volume: msg.volume } }, true);
        if (isActive && _ext2.default.popupConnection) {
            //old
            _ext2.default.popupConnection.send(['controls']);
            //new
            _ext2.default.popupConnection.send({ action: 'volume', payload: msg.volume });
            _loglevel2.default.trace('tab.onVolume() event sent to popup');
        }
    };

    this.onAdvertAction = function (msg, isActive) {
        _loglevel2.default.trace('tab.onAdvertAction() with message %o, is active tab %o', msg, isActive);
        _this.player.update({ 'isAdvert': msg.state });
        if (isActive && _ext2.default.popupConnection) {
            _ext2.default.popupConnection.send({ action: 'advert', payload: msg.state });
            _loglevel2.default.trace('tab.onAdvertAction() event sent to popup');
        }
    };

    this.onProgressAction = function (msg, isActive) {
        _loglevel2.default.trace('tab.onProgress() with message %o, is active tab %o', msg, isActive);
        _this.player.update({ 'progress': msg.progress });
        if (isActive && _ext2.default.popupConnection) {
            //old
            _ext2.default.popupConnection.send(['progress']);
            //new
            _ext2.default.popupConnection.send({ action: 'progress', payload: msg.progress });
            _loglevel2.default.trace('tab.onProgress() event sent to popup');
        }
    };

    this.onTrackslistAction = function (msg, isActive) {
        _loglevel2.default.trace('tab.onTrackslist() with message %o, is active tab %o', msg, isActive);

        //плейлист очищен
        if (msg.playlist.list.length == 0) {
            _loglevel2.default.trace('tab.onTrackslist() playlist cleared, clearing player');
            //при очистке плеера сохраняем значение громкости
            var curVolume = _this.player.controls.volume;
            _this.player = new _player2.default();
            _this.player.update({ 'controls': { volume: curVolume } }, true);
            if (isActive && _ext2.default.popupConnection) {
                //old
                _ext2.default.popupConnection.send(['track', 'progress', 'source', 'controls', 'playlist', 'isPlaying']);
                //new
                _ext2.default.popupConnection.send({ action: 'track', payload: msg.track });
                _ext2.default.popupConnection.send({ action: 'progress', payload: msg.progress });
                _ext2.default.popupConnection.send({ action: 'source', payload: _extends({}, msg.source, { tabType: _this.type }) });
                _ext2.default.popupConnection.send({ action: 'controls', payload: msg.controls });
                _ext2.default.popupConnection.send({ action: 'playlist', payload: msg.playlist });
                _ext2.default.popupConnection.send({ action: 'isPlaying', payload: msg.isPlaying });
                _loglevel2.default.trace('tab.onTrackslist() all events sent to popup');
            }
            //обновляем иконку на панели браузера
            _browserAction2.default.update();
        }
        //обновление плейлиста
        else {
                _this.player.update({ 'playlist': msg.playlist });
                if (isActive && _ext2.default.popupConnection) {
                    //old
                    _ext2.default.popupConnection.send(['playlist']);
                    //new
                    _ext2.default.popupConnection.send({ action: 'playlist', payload: msg.playlist });
                    _loglevel2.default.trace('tab.onTrackslist() event sent to popup');
                }
            }
    };

    this.onControlsAction = function (msg, isActive) {
        _loglevel2.default.trace('tab.onControls() with message %o, is active tab %o', msg, isActive);
        _this.player.update({ 'controls': msg.controls });
        if (isActive && _ext2.default.popupConnection) {
            //old
            _ext2.default.popupConnection.send(['controls']);
            //new
            _ext2.default.popupConnection.send({ action: 'controls', payload: msg.controls });
            _loglevel2.default.trace('tab.onControls() event sent to popup');
        }
    };

    this.onTrackAction = function (msg, isActive) {
        _loglevel2.default.trace('tab.onTrack() with message %o, is active tab %o', msg, isActive, _this.player);
        var isInitial = _this.player === null;

        _this.player.update({
            'track': msg.track,
            'progress': msg.progress,
            'source': msg.source
        });
        if (isActive && _ext2.default.popupConnection) {
            //old
            _ext2.default.popupConnection.send(['track', 'progress', 'source']);
            //new
            _ext2.default.popupConnection.send({ action: 'track', payload: msg.track });
            _ext2.default.popupConnection.send({ action: 'progress', payload: msg.progress });
            _ext2.default.popupConnection.send({ action: 'source', payload: msg.source });
            _loglevel2.default.trace('tab.onTrack() event sent to popup');
        }
        if (!isActive) {
            _loglevel2.default.trace('tab.onTrack() tab is not active, don\'t create notification');
            return;
        }

        var scrobbling = _storage2.default.get('scrobbling');
        var scrobblingFilename = _storage2.default.get('scrobbling_filename');
        var scrobblingFormat = _storage2.default.get('scrobbling_format');
        if (scrobbling && !isInitial) {
            var text = scrobblingFormat.replace('%artists%', _this.player.getArtists()).replace('%track%', _this.player.track.title).replace('%album%', _this.player.track.album.title).replace('%albumYear%', _this.player.track.album.year).replace('%version%', _this.player.track.version || '');
            _downloader2.default.download(scrobblingFilename, text);
        }

        var type = _storage2.default.get('type'); //режим показа уведомлений

        if (type == 'none' || type == 'hotk') {
            _loglevel2.default.trace('tab.onTrack() don\'t create notification due settings');
            return false;
        }
        if (isInitial) {
            _loglevel2.default.debug('tab.onTrack() don\'t create notification on initial');
            return;
        }
        if (msg.secondary) {
            _loglevel2.default.trace('tab.onTrack() don\'t create notification due secondary action');
            return false;
        }
        //если открыт попап или фокус на текущей вкладке плеера - не показываем нотификацю
        if (chrome.extension.getViews({ type: 'popup' }).length > 0 || _tabs2.default.getActiveTab().focused) {
            _loglevel2.default.trace('tab.onTrack() don\'t create notification due focused or popup opened');
            return false;
        }

        _loglevel2.default.trace('tab.onTrack() creating notification');
        var buttonsType = _this.type;
        if (_this.type == 'music' && _this.player.source.type == 'radio') {
            buttonsType += 'radio';
        }
        _notifications2.default.create(_this.player, buttonsType);
    };

    this.onInfoAction = function (msg, isActive) {
        _loglevel2.default.trace('tab.onInfo() with message %o, is active tab %o', msg, isActive);

        if (!msg.track) {
            _loglevel2.default.trace('tab.onInfo() empty data');
            return;
        }
        if (!isActive) {
            _loglevel2.default.trace('tab.onInfo() tab is not active, don\'t create notification');
            return;
        }

        var type = _storage2.default.get('type'); //режим показа уведомлений

        if (type == 'none' || type == 'tr') {
            _loglevel2.default.trace('tab.onInfo() don\'t create notification due settings');
            return false;
        }

        _loglevel2.default.trace('tab.onTrack() creating notification');
        var buttonsType = _this.type;
        if (_this.type == 'music' && _this.player.source.type == 'radio') {
            buttonsType += 'radio';
        }
        _notifications2.default.create(_this.player, buttonsType);
    };

    _loglevel2.default.trace('tab.constructor() with id <%d> and type <%s>', tabId, tabType);

    this.id = tabId;
    this.openedTime = new Date().getTime();
    this.type = tabType;
    //раз в секунду проверяем жива ли вкладка
    this.timer = setInterval(this.aliveCheck, 1000);
    //инициализируем плеер
    this.player = new _player2.default();
}
//порт для связи с CS скриптом на странице вкладки

//время создания вкладки

//есть ли фокус на вкладке

//таймер мониторящий живучесть вкладки
;

exports.default = tab;

},{"../bg/ext":4,"../common/utils":11,"./browserAction":2,"./downloader":3,"./notifications":5,"./player":6,"./storage":7,"./tabs":9,"loglevel":14}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _utils = require('../common/utils');

var _utils2 = _interopRequireDefault(_utils);

var _tab = require('./tab');

var _tab2 = _interopRequireDefault(_tab);

var _browserAction = require('./browserAction');

var _browserAction2 = _interopRequireDefault(_browserAction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var tabs = function tabs() {
    var _this = this;

    _classCallCheck(this, tabs);

    this.list = {};

    this.addTabsListeners = function () {
        _loglevel2.default.trace('tabs.addTabsListeners()');
        //событие обновления вкладки
        chrome.tabs.onUpdated.addListener(_this.onUpdated);
        //событие закрытия вкладки
        chrome.tabs.onRemoved.addListener(_this.onRemoved);
    };

    this.onRemoved = function (tabId, removeInfo) {
        _loglevel2.default.trace('tabs.onRemoved() on tab <%d>, removeInfo %o', tabId, removeInfo);
        try {
            if (_this.getById(tabId)) {
                _loglevel2.default.trace('tabs.onRemoved() removing tab from list');
                _loglevel2.default.error('Tab closed via tabs onRemoved event');
                _this.shutdown(tabId);
            }
        } catch (e) {
            _utils2.default.errorHandler(e);
        }
    };

    this.onUpdated = function (tabId, changeInfo, tab) {
        _loglevel2.default.trace('tabs.onUpdated() on tab <%d>, changeInfo %o, tab %o', tabId, changeInfo, tab);

        if (!('status' in changeInfo || 'url' in changeInfo)) {
            _loglevel2.default.trace('onUpdated() not interested change event', changeInfo);
            return;
        }

        //проверяем совпадение URL'а
        var URL = _utils2.default.isUrlMatch(tab.url);
        _loglevel2.default.trace('tabs.onUpdated() URL', URL);
        if (changeInfo.status != 'complete') {
            _loglevel2.default.trace('tabs.onUpdated() URL loading is not completed');
            return;
        }
        if (URL === false) {
            if (_this.getById(tabId)) {
                _loglevel2.default.error('tabs.onUpdated() URL changed to non-matched, removing it from list');
                _loglevel2.default.error('Tab closed via URL changed to non-matched while tabs onUpdated event');
                _this.shutdown(tabId);
            }
            return;
        }

        //новая вкладка, добавляем в список
        if (!_this.getById(tabId)) {
            _loglevel2.default.trace('tabs.onUpdated() tab URL valid and not found in list, adding');
            //добавляем вкладку в список
            _this.add(tabId, URL.isMusic ? 'music' : 'radio');
            //делаем инъекцию
            _utils2.default.injectScript(tabId, 'extension/cs.js');
            //обновляем иконку на панели браузера
            _browserAction2.default.update();
        }
    };

    this.shutdown = function (tabId) {
        _loglevel2.default.trace('tabs.shutdown() on <%d>', tabId);
        //если закрываем текущую вкладку, закрываем попап
        if (_this.getActiveTab().id == tabId) {
            _loglevel2.default.trace('tabs.shutdown() closing popup');
            _browserAction2.default.closePopup();
        }

        //удаляем вкладку
        if (_this.list[tabId]) {
            _loglevel2.default.trace('tabs.shutdown() closing tab');
            //перед удалением очищаем таймер вкладки, который мониторил ее живучесть
            clearInterval(_this.list[tabId].timer);
            //удаляем
            delete _this.list[tabId];
        }

        //обновляем иконку на панели браузера
        _browserAction2.default.update();
    };

    this.getById = function (tabId) {
        _loglevel2.default.trace('tabs.getById() on <%d>', tabId);

        _loglevel2.default.trace('tabs.getById() returns %o', _this.list[tabId]);
        return _this.list[tabId]; //tab or undefined
    };

    this.getActiveTab = function () {
        _loglevel2.default.trace('tabs.getActiveTab() from list %o', _this.list);

        if (_this.count() == 1) {
            _loglevel2.default.trace('tabs.getActiveTab() returns %o', _this.list[Object.keys(_this.list)[0]]);
            return _this.list[Object.keys(_this.list)[0]];
        }

        //активной считается первая (по времени) открытая вкладка из списка
        var sortedByTime = Array.prototype.sort.call(_this.list, function (a, b) {
            if (a.openedTime < b.openedTime) return -1;
            if (a.openedTime > b.openedTime) return 1;
            return 0;
        });

        var result = Object.keys(sortedByTime).length ? sortedByTime[Object.keys(sortedByTime)[0]] : false;
        _loglevel2.default.trace('tabs.getActiveTab() returns %o', result);
        return result;
    };

    this.add = function (tabId, tabType) {
        _loglevel2.default.trace('tabs.addTab() on <%d> with type <%s>', tabId, tabType);

        _this.list[tabId] = new _tab2.default(tabId, tabType);
    };

    this.update = function (tabId, key, value) {
        _loglevel2.default.trace('tabs.update() on <%d> with data %s => %o', tabId, key, value);

        if (!_this.list[tabId] || !_this.list[tabId].hasOwnProperty(key)) {
            _loglevel2.default.trace('tabs.update() not updated');
            return false;
        }

        _this.list[tabId][key] = value;
        _loglevel2.default.trace('tabs.update() updated');
    };

    this.count = function () {
        _loglevel2.default.trace('tabs.count() returns <%d>', Object.keys(_this.list).length);
        return Object.keys(_this.list).length;
    };

    _loglevel2.default.trace('tabs.constructor()');

    //добавляем слушатель на изменения URL'ов вкладок
    this.addTabsListeners();
}

//добавляем слушатель на изменения URL'ов вкладок


//В CS на страницу вешается обработчик события onbeforeunload, который перед закрытием окна присылает сообщение
//расширению и соответствующей вкладке делается shutdown. Сам сервис является SPA и при навигации это событие не
//срабатывает, тем самым, не нужно следить куда уже заинжектили код, а куда нет. Также о закрытии окна может
//потенециально сообщить событие onDisconnect у порта, через который идет обмен сообщениями.
;

exports.default = new tabs();

},{"../common/utils":11,"./browserAction":2,"./tab":8,"loglevel":14}],10:[function(require,module,exports){
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

},{"loglevel":14}],11:[function(require,module,exports){
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

},{"loglevel":14}],12:[function(require,module,exports){
module.exports = require("./lib/jquery").extend;

},{"./lib/jquery":13}],13:[function(require,module,exports){
/*!
 * (extracted from)
 * jQuery JavaScript Library v2.0.3
 * http://jquery.com/
 *
 * Copyright 2005, 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2013-07-03T13:30Z
 */
var class2type = {
  "[object Boolean]":   "boolean",
  "[object Number]":    "number",
  "[object String]":    "string",
  "[object Function]":  "function",
  "[object Array]":     "array",
  "[object Date]":      "date",
  "[object RegExp]":    "regexp",
  "[object Object]":    "object",
  "[object Error]":     "error"
};

var core_toString = class2type.toString,
    core_hasOwn   = class2type.hasOwnProperty;

var jQuery = module.exports = {};

jQuery.isFunction = function( obj ) {
  return jQuery.type(obj) === "function";
};

jQuery.isArray = Array.isArray;

jQuery.isWindow = function( obj ) {
  return obj != null && obj === obj.window;
};

jQuery.type = function( obj ) {
  if ( obj == null ) {
    return String( obj );
  }
  return typeof obj === "object" || typeof obj === "function" ?
    class2type[ core_toString.call(obj) ] || "object" :
    typeof obj;
};

jQuery.isPlainObject = function( obj ) {
  if ( jQuery.type( obj ) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
    return false;
  }

  try {
    if ( obj.constructor && !core_hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
      return false;
    }
  } catch ( e ) {
    return false;
  }

  return true;
};

jQuery.extend = function() {
  var options,
      name,
      src,
      copy,
      copyIsArray,
      clone,
      target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false;

  if ( typeof target === "boolean" ) {
    deep = target;
    target = arguments[1] || {};
    i = 2;
  }

  if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
    target = {};
  }

  if ( length === i ) {
    target = this;
    --i;
  }

  for ( ; i < length; i++ ) {
    if ( (options = arguments[ i ]) != null ) {
      for ( name in options ) {
        src = target[ name ];
        copy = options[ name ];

        if ( target === copy ) {
          continue;
        }

        if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
          if ( copyIsArray ) {
            copyIsArray = false;
            clone = src && jQuery.isArray(src) ? src : [];

          } else {
            clone = src && jQuery.isPlainObject(src) ? src : {};
          }

          target[ name ] = jQuery.extend( deep, clone, copy );

        } else if ( copy !== undefined ) {
          target[ name ] = copy;
        }
      }
    }
  }

  return target;
};

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var news = {
    '1.7.13': {
        date: '05 августа 2020',
        text: 'Разрешения на запись в файл (для стримеров) вынесены в необязательные'
    },
    '1.7.11': {
        date: '05 октября 2018',
        text: 'Добавлена обязательный опрос про новую функцию.',
        urgent: true
    },
    '1.7.8': {
        date: '16 сентября 2018',
        text: 'Добавлена новая функция трансляции информации о текущем треке в файл, доступно в разделе "Уведомления" > "Трансляция". Для данной функции потребовались новые разрешения "Управление скачанными файлами", о чем написано в разделе "Помощь".'
    },
    '1.7.6': {
        date: '16 апреля 2018',
        text: 'Внимание! В Google Chrome версии 65 какой-то баг с горячими клавишами, их не получается переключить в режим "Глобально", даже если значение устанавливается, в реальности кнопки не работают вне окна браузера! Пока это не исправят, силами расширения это не починить...',
        high: true
    },
    '1.7.4': {
        date: '14 июля 2017',
        text: 'Добавил горячие клавиши для перемотки вперед назад на 10сек.'
    },
    '1.7.3': {
        date: '26 октября 2016',
        text: 'Добавил поддержку высоких разрешений экранов, но высота всплывающего окна не может быть больше 600 - это ограничение браузера!'
    },
    '1.7.1': {
        date: '16 сентября 2016',
        text: 'Полный рефакторинг окна с управлением плеером, доработка поддержки рекламы, которой, к сожалению, на сайте на бесплатном аккаунте стало очень много.'
    },
    '1.7.0': {
        date: '16 сентября 2016',
        text: 'Лето прошло, наконец я вернулся к доработкам расширения. Официальный плагин от Я.Музыки не показал тех показателей количества пользователей, которые я печально предполагал и это даже не смотря на рекламу прямо на витрине. Так что обновления еще будут! Помню и про туду-лист в отзывах ;)'
    },
    '1.6.15': {
        date: '24 мая 2016',
        text: 'Добавил возможность отключения подтверждения при открытии вкладки с Я.Музыкой во время проигрывания. Можно выключить в Настройки > Общее > Прочее'
    },
    '1.6.14': {
        date: '21 апреля 2016',
        text: 'Добавил поддержку кнопки "Не рекомендовать" в уведомления и горячие клавиши. Также были исправлены некоторые ошибки, возникшие из-за нового релиза Я.Музыки.'
    },
    '1.6.11': {
        date: '08 апреля 2016',
        text: 'Добавил возможность в настройках в разделе "Горячие клавиши" включить уведомление об изменении режима повтора.'
    }
};

exports.default = news;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleHRlbnNpb25fc3JjL2JnLmpzIiwiZXh0ZW5zaW9uX3NyYy9iZy9icm93c2VyQWN0aW9uLmpzIiwiZXh0ZW5zaW9uX3NyYy9iZy9kb3dubG9hZGVyLmpzIiwiZXh0ZW5zaW9uX3NyYy9iZy9leHQuanMiLCJleHRlbnNpb25fc3JjL2JnL25vdGlmaWNhdGlvbnMuanMiLCJleHRlbnNpb25fc3JjL2JnL3BsYXllci5qcyIsImV4dGVuc2lvbl9zcmMvYmcvc3RvcmFnZS5qcyIsImV4dGVuc2lvbl9zcmMvYmcvdGFiLmpzIiwiZXh0ZW5zaW9uX3NyYy9iZy90YWJzLmpzIiwiZXh0ZW5zaW9uX3NyYy9jb21tb24vcG9ydC5qcyIsImV4dGVuc2lvbl9zcmMvY29tbW9uL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL2pxdWVyeS1leHRlbmQvZXh0ZW5kLmpzIiwibm9kZV9tb2R1bGVzL2pxdWVyeS1leHRlbmQvbGliL2pxdWVyeS5qcyIsIm5vZGVfbW9kdWxlcy9sb2dsZXZlbC9saWIvbG9nbGV2ZWwuanMiLCJvcHRpb25zX3NyYy9hcHAvbmV3cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBR0E7Ozs7OztBQUVBLG1CQUFJLFFBQUosQ0FBYSxNQUFiLEUsQ0FBc0I7QUFDdEI7QUFDQTs7O0FBTEE7QUFNQSxPQUFPLElBQVA7O0FBRUE7QUFDQSxDQUFDLFVBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxDQUFmLEVBQWtCLENBQWxCLEVBQXFCLENBQXJCLEVBQXdCLENBQXhCLEVBQTJCLENBQTNCLEVBQThCO0FBQzNCLE1BQUUsdUJBQUYsSUFBNkIsQ0FBN0I7QUFDQSxNQUFFLENBQUYsSUFBTyxFQUFFLENBQUYsS0FBUSxZQUFXO0FBQUMsU0FBQyxFQUFFLENBQUYsRUFBSyxDQUFMLEdBQVMsRUFBRSxDQUFGLEVBQUssQ0FBTCxJQUFV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REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7QUMxUEEsSUFBSSxPQUFPO0FBQ1AsY0FBVTtBQUNOLGNBQU0saUJBREE7QUFFTixjQUFNO0FBRkEsS0FESDtBQUtQLGNBQVU7QUFDTixjQUFNLGlCQURBO0FBRU4sY0FBTSxpREFGQTtBQUdOLGdCQUFRO0FBSEYsS0FMSDtBQVVQLGFBQVM7QUFDTCxjQUFNLGtCQUREO0FBRUwsY0FBTTtBQUZELEtBVkY7QUFjUCxhQUFTO0FBQ0wsY0FBTSxnQkFERDtBQUVMLGNBQU0sNFFBRkQ7QUFHTCxjQUFNO0FBSEQsS0FkRjtBQW1CUCxhQUFTO0FBQ0wsY0FBTSxjQUREO0FBRUwsY0FBTTtBQUZELEtBbkJGO0FBdUJQLGFBQVM7QUFDTCxjQUFNLGlCQUREO0FBRUwsY0FBTTtBQUZELEtBdkJGO0FBMkJQLGFBQVM7QUFDTCxjQUFNLGtCQUREO0FBRUwsY0FBTTtBQUZELEtBM0JGO0FBK0JQLGFBQVM7QUFDTCxjQUFNLGtCQUREO0FBRUwsY0FBTTtBQUZELEtBL0JGO0FBbUNQLGNBQVU7QUFDTixjQUFNLGFBREE7QUFFTixjQUFNO0FBRkEsS0FuQ0g7QUF1Q1AsY0FBVTtBQUNOLGNBQU0sZ0JBREE7QUFFTixjQUFNO0FBRkEsS0F2Q0g7QUEyQ1AsY0FBVTtBQUNOLGNBQU0sZ0JBREE7QUFFTixjQUFNO0FBRkE7QUEzQ0gsQ0FBWDs7a0JBaURlLEkiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQgbG9nIGZyb20gJ2xvZ2xldmVsJztcclxuaW1wb3J0IHV0aWxzIGZyb20gJy4vY29tbW9uL3V0aWxzJztcclxuaW1wb3J0IGV4dCBmcm9tICcuL2JnL2V4dCc7XHJcblxyXG4vL1RPRE86INCy0YDQtdC80LXQvdC90L7QtSDRgNC10YjQtdC90LjQtSDQtNC70Y8gcG9wdXAn0LAsINCyINC40LTQtdCw0LvQtSDQvdCw0LTQviDRh9C10YDQtdC3IHBvcnQg0LPQvtC90Y/RgtGMINCy0YHRjiDQuNC90YTRg1xyXG5pbXBvcnQgdGFicyBmcm9tICcuL2JnL3RhYnMnO1xyXG5cclxubG9nLnNldExldmVsKCdJTkZPJyk7IC8vXCJUUkFDRVwiID4gXCJERUJVR1wiID4gXCJJTkZPXCIgPiBcIldBUk5cIiA+IFwiRVJST1JcIiA+IFwiU0lMRU5UXCJcclxuLy9mb3IgZGVidWc6XHJcbi8vd2luZG93LmxvZ2dlciA9IGxvZztcclxud2luZG93LnRhYnMgPSB0YWJzO1xyXG5cclxuLyoqKiBHQSAqKiovXHJcbihmdW5jdGlvbihpLCBzLCBvLCBnLCByLCBhLCBtKSB7XHJcbiAgICBpWydHb29nbGVBbmFseXRpY3NPYmplY3QnXSA9IHI7XHJcbiAgICBpW3JdID0gaVtyXSB8fCBmdW5jdGlvbigpIHsoaVtyXS5xID0gaVtyXS5xIHx8IFtdKS5wdXNoKGFyZ3VtZW50cyk7fSwgaVtyXS5sID0gMSAqIG5ldyBEYXRlKCk7XHJcbiAgICBhID0gcy5jcmVhdGVFbGVtZW50KG8pLCBtID0gcy5nZXRFbGVtZW50c0J5VGFnTmFtZShvKVswXTtcclxuICAgIGEuYXN5bmMgPSAxO1xyXG4gICAgYS5zcmMgPSBnO1xyXG4gICAgbS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShhLCBtKTtcclxufSkod2luZG93LCBkb2N1bWVudCwgJ3NjcmlwdCcsICdodHRwczovL3NzbC5nb29nbGUtYW5hbHl0aWNzLmNvbS9hbmFseXRpY3MuanMnLCAnZ2EnKTtcclxuZ2EoJ2NyZWF0ZScsICdVQS01NjkyNzc2MC0xJyk7XHJcbmdhKCdzZXQnLCAnY2hlY2tQcm90b2NvbFRhc2snLCBmdW5jdGlvbigpIHt9KTtcclxuLyoqKiBHQSBlbmRzICoqKi9cclxuXHJcbnRyeSB7IGV4dC5pbml0KCk7IH0gY2F0Y2ggKGUpIHsgdXRpbHMuZXJyb3JIYW5kbGVyKGUpOyB9XHJcbiIsImltcG9ydCBsb2cgZnJvbSAnbG9nbGV2ZWwnO1xyXG5pbXBvcnQgc3RvcmFnZSBmcm9tICcuL3N0b3JhZ2UnO1xyXG5pbXBvcnQgdGFicyBmcm9tICcuL3RhYnMnO1xyXG5cclxuY29uc3QgRE9VQkxFX0NMSUNLX1RJTUUgPSAyNTA7XHJcblxyXG5jbGFzcyBicm93c2VyQWN0aW9uIHtcclxuICAgIHRpdGxlcyA9IHtcclxuICAgICAgICBuYTogJ9Cj0L/RgNCw0LLQu9C10L3QuNC1INCv0L3QtNC10LrRgS7QnNGD0LfRi9C60L7QuS/QoNCw0LTQuNC+OiDQvdC10LTQvtGB0YLRg9C/0L3Qviwg0L3QtdGCINC+0YLQutGA0YvRgtGL0YUg0LLQutC70LDQtNC+0LonLFxyXG4gICAgICAgIG11c2ljUGxheTogJ9Cj0L/RgNCw0LLQu9C10L3QuNC1INCv0L3QtNC10LrRgS7QnNGD0LfRi9C60L7QuTog0LjQs9GA0LDQtdGCJyxcclxuICAgICAgICByYWRpb1BsYXk6ICfQo9C/0YDQsNCy0LvQtdC90LjQtSDQr9C90LTQtdC60YEu0KDQsNC00LjQvjog0LjQs9GA0LDQtdGCJyxcclxuICAgICAgICBtdXNpY1BhdXNlOiAn0KPQv9GA0LDQstC70LXQvdC40LUg0K/QvdC00LXQutGBLtCc0YPQt9GL0LrQvtC5OiDQv9Cw0YPQt9CwJyxcclxuICAgICAgICByYWRpb1BhdXNlOiAn0KPQv9GA0LDQstC70LXQvdC40LUg0K/QvdC00LXQutGBLtCg0LDQtNC40L46INC/0LDRg9C30LAnLFxyXG4gICAgICAgIG11c2ljV2FpdDogJ9Cj0L/RgNCw0LLQu9C10L3QuNC1INCv0L3QtNC10LrRgS7QnNGD0LfRi9C60L7QuTog0LIg0L7QttC40LTQsNC90LjQuCcsXHJcbiAgICAgICAgcmFkaW9XYWl0OiAn0KPQv9GA0LDQstC70LXQvdC40LUg0K/QvdC00LXQutGBLtCg0LDQtNC40L46INCyINC+0LbQuNC00LDQvdC40LgnLFxyXG4gICAgfTtcclxuICAgIGljb25zID0ge1xyXG4gICAgICAgIG5hOiAnaW1hZ2VzL2ljb25fMzhfMl9uYS5wbmcnLFxyXG4gICAgICAgIG11c2ljUGxheTogJ2ltYWdlcy9pY29uXzM4XzJfcGxheS5wbmcnLFxyXG4gICAgICAgIHJhZGlvUGxheTogJ2ltYWdlcy9pY29uXzM4XzJfcGxheS5wbmcnLFxyXG4gICAgICAgIG11c2ljUGF1c2U6ICdpbWFnZXMvaWNvbl8zOF8yX3BhdXNlLnBuZycsXHJcbiAgICAgICAgcmFkaW9QYXVzZTogJ2ltYWdlcy9pY29uXzM4XzJfcGF1c2UucG5nJyxcclxuICAgICAgICBtdXNpY1dhaXQ6ICdpbWFnZXMvaWNvbl8zOF8yLnBuZycsXHJcbiAgICAgICAgcmFkaW9XYWl0OiAnaW1hZ2VzL2ljb25fMzhfMi5wbmcnLFxyXG4gICAgfTtcclxuICAgIGxpbmsgPSAncG9wdXAvcG9wdXAuaHRtbCc7XHJcbiAgICBjbGlja1RpbWVyID0gbnVsbDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBsb2cudHJhY2UoJ2Jyb3dzZXJBY3Rpb24uY29uc3RydWN0b3IoKScpO1xyXG4gICAgICAgIHRoaXMuaW5pdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXQgPSAoKSA9PiB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCdicm93c2VyQWN0aW9uLmluaXQoKScpO1xyXG4gICAgICAgIHN3aXRjaCAoc3RvcmFnZS5nZXQoJ2dsb2JhbF9tb2RlJykpIHtcclxuICAgICAgICAgICAgY2FzZSAncG9wdXAnOlxyXG4gICAgICAgICAgICAgICAgLy/QtdGB0LvQuCDRgNC10LbQuNC8INC/0L7Qv9Cw0L8sINGC0L4g0YPQsdC40YDQsNC10Lwg0YHQu9GD0YjQsNGC0LXQu9GMINC60LvQuNC60LAg0L/QviDQuNC60L7QvdC60LUsINGCLtC6LiDRgyDQvdCw0YEg0LLRi9C/0LDQtNCw0Y7RidC10LUg0L7QutC90L5cclxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlQ2xpY2tMaXN0ZW5lcigpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ2J1dHRvbic6XHJcbiAgICAgICAgICAgICAgICAvL9C10YHQu9C4INGA0LXQttC40Lwg0LrQvdC+0L/QutCwLCDRgtC+INC/0L7Qv9Cw0L8g0L3QtSDRgNCw0LHQvtGC0LDQtdGCINC4INC00L7QsdCw0LLQu9GP0LXQvCDRgdC70YPRiNCw0YLQtdC70Ywg0LrQu9C40LrQsCDQv9C+INC40LrQvtC90LrQtVxyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRDbGlja0xpc3RlbmVyKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJlbW92ZUNsaWNrTGlzdGVuZXIgPSAoKSA9PiB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCdicm93c2VyQWN0aW9uLnJlbW92ZUNsaWNrTGlzdGVuZXIoKScpO1xyXG4gICAgICAgIGNocm9tZS5icm93c2VyQWN0aW9uLm9uQ2xpY2tlZC5yZW1vdmVMaXN0ZW5lcih0aGlzLmNsaWNrSGFuZGxlcik7XHJcbiAgICB9O1xyXG5cclxuICAgIGFkZENsaWNrTGlzdGVuZXIgPSAoKSA9PiB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCdicm93c2VyQWN0aW9uLmFkZENsaWNrTGlzdGVuZXIoKScpO1xyXG4gICAgICAgIGNocm9tZS5icm93c2VyQWN0aW9uLm9uQ2xpY2tlZC5hZGRMaXN0ZW5lcih0aGlzLmNsaWNrSGFuZGxlcik7XHJcbiAgICB9O1xyXG5cclxuICAgIGNsaWNrSGFuZGxlciA9ICgpID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ2Jyb3dzZXJBY3Rpb24uY2xpY2tIYW5kbGVyKCknKTtcclxuICAgICAgICAvL9GBINC/0L7QvNC+0YnRjNGOINGC0LDQudC80LXRgNCwINC70L7QstC40Lwg0LTQsNCx0LvQutC70LjQuiDQtdGB0LvQuCDRg9GB0L/QtdGC0Ywg0LrQu9C40LrQvdGD0YLRjCDQtNCy0LDQttC00Ysg0LTQviBET1VCTEVfQ0xJQ0tfVElNRSDQvNGBXHJcbiAgICAgICAgaWYgKHRoaXMuY2xpY2tUaW1lcikge1xyXG4gICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMuY2xpY2tUaW1lcik7XHJcbiAgICAgICAgICAgIHRoaXMuY2xpY2tUaW1lciA9IG51bGw7XHJcbiAgICAgICAgICAgIHRhYnMuZ2V0QWN0aXZlVGFiKCkuc2VuZCh7YWN0aW9uOiAnbmV4dCd9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWNrVGltZXIgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGFicy5nZXRBY3RpdmVUYWIoKS5zZW5kKHthY3Rpb246ICdwbGF5J30pO1xyXG4gICAgICAgICAgICB9LCBET1VCTEVfQ0xJQ0tfVElNRSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICB1cGRhdGUgPSAoKSA9PiB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCdicm93c2VyQWN0aW9uLnVwZGF0ZSgpJyk7XHJcblxyXG4gICAgICAgIC8v0LLRgdC1INCy0LrQu9Cw0LTQutC4INC30LDQutGA0YvRgtGLXHJcbiAgICAgICAgaWYgKCF0YWJzLmNvdW50KCkpIHtcclxuICAgICAgICAgICAgbG9nLnRyYWNlKCdicm93c2VyQWN0aW9uLnVwZGF0ZSgpIGFsbCB0YWJzIGNsb3NlZCwgYWxsIHNldCBOQScpO1xyXG4gICAgICAgICAgICBjaHJvbWUuYnJvd3NlckFjdGlvbi5zZXRJY29uKHtwYXRoOiB0aGlzLmljb25zLm5hfSk7XHJcbiAgICAgICAgICAgIGNocm9tZS5icm93c2VyQWN0aW9uLnNldFRpdGxlKHt0aXRsZTogdGhpcy50aXRsZXMubmF9KTtcclxuICAgICAgICAgICAgLy/QtdGB0LvQuCDQvtGC0LrRgNGL0YLRi9GFINCy0LrQu9Cw0LTQvtC6INC90LXRgiwg0YLQviDQtNCw0LbQtSDQsiDRgNC10LbQuNC80LUg0LrQvdC+0L/QutC4INC+0YHRgtCw0LLQu9GP0LXQvCDQv9C+0L/QsNC/INGBINCy0L7Qt9C80L7QttC90L7RgdGC0YzRjiDQvtGC0LrRgNGL0YLRjCDQry7QnC/Qry7QoFxyXG4gICAgICAgICAgICBjaHJvbWUuYnJvd3NlckFjdGlvbi5zZXRQb3B1cCh7cG9wdXA6IHRoaXMubGlua30pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL9C10YHRgtGMINCw0LrRgtC40LLQvdCw0Y8g0LLQutC70LDQtNC60LBcclxuICAgICAgICBjb25zdCBhY3RpdmVUYWIgPSB0YWJzLmdldEFjdGl2ZVRhYigpO1xyXG4gICAgICAgIGlmIChhY3RpdmVUYWIpIHtcclxuICAgICAgICAgICAgbG9nLnRyYWNlKCdicm93c2VyQWN0aW9uLnVwZGF0ZSgpIHNldCB0byAnICsgKHN0b3JhZ2UuZ2V0KCdnbG9iYWxfbW9kZScpID8gdGhpcy5saW5rIDogJzxudWxsPicpKTtcclxuXHJcbiAgICAgICAgICAgIC8v0LTQvtCx0LDQstC70Y/QtdC8INGB0YHRi9C70LrRgyDQvdCwINC/0L7Qv9Cw0L8g0LIg0YDQtdC20LjQvNC1INC/0L7Qv9Cw0L/QsCDQuCDRg9C00LDQu9GP0LXQvCDRgdGB0YvQu9C60YMg0LIg0YDQtdC20LjQvNC1INC60L3QvtC/0LrQuFxyXG4gICAgICAgICAgICBzd2l0Y2ggKHN0b3JhZ2UuZ2V0KCdnbG9iYWxfbW9kZScpKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdwb3B1cCc6XHJcbiAgICAgICAgICAgICAgICAgICAgY2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0UG9wdXAoe3BvcHVwOiB0aGlzLmxpbmt9KTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2J1dHRvbic6XHJcbiAgICAgICAgICAgICAgICAgICAgY2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0UG9wdXAoe3BvcHVwOiAnJ30pO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYWN0aXZlVGFiLnBsYXllci5pc1BsYXlpbmcgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIGxvZy50cmFjZSgnYnJvd3NlckFjdGlvbi51cGRhdGUoKSBpY29uIHNldCB0byBwbGF5aW5nJyk7XHJcbiAgICAgICAgICAgICAgICBjaHJvbWUuYnJvd3NlckFjdGlvbi5zZXRJY29uKHtwYXRoOiB0aGlzLmljb25zW2FjdGl2ZVRhYi50eXBlICsgJ1BsYXknXX0pO1xyXG4gICAgICAgICAgICAgICAgY2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0VGl0bGUoe3RpdGxlOiB0aGlzLnRpdGxlc1thY3RpdmVUYWIudHlwZSArICdQbGF5J119KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChhY3RpdmVUYWIucGxheWVyLmlzUGxheWluZyA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIGxvZy50cmFjZSgnYnJvd3NlckFjdGlvbi51cGRhdGUoKSBpY29uIHNldCB0byBwYXVzZWQnKTtcclxuICAgICAgICAgICAgICAgIGNocm9tZS5icm93c2VyQWN0aW9uLnNldEljb24oe3BhdGg6IHRoaXMuaWNvbnNbYWN0aXZlVGFiLnR5cGUgKyAnUGF1c2UnXX0pO1xyXG4gICAgICAgICAgICAgICAgY2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0VGl0bGUoe3RpdGxlOiB0aGlzLnRpdGxlc1thY3RpdmVUYWIudHlwZSArICdQYXVzZSddfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsb2cudHJhY2UoJ2Jyb3dzZXJBY3Rpb24udXBkYXRlKCkgaWNvbiBzZXQgdG8gd2FpdGluZycpO1xyXG4gICAgICAgICAgICAgICAgY2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0SWNvbih7cGF0aDogdGhpcy5pY29uc1thY3RpdmVUYWIudHlwZSArICdXYWl0J119KTtcclxuICAgICAgICAgICAgICAgIGNocm9tZS5icm93c2VyQWN0aW9uLnNldFRpdGxlKHt0aXRsZTogdGhpcy50aXRsZXNbYWN0aXZlVGFiLnR5cGUgKyAnV2FpdCddfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGNsb3NlUG9wdXAgPSAoKSA9PiB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCdicm93c2VyQWN0aW9uLmNsb3NlUG9wdXAoKScpO1xyXG5cclxuICAgICAgICBjb25zdCBwb3B1cHMgPSBjaHJvbWUuZXh0ZW5zaW9uLmdldFZpZXdzKHt0eXBlOiAncG9wdXAnfSk7XHJcbiAgICAgICAgaWYgKHBvcHVwcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcG9wdXBzWzBdLmNsb3NlKCk7XHJcbiAgICAgICAgICAgIGxvZy50cmFjZSgnYnJvd3NlckFjdGlvbi5jbG9zZVBvcHVwKCkgY2xvc2VkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3IGJyb3dzZXJBY3Rpb24oKTtcclxuIiwiY29uc3QgZG93bmxvYWRlciA9IHtcclxuICAgIGZpbGVMaW5rOiBudWxsLFxyXG4gICAgY3JlYXRlTGlua1RvVGV4dEZpbGU6IGZ1bmN0aW9uKHRleHQpIHtcclxuICAgICAgICBjb25zdCBkYXRhID0gbmV3IEJsb2IoW3RleHRdLCB7dHlwZTogJ3RleHQvcGxhaW4nfSk7XHJcbiAgICAgICAgdGhpcy5maWxlTGluayA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGRhdGEpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmZpbGVMaW5rO1xyXG4gICAgfSxcclxuICAgIGRlbGV0ZUZpbGVMaW5rOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB3aW5kb3cuVVJMLnJldm9rZU9iamVjdFVSTCh0aGlzLmZpbGVMaW5rKTtcclxuICAgIH0sXHJcbiAgICBkb3dubG9hZDogZnVuY3Rpb24oZmlsZW5hbWUsIHRleHQpIHtcclxuICAgICAgICBjaHJvbWUuZG93bmxvYWRzLnNldFNoZWxmRW5hYmxlZChmYWxzZSk7XHJcbiAgICAgICAgY2hyb21lLmRvd25sb2Fkcy5vbkNoYW5nZWQuYWRkTGlzdGVuZXIoZGF0YSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLnN0YXRlICYmIGRhdGEuc3RhdGUuY3VycmVudCA9PT0gJ2NvbXBsZXRlJykge1xyXG4gICAgICAgICAgICAgICAgY2hyb21lLmRvd25sb2Fkcy5zZXRTaGVsZkVuYWJsZWQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRlbGV0ZUZpbGVMaW5rKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBjaHJvbWUuZG93bmxvYWRzLmRvd25sb2FkKHtcclxuICAgICAgICAgICAgdXJsOiB0aGlzLmNyZWF0ZUxpbmtUb1RleHRGaWxlKHRleHQpLFxyXG4gICAgICAgICAgICBmaWxlbmFtZTogZmlsZW5hbWUsXHJcbiAgICAgICAgICAgIGNvbmZsaWN0QWN0aW9uOiAnb3ZlcndyaXRlJyxcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkb3dubG9hZGVyO1xyXG4iLCJpbXBvcnQgbG9nIGZyb20gJ2xvZ2xldmVsJztcclxuaW1wb3J0IHN0b3JhZ2UgZnJvbSAnLi9zdG9yYWdlJztcclxuaW1wb3J0IHRhYnMgZnJvbSAnLi90YWJzJztcclxuaW1wb3J0IG5ld3MgZnJvbSAnLi4vLi4vb3B0aW9uc19zcmMvYXBwL25ld3MnO1xyXG5pbXBvcnQgcG9ydENsYXNzIGZyb20gJy4uL2NvbW1vbi9wb3J0JztcclxuaW1wb3J0IG5vdGlmaWNhdGlvbnMgZnJvbSAnLi9ub3RpZmljYXRpb25zJztcclxuaW1wb3J0IGJyb3dzZXJBY3Rpb24gZnJvbSAnLi9icm93c2VyQWN0aW9uJztcclxuXHJcbi8vZm9yIGRlYnVnXHJcbi8vd2luZG93LnN0b3JhZ2UgPSBzdG9yYWdlO1xyXG5cclxuY29uc3QgRVhURVJOQUxfRVhURU5TSU9OX0lEID0gJ2FvZmFpbm9vZm5vbmhwZmxqaXBkYW9hZ21qbWhjaWRsJztcclxuXHJcbmNsYXNzIGV4dCB7XHJcbiAgICAvL9GB0L/QuNGB0L7QuiDQt9Cw0YDQtdCz0LjRgdGC0YDQuNGA0L7QstCw0L3QvdGL0YUg0LIgbWFuaWZlc3QuanNvbiDQutC+0LzQsNC90LQg0Lgg0LTQtdC50YHRgtCy0LjRjyDQv9GA0Lgg0LjRhSDQv9C+0LvRg9GH0LXQvdC40LhcclxuICAgIC8vYWN0aW9uIC0g0LTQtdC50YHRgtCy0LjQtVxyXG4gICAgLy9bY29uZmlybV0gLSDQv9C+0LTRgtCy0LXRgNC20LTQtdC90LjQtSB7dGl0bGUsIGljb24sIHN0b3JhZ2VPcHRpb25OYW1lfVxyXG4gICAgLy9bYmVmb3JlQ2JdIC0g0L/RgNC10LTRg9GB0LvQvtCy0LjQtSDQstGL0L/QvtC70L3QtdC90LjRjyDQtNC10LnRgdGC0LLQuNGPXHJcbiAgICAvL1thZnRlckNiXSAgLSDQtNC10LnRgdGC0LLQuNGPINC/0L7RgdC70LUg0L7RgtC/0YDQsNCy0LrQuCDQutC+0LzQsNC90LTRi1xyXG4gICAgY29tbWFuZHMgPSB7XHJcbiAgICAgICAgcGxheWVyX25leHQ6IHthY3Rpb246ICduZXh0J30sXHJcbiAgICAgICAgcGxheWVyX3BsYXk6IHthY3Rpb246ICdwbGF5J30sXHJcbiAgICAgICAgcGxheWVyX3ByZXY6IHthY3Rpb246ICdwcmV2J30sXHJcbiAgICAgICAgcGxheWVyX2luZm86IHthY3Rpb246ICdpbmZvJ30sXHJcbiAgICAgICAgcGxheWVyX3ZvbHVtZV91cDoge2FjdGlvbjogJ3ZvbHVtZXVwJ30sXHJcbiAgICAgICAgcGxheWVyX3ZvbHVtZV90b2dnbGU6IHthY3Rpb246ICd2b2x1bWVUb2dnbGUnfSxcclxuICAgICAgICBwbGF5ZXJfdm9sdW1lX2Rvd246IHthY3Rpb246ICd2b2x1bWVkb3duJ30sXHJcbiAgICAgICAgcGxheWVyX3NodWZmbGU6IHthY3Rpb246ICdzaHVmZmxlJ30sXHJcbiAgICAgICAgcGxheWVyX3JlcGVhdDoge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdyZXBlYXQnLFxyXG4gICAgICAgICAgICBhZnRlckNiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zR3JhbnRlZCAmJiBzdG9yYWdlLmdldCgnaG90a2V5X3JlcGVhdF9ub3RpZicpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGl0bGUgPSBbJ1xcbtCS0LrQu9GO0YfQtdC9INC/0L7QstGC0L7RgCDQstGB0LXRhSDRgtGA0LXQutC+0LInLCAnXFxu0JLRi9C60LvRjtGH0LXQvSDQv9C+0LLRgtC+0YAnLCAnXFxu0JLQutC70Y7Rh9C10L0g0L/QvtCy0YLQvtGAINGC0YDQtdC60LAnXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVwZWF0TW9kZSA9IH5+dGFicy5nZXRBY3RpdmVUYWIoKS5wbGF5ZXIuY29udHJvbHMucmVwZWF0O1xyXG4gICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbnMuY3JlYXRlVG9hc3QoYGltYWdlcy9yZXBlYXRfJHtyZXBlYXRNb2RlfS5wbmdgLCB0aXRsZVtyZXBlYXRNb2RlXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICBwbGF5ZXJfbGlrZToge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdsaWtlJyxcclxuICAgICAgICAgICAgYmVmb3JlQ2I6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghdGFicy5nZXRBY3RpdmVUYWIoKS5wbGF5ZXIudHJhY2subGlrZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHN0b3JhZ2UuZ2V0KCdob3RrZXlfbGlrZV9hY3Rpb24nKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3JlbW92ZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ25vbmUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYXNrJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vdGlmaWNhdGlvbnMubm90aWZpY2F0aW9uc0dyYW50ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbnMuY3JlYXRlQ29uZmlybWF0aW9uKCdsaWtlJywgJ9CS0Ysg0YPQstC10YDQtdC90Ysg0YfRgtC+INGF0L7RgtC40YLQtSDRg9Cx0YDQsNGC0Ywg0YMg0YLRgNC10LrQsCDQvtGC0LzQtdGC0LrRgyBcItCc0L3QtSDQvdGA0LDQstC40YLRgdGPXCI/JywgJ2ltYWdlcy9saWtlLW5vdGlmLnBuZycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nLndhcm4oJ2V4dC5vbkNvbW1hbmQoKSBjb25maXJtYXRpb24gbm90IGdyYW50ZWQsIGRpc2FibGluZyBjb25maXJtYXRpb24nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICBwbGF5ZXJfZGlzbGlrZToge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdkaXNsaWtlJyxcclxuICAgICAgICAgICAgY29uZmlybToge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0YWJzLmdldEFjdGl2ZVRhYigpLnR5cGUgIT0gJ3JhZGlvJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICA/ICfQktGLINGD0LLQtdGA0LXQvdGLINGH0YLQviDRhdC+0YLQuNGC0LUg0L7RgtC80LXRgtC40YLRjCDRgtGA0LXQuiDQutCw0LogXCLQndC1INGA0LXQutC+0LzQtdC90LTQvtCy0LDRgtGMXCI/J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICA6ICfQktGLINGD0LLQtdGA0LXQvdGLINGH0YLQviDRhdC+0YLQuNGC0LUg0L7RgtC80LXRgtC40YLRjCDRgtGA0LXQuiDQutCw0LogXCLQndC1INC90YDQsNCy0LjRgtGB0Y9cIj8nO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGljb246IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGFicy5nZXRBY3RpdmVUYWIoKS50eXBlICE9ICdyYWRpbycgPyAnaW1hZ2VzL2RvbnRyZWMtbm90aWYucG5nJyA6ICdpbWFnZXMvZGlzbGlrZS1ub3RpZi5wbmcnOyB9LFxyXG4gICAgICAgICAgICAgICAgc3RvcmFnZU9wdGlvbk5hbWU6ICdob3RrZXlfZGlzbGlrZV9hY3Rpb24nLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGxheWVyX3NlZWtfZndkOiB7YWN0aW9uOiAnc2Vla0Z3ZCd9LFxyXG4gICAgICAgIHBsYXllcl9zZWVrX2JhY2s6IHthY3Rpb246ICdzZWVrQmFjayd9LFxyXG4gICAgfTtcclxuXHJcbiAgICAvL9C60LDQvdCw0Lsg0LTQu9GPINGB0LLRj9C30Lgg0YEgcG9wdXAn0L7QvFxyXG4gICAgcG9wdXBDb25uZWN0aW9uID0gbnVsbDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBsb2cudHJhY2UoJ2V4dC5jb25zdHJ1Y3RvcigpJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdCA9ICgpID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ2V4dC5pbml0KCknKTtcclxuXHJcbiAgICAgICAgLy/QtNC+0LHQsNCy0LvRj9C10Lwg0LvQvtCz0LPQtdGA0YMg0LzQtdGC0L7QtCDQtNC70Y8g0YLRgNCw0L3RgdC70Y/RhtC40Lgg0YPRgNC+0LLQvdGPINC70L7Qs9C40YDQvtCy0LDQvdC40Y8g0LIgQ1NcclxuICAgICAgICBsb2cuY3MgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRhYiA9IHRhYnMuZ2V0QWN0aXZlVGFiKCk7XHJcbiAgICAgICAgICAgIGlmICh0YWIpIHtcclxuICAgICAgICAgICAgICAgIHRhYi5zZW5kKHthY3Rpb246ICdkZWJ1ZycsIGxldmVsOiBsb2cuZ2V0TGV2ZWwoKX0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy/Rg9GB0YLQsNC90L7QstC60LAg0LjQu9C4INC+0LHQvdC+0LLQu9C10L3QuNC1INGA0LDRgdGI0LjRgNC10L3QuNGPXHJcbiAgICAgICAgbG9nLnRyYWNlKCdleHQuaW5pdCgpIGFkZGluZyBvbkluc3RhbGxlZCBldmVudCBsaXN0ZW5lcicpO1xyXG4gICAgICAgIGNocm9tZS5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKHRoaXMub25JbnN0YWxsZWQpO1xyXG5cclxuICAgICAgICAvL9C00L7QsdCw0LLQu9GP0LXQvCDRgdC70YPRiNCw0YLQtdC70Ywg0YHQvtCx0YvRgtC40LksINC/0YDQuNGI0LXQtNGI0LjRhSDQvtGCIENTINGB0LrRgNC40L/RgtCwINC40Lcg0LLQutC70LDQtNC60LhcclxuICAgICAgICBjaHJvbWUucnVudGltZS5vbkNvbm5lY3QuYWRkTGlzdGVuZXIodGhpcy5vbkNvbm5lY3QpO1xyXG5cclxuICAgICAgICAvL9C00L7QsdCw0LLQu9GP0LXQvCDRgdC70YPRiNCw0YLQtdC70Ywg0LPQvtGA0Y/Rh9C40YUg0LrQu9Cw0LLQuNGJXHJcbiAgICAgICAgY2hyb21lLmNvbW1hbmRzLm9uQ29tbWFuZC5hZGRMaXN0ZW5lcih0aGlzLm9uQ29tbWFuZCk7XHJcblxyXG4gICAgICAgIC8v0LTQvtCx0LDQstC70Y/QtdC8INGB0LvRg9GI0LDRgtC10LvRjCDRgdC+0L7QsdGJ0LXQvdC40LksINC/0YDQuNGI0LXQtNGI0LjRhSDQuNC3INC00YDRg9Cz0L7Qs9C+INGA0LDRgdGI0LjRgNC10L3QuNGPXHJcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlRXh0ZXJuYWwuYWRkTGlzdGVuZXIodGhpcy5vbk1lc3NhZ2VFeHRlcm5hbCk7XHJcblxyXG4gICAgICAgIC8v0LfQsNC00LDQtdC8INGA0LXQsNC60YbQuNGOINC90LAg0YHQvtCx0YvRgtC40LUg0LjQt9C80LXQvdC10L3QuNGPINC60L7QvdGE0LjQs9GD0YDQsNGG0LjQuFxyXG4gICAgICAgIHN0b3JhZ2UuYWRkT25TdG9yYWdlQ2hhbmdlQ2IodGhpcy5vblN0b3JhZ2VDaGFuZ2UpO1xyXG5cclxuICAgICAgICAvL9C30LDQs9GA0YPQttC10L3QviDRgNCw0YHRiNC40YDQtdC90LjQtVxyXG4gICAgICAgIGdhKCdzZW5kJywgJ2V2ZW50JywgJ2JhY2tncm91bmQnLCAnaW5pdCcsIHN0b3JhZ2UuZ2V0KCd1c2VyX2lkJykpO1xyXG4gICAgfTtcclxuXHJcbiAgICBvblN0b3JhZ2VDaGFuZ2UgPSBlID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ2V4dC5vblN0b3JhZ2VDaGFuZ2UoKSB3aXRoIGtleSA8JXM+JywgZS5rZXkpO1xyXG4gICAgICAgIHN3aXRjaCAoZS5rZXkpIHtcclxuICAgICAgICAgICAgY2FzZSAnc3RvcmUuc2V0dGluZ3MuZ2xvYmFsX21vZGUnOlxyXG4gICAgICAgICAgICAgICAgYnJvd3NlckFjdGlvbi5pbml0KCk7XHJcbiAgICAgICAgICAgICAgICBicm93c2VyQWN0aW9uLnVwZGF0ZSgpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdzdG9yZS5zZXR0aW5ncy5wb3B1cF9zaG93X3Zhcic6XHJcbiAgICAgICAgICAgICAgICBicm93c2VyQWN0aW9uLmNsb3NlUG9wdXAoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL9C/0YDQuCDQuNC30LzQtdC90LXQvdC40Y/RhSBzdG9yYWdlINC+0YLQv9GA0LDQstC70Y/QtdC8INC40YUg0LIgY3NcclxuICAgICAgICBjb25zdCB0YWIgPSB0YWJzLmdldEFjdGl2ZVRhYigpO1xyXG4gICAgICAgIGlmICh0YWIgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHRhYi5zZW5kKHthY3Rpb246ICdzdG9yYWdlJywgc3RvcmFnZTogc3RvcmFnZS5nZXRBbGwoKX0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgb25Db25uZWN0ID0gcG9ydCA9PiB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCdleHQub25Db25uZWN0KCkgcG9ydCAlbycsIHBvcnQpO1xyXG5cclxuICAgICAgICBpZiAocG9ydC5zZW5kZXIudGFiICYmIHBvcnQubmFtZSA9PSAneW11c2ljJykge1xyXG4gICAgICAgICAgICBsb2cudHJhY2UoJ2V4dC5vbkNvbm5lY3QoKSBjb25uZWN0IGZyb20gQ1MgZnJvbSB0YWInLCBwb3J0LnNlbmRlci50YWIpO1xyXG4gICAgICAgICAgICBjb25zdCB0YWIgPSB0YWJzLmdldEJ5SWQocG9ydC5zZW5kZXIudGFiLmlkKTtcclxuICAgICAgICAgICAgdGFiLmFkZFBvcnQocG9ydCk7XHJcbiAgICAgICAgICAgIC8v0L/RgNC4INC+0YLQutGA0YvRgtC40Lgg0L/QvtGA0YLQsCDQvtGC0L/RgNCw0LLQu9GP0LXQvCDRgtC10LrRg9GJ0LXQtSDRgdC+0YHRgtC+0Y/QvdC40LUgc3RvcmFnZSDQsiBjc1xyXG4gICAgICAgICAgICB0YWIuc2VuZCh7YWN0aW9uOiAnc3RvcmFnZScsIHN0b3JhZ2U6IHN0b3JhZ2UuZ2V0QWxsKCl9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8v0YHQvtC10LTQuNC90LXQvdC40LUg0YEgZXh0ZW5zaW9uJ9C+0LxcclxuICAgICAgICBpZiAocG9ydC5uYW1lID09ICdwb3B1cCcpIHtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cENvbm5lY3Rpb24gPSBuZXcgcG9ydENsYXNzKCdwb3B1cCcsICdob3N0JywgcG9ydCk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBDb25uZWN0aW9uLmFkZE9uTWVzc2FnZUNiKHRoaXMub25Qb3B1cE1lc3NhZ2UpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgb25Db21tYW5kID0gY29tbWFuZCA9PiB7XHJcbiAgICAgICAgbG9nLmRlYnVnKCdleHQub25Db21tYW5kKCkgd2l0aCBjb21tYW5kIDwlcz4nLCBjb21tYW5kKTtcclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHRhYnMuZ2V0QWN0aXZlVGFiKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICBsb2cudHJhY2UoJ2V4dC5vbkNvbW1hbmQoKSB0aGVyZSBpcyBubyBhY3RpdmUgdGFiJyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCF0aGlzLmNvbW1hbmRzW2NvbW1hbmRdKSB7XHJcbiAgICAgICAgICAgICAgICBsb2cudHJhY2UoJ2V4dC5vbkNvbW1hbmQoKSBjb21tYW5kIHVua25vd24nKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuY29tbWFuZHNbY29tbWFuZF0uY29uZmlybSAmJiBzdG9yYWdlLmdldCh0aGlzLmNvbW1hbmRzW2NvbW1hbmRdLmNvbmZpcm0uc3RvcmFnZU9wdGlvbk5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBsb2cuZGVidWcoJ2V4dC5vbkNvbW1hbmQoKSBjb25maXJtYXRpb24gbmVlZGVkJywgdGhpcy5jb21tYW5kc1tjb21tYW5kXS5jb25maXJtKTtcclxuICAgICAgICAgICAgICAgIGlmIChub3RpZmljYXRpb25zLm5vdGlmaWNhdGlvbnNHcmFudGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9ucy5jcmVhdGVDb25maXJtYXRpb24odGhpcy5jb21tYW5kc1tjb21tYW5kXS5hY3Rpb24sICh0eXBlb2YgdGhpcy5jb21tYW5kc1tjb21tYW5kXS5jb25maXJtLnRpdGxlID09ICdmdW5jdGlvbidcclxuICAgICAgICAgICAgICAgICAgICAgICAgPyB0aGlzLmNvbW1hbmRzW2NvbW1hbmRdLmNvbmZpcm0udGl0bGUoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMuY29tbWFuZHNbY29tbWFuZF0uY29uZmlybS50aXRsZSksICh0eXBlb2YgdGhpcy5jb21tYW5kc1tjb21tYW5kXS5jb25maXJtLmljb24gPT0gJ2Z1bmN0aW9uJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMuY29tbWFuZHNbY29tbWFuZF0uY29uZmlybS5pY29uKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmNvbW1hbmRzW2NvbW1hbmRdLmNvbmZpcm0uaWNvbikpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2cud2FybignZXh0Lm9uQ29tbWFuZCgpIGNvbmZpcm1hdGlvbiBub3QgZ3JhbnRlZCwgYXBwbHlpbmcgYWN0aW9uJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFicy5nZXRBY3RpdmVUYWIoKS5zZW5kKHthY3Rpb246IHRoaXMuY29tbWFuZHNbY29tbWFuZF0uYWN0aW9ufSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmNvbW1hbmRzW2NvbW1hbmRdLmFmdGVyQ2IgPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbW1hbmRzW2NvbW1hbmRdLmFmdGVyQ2IoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMuY29tbWFuZHNbY29tbWFuZF0uYmVmb3JlQ2IgIT0gJ2Z1bmN0aW9uJyB8fCB0aGlzLmNvbW1hbmRzW2NvbW1hbmRdLmJlZm9yZUNiKCkpIHtcclxuICAgICAgICAgICAgICAgIGxvZy5kZWJ1ZygnZXh0Lm9uQ29tbWFuZCgpIGNvbmZpcm1hdGlvbiBub3QgbmVlZGVkJyk7XHJcbiAgICAgICAgICAgICAgICB0YWJzLmdldEFjdGl2ZVRhYigpLnNlbmQoe2FjdGlvbjogdGhpcy5jb21tYW5kc1tjb21tYW5kXS5hY3Rpb259KTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5jb21tYW5kc1tjb21tYW5kXS5hZnRlckNiID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbW1hbmRzW2NvbW1hbmRdLmFmdGVyQ2IoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgdXRpbHMuZXJyb3JIYW5kbGVyKGUpOyB9XHJcbiAgICB9O1xyXG5cclxuICAgIG9uSW5zdGFsbGVkID0gZGV0YWlscyA9PiB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCdleHQub25JbnN0YWxsZWQoKScpO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8v0LjQvdC40YbQuNCw0LvQuNC30LjRgNGD0LXQvCDRhdGA0LDQvdC40LvQuNGJ0LUg0L3QsNGB0YLRgNC+0LXQulxyXG4gICAgICAgICAgICBzdG9yYWdlLmluaXQoKTtcclxuXHJcbiAgICAgICAgICAgIC8v0YPRgdGC0LDQvdC+0LLQutCwXHJcbiAgICAgICAgICAgIGlmIChkZXRhaWxzLnJlYXNvbiA9PSAnaW5zdGFsbCcpIHtcclxuICAgICAgICAgICAgICAgIGdhKCdzZW5kJywgJ2V2ZW50JywgJ2JhY2tncm91bmQnLCAnaW5zdGFsbGVkJywgY2hyb21lLnJ1bnRpbWUuZ2V0TWFuaWZlc3QoKS52ZXJzaW9uKTtcclxuICAgICAgICAgICAgfS8v0L7QsdC90L7QstC70LXQvdC40LUgKNC/0YDQuCDRg9GB0LvQvtCy0LjQuCwg0YfRgtC+INCy0LXRgNGB0LjRjyDQuNC30LzQtdC90LjQu9Cw0YHRjClcclxuICAgICAgICAgICAgZWxzZSBpZiAoZGV0YWlscy5yZWFzb24gPT0gJ3VwZGF0ZScgJiYgZGV0YWlscy5wcmV2aW91c1ZlcnNpb24gIT0gY2hyb21lLnJ1bnRpbWUuZ2V0TWFuaWZlc3QoKS52ZXJzaW9uKSB7XHJcbiAgICAgICAgICAgICAgICBnYSgnc2VuZCcsICdldmVudCcsICdiYWNrZ3JvdW5kJywgJ3VwZGF0ZWQnLCBgJHtkZXRhaWxzLnByZXZpb3VzVmVyc2lvbn0+JHtjaHJvbWUucnVudGltZS5nZXRNYW5pZmVzdCgpLnZlcnNpb259YCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy/QtdGB0LvQuCDQsiDQvdCw0YHRgtGA0L7QudC60LDRhSDRgdGC0L7QuNGCINC+0YLQutGA0YvRgtC40LUg0YHRgtGA0LDQvdC40YbRiyDQvdCw0YHRgtGA0L7QtdC6INC90LAg0LLQutC70LDQtNC60LUg0LjRgdGC0L7RgNC40Y8g0LjQt9C80LXQvdC10L3QuNC5INC4INCyINC90L7QstC+0YHRgtGP0YUg0LXRgdGC0Ywg0L7Qv9C40YHQsNC90LjQtVxyXG4gICAgICAgICAgICAgICAgLy/QtNCw0L3QvdC+0Lkg0LLQtdGA0YHQuNC4IC0g0L7RgtC60YDRi9Cy0LDQtdC8INGB0YLRgNCw0L3QuNGG0YMg0L3QsNGB0YLRgNC+0LXQuiDQsNCy0YLQvtC80LDRgtC+0LxcclxuICAgICAgICAgICAgICAgIGlmICgoc3RvcmFnZS5nZXQoJ2F1dG9vcGVuJykgJiYgbmV3c1tjaHJvbWUucnVudGltZS5nZXRNYW5pZmVzdCgpLnZlcnNpb25dKSB8fCAobmV3c1tjaHJvbWUucnVudGltZS5nZXRNYW5pZmVzdCgpLnZlcnNpb25dICYmIG5ld3NbY2hyb21lLnJ1bnRpbWUuZ2V0TWFuaWZlc3QoKS52ZXJzaW9uXS51cmdlbnQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hyb21lLnRhYnMuY3JlYXRlKHt1cmw6ICcvb3B0aW9ucy9pbmRleC5odG1sJ30pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZSkgeyB1dGlscy5lcnJvckhhbmRsZXIoZSk7IH1cclxuICAgIH07XHJcblxyXG4gICAgb25NZXNzYWdlRXh0ZXJuYWwgPSAocmVxdWVzdCwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ2V4dC5vbk1lc3NhZ2VFeHRlcm5hbCgpIHJlcXVlc3QgJW8gZnJvbSBzZW5kZXIgJW8nLCByZXF1ZXN0LCBzZW5kZXIpO1xyXG4gICAgICAgIGlmIChzZW5kZXIuaWQgIT0gRVhURVJOQUxfRVhURU5TSU9OX0lEKSB7XHJcbiAgICAgICAgICAgIGxvZy50cmFjZSgnZXh0Lm9uTWVzc2FnZUV4dGVybmFsKCkgbWVzc2FnZSBmcm9tIHVua25vd24gc2VuZGVyLCBza2lwcGVkJyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxvZy50cmFjZSgnZXh0Lm9uTWVzc2FnZUV4dGVybmFsKCkgbWFrZSBzb21lIGFjdGlvbicpO1xyXG5cclxuICAgICAgICAvLyAgICBpZiAocmVxdWVzdC5jb21tYW5kID09ICdzdGF0ZScpXHJcbiAgICAgICAgLy8gICAge1xyXG4gICAgICAgIC8vICAgICAgICBzZW5kUmVzcG9uc2Uoe3Jlc3VsdDogdHJ1ZSwgc3RhdGU6IGJnLnRhYnMuZ2V0QWN0aXZlVGFiKCkucGxheWVyfSk7XHJcbiAgICAgICAgLy8gICAgICAgIHJldHVybjtcclxuICAgICAgICAvLyAgICB9XHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyAgICB0aGlzLm9uQ29tbWFuZChcInBsYXllcl9cIityZXF1ZXN0LmNvbW1hbmQpO1xyXG4gICAgICAgIC8vICAgIHNlbmRSZXNwb25zZSh7cmVzdWx0OiB0cnVlfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIG9uUG9wdXBEaXNjb25uZWN0ID0gKCkgPT4ge1xyXG4gICAgICAgIGxvZy50cmFjZSgnZXh0Lm9uUG9wdXBEaXNjb25uZWN0KCknKTtcclxuICAgICAgICAvL9C00L4g0YDQtdGE0LDQutGC0L7RgNC40L3Qs9CwINCy0L7Qt9C90LjQutCw0LvQsCDQv9GA0L7QsdC70LXQvNCwINC60L7Qs9C00LAg0L/RgNC4INC40LfQvNC10L3QtdC90LjQuCDRg9GA0LvQsCDRgdGC0YDQsNC90LjRhtGLINC90LUg0L/RgNC+0LjRgdGF0L7QtNC40YIg0YHQvtCx0YvRgtC40LUgb251bmxvYWQg0Lgg0Y3RgtC+XHJcbiAgICAgICAgLy/Qv9GA0LjQstC+0LTQuNGCINC6INC+0YjQuNCx0LrQtSwg0L3QviDQt9Cw0YLQviDQv9GA0L7QuNGB0YXQvtC00LjRgiDRgdC+0LHRi9GC0LjQtSBvbkRpc2Nvbm5lY3Qg0YMg0L/QvtGA0YLQsCwg0L/QvtGN0YLQvtC80YMg0LTRg9Cx0LvQuNGA0YPQtdC8INGE0YPQvdC60YbQuNC+0L3QsNC7INC30LDQutGA0YvRgtC40Y9cclxuICAgICAgICAvL9Cy0LrQu9Cw0LTQutC4XHJcbiAgICAgICAgLy90YWJzLnNodXRkb3duKHRoaXMuaWQpO1xyXG4gICAgICAgIC8vdGhpcy5wb3B1cENvbm5lY3Rpb24gPSBudWxsO1xyXG4gICAgfTtcclxuXHJcbiAgICBvblBvcHVwTWVzc2FnZSA9IChtc2csIHBvcnQpID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ2V4dC5vblBvcHVwTWVzc2FnZSgpIHdpdGggbWVzc2FnZSAlbyBmcm9tIHBvcnQgJW8nLCBtc2csIHBvcnQpO1xyXG4gICAgICAgIC8vaWYgKCFtc2cuYWN0aW9uKVxyXG4gICAgICAgIC8ve1xyXG4gICAgICAgIC8vICAgIGxvZy50cmFjZShcImV4dC5vblBvcHVwTWVzc2FnZSgpIGludmFsaWQgbWVzc2FnZVwiKTtcclxuICAgICAgICAvLyAgICByZXR1cm47XHJcbiAgICAgICAgLy99XHJcbiAgICAgICAgLy9jb25zdCBhY3Rpb25MaXN0ZW5lck5hbWUgPSBgb24ke21zZy5hY3Rpb24uY2FwaXRhbGl6ZSgpfUFjdGlvbmA7XHJcbiAgICAgICAgLy9cclxuICAgICAgICAvL2lmICghdGhpcy5oYXNPd25Qcm9wZXJ0eShhY3Rpb25MaXN0ZW5lck5hbWUpKVxyXG4gICAgICAgIC8ve1xyXG4gICAgICAgIC8vICAgIGxvZy50cmFjZShcImV4dC5vblBvcHVwTWVzc2FnZSgpIGxpc3RlbmVyIG9mIGFjdGlvbiA8JXM+IG5vdCBkZWZpbmVkXCIsIG1zZy5hY3Rpb24pO1xyXG4gICAgICAgIC8vICAgIHJldHVybjtcclxuICAgICAgICAvL31cclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vdHJ5IHtcclxuICAgICAgICAvLyAgICBjb25zdCBpc0FjdGl2ZSA9ICh0YWJzLmdldEFjdGl2ZVRhYigpLmlkID09IHRoaXMuaWQpO1xyXG4gICAgICAgIC8vICAgIGxvZy50cmFjZShcImV4dC5vblBvcHVwTWVzc2FnZSgpIGNhbGxpbmcgYWN0aW9uIGxpc3RlbmVyIDwlcz4sIGlzIGFjdGl2ZSB0YWIgPCVvPlwiLCBhY3Rpb25MaXN0ZW5lck5hbWUsIGlzQWN0aXZlKTtcclxuICAgICAgICAvLyAgICB0aGlzW2FjdGlvbkxpc3RlbmVyTmFtZV0uY2FsbCh0aGlzLCBtc2csIGlzQWN0aXZlKTtcclxuICAgICAgICAvL31cclxuICAgICAgICAvL2NhdGNoIChlKSB7IHV0aWxzLmVycm9ySGFuZGxlcihlKTsgfVxyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3IGV4dCgpO1xyXG4iLCJpbXBvcnQgbG9nIGZyb20gJ2xvZ2xldmVsJztcclxuaW1wb3J0IHN0b3JhZ2UgZnJvbSAnLi9zdG9yYWdlJztcclxuaW1wb3J0IHRhYnMgZnJvbSAnLi90YWJzJztcclxuaW1wb3J0IHV0aWxzIGZyb20gJy4uL2NvbW1vbi91dGlscyc7XHJcblxyXG4vL9C/0L7QtNGA0LDQt9GD0LzQtdCy0LDQtdGC0YHRjywg0YfRgtC+INCyINC+0LTQuNC9INC80L7QvNC10L3RgiDQstGA0LXQvNC10L3QuCDQstC+0LfQvNC+0LbQvdC+INGC0L7Qu9GM0LrQviDQvtC00L3QviDRg9Cy0LXQtNC+0LzQu9C10L3QuNC1INC+0YIg0YDQsNGB0YjQuNGA0LXQvdC40Y9cclxuY2xhc3Mgbm90aWZpY2F0aW9ucyB7XHJcbiAgICAvL9GB0L/QuNGB0L7QuiDQtNC+0YHRgtGD0L/QvdGL0YUg0LrQvdC+0L/QvtC6INC4INC00LXQudGB0YLQstC40Lkg0L/QviDQuNGFINC90LDQttCw0YLQuNGOXHJcbiAgICBidXR0b25zID0ge1xyXG4gICAgICAgIC8vMiDQstC+0LfQvNC+0LbQvdGL0LUg0LrQvdC+0L/QutC4INCyINGA0LXQttC40LzQtSDQvNGD0LfRi9C60LhcclxuICAgICAgICBtdXNpYzogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogKCkgPT4gc3RvcmFnZS5nZXQoJ2Rpc2xpa2UnKSxcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2Rpc2xpa2UnLFxyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICfQndC1INGA0LXQutC+0LzQtdC90LTQvtCy0LDRgtGMJyxcclxuICAgICAgICAgICAgICAgIGljb246ICdpbWFnZXMvZG9udHJlY29tbWVuZC5zdmcnLFxyXG4gICAgICAgICAgICAgICAgY29uZmlybToge1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAn0JLRiyDRg9Cy0LXRgNC10L3RiyDRh9GC0L4g0YXQvtGC0LjRgtC1INC+0YLQvNC10YLQuNGC0Ywg0YLRgNC10Log0LrQsNC6IFwi0J3QtSDRgNC10LrQvtC80LXQvdC00L7QstCw0YLRjFwiPycsXHJcbiAgICAgICAgICAgICAgICAgICAgaWNvbjogJ2ltYWdlcy9kb250cmVjLW5vdGlmLnBuZycsXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uOiAnbXJfZGlzbGlrZV9hY3Rpb24nLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFsdWU6ICgpID0+IHN0b3JhZ2UuZ2V0KCdhZGR0bycpLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnbGlrZScsXHJcbiAgICAgICAgICAgICAgICB0aXRsZTogWyfQo9Cx0YDQsNGC0Ywg0LjQtyBcItCc0L7QtdC5INC80YPQt9GL0LrQuFwiJywgJ9CU0L7QsdCw0LLQuNGC0Ywg0LIgXCLQnNC+0Y4g0LzRg9C30YvQutGDXCInXSxcclxuICAgICAgICAgICAgICAgIGljb246IFsnaW1hZ2VzL2xpa2Uuc3ZnJywgJ2ltYWdlcy91bmxpa2Uuc3ZnJ10sXHJcbiAgICAgICAgICAgICAgICBpbnZQYXJhbTogJ2xpa2VkJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFsdWU6ICgpID0+IHN0b3JhZ2UuZ2V0KCduZXh0JyksXHJcbiAgICAgICAgICAgICAgICBhY3Rpb246ICduZXh0JyxcclxuICAgICAgICAgICAgICAgIHRpdGxlOiAn0KHQu9C10LTRg9GO0YnQuNC5INGC0YDQtdC6JyxcclxuICAgICAgICAgICAgICAgIGljb246ICdpbWFnZXMveWFfbmV4dC5zdmcnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgLy8zINCy0L7Qt9C80L7QttC90YvQtSDQutC90L7Qv9C60Lgg0LIg0YDQtdC20LjQvNC1INC80YPQt9GL0LrQuC3RgNCw0LTQuNC+XHJcbiAgICAgICAgbXVzaWNyYWRpbzogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogKCkgPT4gc3RvcmFnZS5nZXQoJ21yX2Rpc2xpa2UnKSxcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2Rpc2xpa2UnLFxyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICfQndC1INC90YDQsNCy0LjRgtGB0Y8nLFxyXG4gICAgICAgICAgICAgICAgaWNvbjogJ2ltYWdlcy9yYWRpb19kaXNsaWtlLnN2ZycsXHJcbiAgICAgICAgICAgICAgICBjb25maXJtOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICfQktGLINGD0LLQtdGA0LXQvdGLINGH0YLQviDRhdC+0YLQuNGC0LUg0L7RgtC80LXRgtC40YLRjCDRgtGA0LXQuiDQutCw0LogXCLQndC1INC90YDQsNCy0LjRgtGB0Y9cIj8nLFxyXG4gICAgICAgICAgICAgICAgICAgIGljb246ICdpbWFnZXMvZGlzbGlrZS1ub3RpZi5wbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbjogJ21yX2Rpc2xpa2VfYWN0aW9uJyxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlOiAoKSA9PiBzdG9yYWdlLmdldCgnbXJfYWRkdG8nKSxcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2xpa2UnLFxyXG4gICAgICAgICAgICAgICAgdGl0bGU6IFsn0KPQsdGA0LDRgtGMINC40LcgXCLQnNC+0LXQuSDQvNGD0LfRi9C60LhcIicsICfQlNC+0LHQsNCy0LjRgtGMINCyIFwi0JzQvtGOINC80YPQt9GL0LrRg1wiJ10sXHJcbiAgICAgICAgICAgICAgICBpY29uOiBbJ2ltYWdlcy9saWtlLnN2ZycsICdpbWFnZXMvdW5saWtlLnN2ZyddLFxyXG4gICAgICAgICAgICAgICAgaW52UGFyYW06ICdsaWtlZCcsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlOiAoKSA9PiBzdG9yYWdlLmdldCgnbXJfbmV4dCcpLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnbmV4dCcsXHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJ9Ch0LvQtdC00YPRjtGJ0LjQuSDRgtGA0LXQuicsXHJcbiAgICAgICAgICAgICAgICBpY29uOiAnaW1hZ2VzL3lhX25leHQuc3ZnJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIC8vMyDQstC+0LfQvNC+0LbQvdGL0LUg0LrQvdC+0L/QutC4INCyINGA0LXQttC40LzQtSDRgNCw0LTQuNC+XHJcbiAgICAgICAgcmFkaW86IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFsdWU6ICgpID0+IHN0b3JhZ2UuZ2V0KCdyYWRpb19kaXNsaWtlJyksXHJcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdkaXNsaWtlJyxcclxuICAgICAgICAgICAgICAgIHRpdGxlOiAn0J3QtSDQvdGA0LDQstC40YLRgdGPJyxcclxuICAgICAgICAgICAgICAgIGljb246ICdpbWFnZXMvcmFkaW9fZGlzbGlrZS5zdmcnLFxyXG4gICAgICAgICAgICAgICAgY29uZmlybToge1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAn0JLRiyDRg9Cy0LXRgNC10L3RiyDRh9GC0L4g0YXQvtGC0LjRgtC1INC+0YLQvNC10YLQuNGC0Ywg0YLRgNC10Log0LrQsNC6IFwi0J3QtSDQvdGA0LDQstC40YLRgdGPXCI/JyxcclxuICAgICAgICAgICAgICAgICAgICBpY29uOiAnaW1hZ2VzL2Rpc2xpa2Utbm90aWYucG5nJyxcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb246ICdyYWRpb19kaXNsaWtlX2FjdGlvbicsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogKCkgPT4gc3RvcmFnZS5nZXQoJ3JhZGlvX2xpa2UnKSxcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2xpa2UnLFxyXG4gICAgICAgICAgICAgICAgdGl0bGU6IFsn0KPQsdGA0LDRgtGMINC+0YLQvNC10YLQutGDIFwi0J3RgNCw0LLQuNGC0YHRj1wiJywgJ9Cd0YDQsNCy0LjRgtGB0Y8nXSxcclxuICAgICAgICAgICAgICAgIGljb246IFsnaW1hZ2VzL2xpa2Uuc3ZnJywgJ2ltYWdlcy9yYWRpb19saWtlLnN2ZyddLFxyXG4gICAgICAgICAgICAgICAgaW52UGFyYW06ICdsaWtlZCcsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlOiAoKSA9PiBzdG9yYWdlLmdldCgncmFkaW9fbmV4dCcpLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnbmV4dCcsXHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJ9Ch0LvQtdC00YPRjtGJ0LjQuSDRgtGA0LXQuicsXHJcbiAgICAgICAgICAgICAgICBpY29uOiAnaW1hZ2VzL3lhX25leHQuc3ZnJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgfTtcclxuICAgIGNvbmZpcm1CdXR0b25zID0gW1xyXG4gICAgICAgIHt0aXRsZTogJ9CU0LAnLCBjb25maXJtOiB0cnVlfSxcclxuICAgICAgICB7dGl0bGU6ICfQndC10YInfSxcclxuICAgIF07XHJcbiAgICBjb25maXJtVGltZW91dCA9IDUwMDA7XHJcbiAgICAvL9GE0LvQsNCzINGA0LDQt9GA0LXRiNC10L3QvdGL0YUg0YPQstC10LTQvtC80LvQtdC90LjQuVxyXG4gICAgbm90aWZpY2F0aW9uc0dyYW50ZWQgPSBmYWxzZTtcclxuICAgIC8v0YLQsNC50LzQtdGAINCw0LLRgtC+0LfQsNC60YDRi9GC0LjRjyDRg9Cy0LXQtNC+0LzQu9C10L3QuNGPXHJcbiAgICBhdXRvQ2xvc2VUaW1lciA9IG51bGw7XHJcbiAgICBhdXRvQ2xvc2VUaW1lclRvYXN0ID0gbnVsbDtcclxuICAgIC8v0LjQtNC10L3RgtC40YTQuNC60LDRgtC+0YBcclxuICAgIGlkID0gbnVsbDtcclxuICAgIC8v0LjQtNC10L3RgtC40YTQuNC60LDRgtC+0YBcclxuICAgIHRvYXN0SWQgPSBudWxsO1xyXG4gICAgLy/RhNC70LDQsyDQvdCw0YXQvtC00LjRgtGB0Y8g0LvQuCDRg9Cy0LXQtNC+0LzQu9C10L3QuNC1INCyINGB0YLQsNC00LjQuCDQv9C+0LTRgtCy0LXRgNC20LTQtdC90LjRj1xyXG4gICAgaXNDb25maXJtID0gZmFsc2U7XHJcbiAgICAvL9GC0LjQvyDQv9C70LXQtdGA0LBcclxuICAgIHBsYXllck1vZGUgPSBudWxsO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIGxvZy5kZWJ1Zygnbm90aWZpY2F0aW9ucy5jb25zdHJ1Y3RvcigpJyk7XHJcblxyXG4gICAgICAgIC8v0L/RgNC+0LLQtdGA0LrQsCDQv9GA0LDQsiDQvdCwINGD0LLQtdC00L7QvNC70LXQvdC40Y9cclxuICAgICAgICBjaHJvbWUubm90aWZpY2F0aW9ucy5nZXRQZXJtaXNzaW9uTGV2ZWwobGV2ZWwgPT4ge1xyXG4gICAgICAgICAgICBpZiAobGV2ZWwgPT0gJ2dyYW50ZWQnKSB7XHJcbiAgICAgICAgICAgICAgICBsb2cuZGVidWcoJ25vdGlmaWNhdGlvbnMuY29uc3RydWN0b3IoKSBub3RpZmljYXRpb25zIGdyYW50ZWQnKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubm90aWZpY2F0aW9uc0dyYW50ZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIC8v0YHQu9GD0YjQsNGC0LXQu9GMINC60LvQuNC60L7QsiDQv9C+INGD0LLQtdC00L7QvNC70LXQvdC40Y5cclxuICAgICAgICAgICAgICAgIGNocm9tZS5ub3RpZmljYXRpb25zLm9uQ2xpY2tlZC5hZGRMaXN0ZW5lcih0aGlzLm9uQ2xpY2tlZCk7XHJcbiAgICAgICAgICAgICAgICAvL9GB0LvRg9GI0LDRgtC10LvRjCDQutC70LjQutC+0LIg0L/QviDQutC90L7Qv9C60LDQvCDRg9Cy0LXQtNC+0LzQu9C10L3QuNGPXHJcbiAgICAgICAgICAgICAgICBjaHJvbWUubm90aWZpY2F0aW9ucy5vbkJ1dHRvbkNsaWNrZWQuYWRkTGlzdGVuZXIodGhpcy5vbkJ1dHRvbkNsaWNrZWQpO1xyXG4gICAgICAgICAgICAgICAgLy/RgdC70YPRiNCw0YLQtdC70Ywg0LfQsNC60YDRi9GC0LjRjyDRg9Cy0LXQtNC+0LzQu9C10L3QuNGPXHJcbiAgICAgICAgICAgICAgICBjaHJvbWUubm90aWZpY2F0aW9ucy5vbkNsb3NlZC5hZGRMaXN0ZW5lcih0aGlzLm9uQ2xvc2VkKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxvZy53YXJuKCdub3RpZmljYXRpb25zLmNvbnN0cnVjdG9yKCkgbm90aWZpY2F0aW9ucyBkZW5pZWQnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmNyZWF0ZSA9IHRoaXMuY3JlYXRlLmJpbmQodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgb25DbG9zZWQgPSAoaWQsIGJ5VXNlcikgPT4ge1xyXG4gICAgICAgIGxvZy5kZWJ1Zygnbm90aWZpY2F0aW9ucy5vbkNsb3NlZCgpIHdpdGggaWQgPCVzPiwgYnlVc2VyIDwlbz4nLCBpZCwgYnlVc2VyKTtcclxuICAgICAgICBpZiAodGhpcy5pZCAmJiBpZCA9PSB0aGlzLmlkKSB7XHJcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmF1dG9DbG9zZVRpbWVyKTtcclxuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnRvYXN0SWQgJiYgaWQgPT0gdGhpcy50b2FzdElkKSB7XHJcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmF1dG9DbG9zZVRpbWVyVG9hc3QpO1xyXG4gICAgICAgICAgICB0aGlzLnRvYXN0SWQgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgY2xlYXIgPSAoaWQpID0+IHtcclxuICAgICAgICBsb2cuZGVidWcoJ25vdGlmaWNhdGlvbnMuY2xlYXIoKScpO1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghaWQpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL9Cy0YvQt9C+0LLQtdGCINGB0L7QsdGL0YLQuNC1IG9uQ2xvc2VkXHJcbiAgICAgICAgICAgIGNocm9tZS5ub3RpZmljYXRpb25zLmNsZWFyKGlkLCAoKSA9PiByZXNvbHZlKCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBfY3JlYXRlTm90aWZpY2F0aW9uKGljb24sIG1zZywgYnV0dG9ucyA9IFtdLCB0aW1lclZhciwgdGltZXIgPSBzdG9yYWdlLmdldCgndGltZScpICogMTAwMCwgbm90aWZJZCA9IHV0aWxzLmd1aWQoKSkge1xyXG4gICAgICAgIGxvZy5kZWJ1Zygnbm90aWZpY2F0aW9ucy5fY3JlYXRlTm90aWZpY2F0aW9uKCkgd2l0aCBtZXNzYWdlIDwlcz4gYW5kIGljb24gPCVzPicsIG1zZywgaWNvbik7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLm5vdGlmaWNhdGlvbnNHcmFudGVkKSB7XHJcbiAgICAgICAgICAgICAgICBsb2cuZGVidWcoJ25vdGlmaWNhdGlvbnMuX2NyZWF0ZU5vdGlmaWNhdGlvbigpIG5vdGlmaWNhdGlvbnMgbm90IGdyYW50ZWQnKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy/RgdC+0LfQtNCw0LXQvCDRgtC10LvQviDRg9Cy0LXQtNC+0LzQu9C10L3QuNGPXHJcbiAgICAgICAgICAgIGxldCBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IG1zZyxcclxuICAgICAgICAgICAgICAgIGljb25Vcmw6IGljb24sXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnYmFzaWMnLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJycsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmIChidXR0b25zICYmIGJ1dHRvbnMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLmJ1dHRvbnMgPSBidXR0b25zO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxvZy5kZWJ1Zygnbm90aWZpY2F0aW9ucy5fY3JlYXRlTm90aWZpY2F0aW9uKCkgY3JlYXRpbmcgbm90aWZpY2F0aW9uLCBvcHRpb25zICVvJywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIGNocm9tZS5ub3RpZmljYXRpb25zLmNyZWF0ZShub3RpZklkLCBvcHRpb25zLCBpZCA9PiB7XHJcbiAgICAgICAgICAgICAgICAvL9C30LDQv9GD0YHQutCw0LXQvCDRgtCw0LnQvNC10YAg0LDQutGC0L7Qt9Cw0LrRgNGL0YLQuNGPINC/0L4g0YLQsNC50LzQtdGA0YNcclxuICAgICAgICAgICAgICAgIHRpbWVyVmFyID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhcihpZCk7XHJcbiAgICAgICAgICAgICAgICB9LCB0aW1lcik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy/QstC+0LfQstGA0LDRidCw0LXQvCDQuNC00LXQvdGC0LjRhNC40LrQsNGC0L7RgFxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShpZCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZShwbGF5ZXIsIHBsYXllck1vZGUpIHtcclxuICAgICAgICBsb2cuZGVidWcoJ25vdGlmaWNhdGlvbnMuY3JlYXRlKCkgd2l0aCBwbGF5ZXIgJW8gYW5kIHBsYXllck1vZGUgPCVzPicsIHBsYXllciwgcGxheWVyTW9kZSk7XHJcblxyXG4gICAgICAgIC8v0YPQsdC40YDQsNC10Lwg0YPQstC10LTQvtC80LvQtdC90LjQtSDQuCDQtNCw0LvQtdC1INGB0L7Qt9C00LDQtdC8INC90L7QstC+0LVcclxuICAgICAgICB0aGlzLmNsZWFyKHRoaXMuaWQpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAvL9GB0L7Qt9C00LDQtdC8INC60L3QvtC/0LrQuFxyXG4gICAgICAgICAgICBsZXQgYnRucyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLmJ1dHRvbnNbcGxheWVyTW9kZV0uZmlsdGVyKGl0ZW0gPT4gaXRlbS52YWx1ZSgpKS5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgICAgICAgICAgYnRucy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogIWl0ZW0uaW52UGFyYW0gPyBpdGVtLnRpdGxlIDogaXRlbS50aXRsZVt+fiFwbGF5ZXIudHJhY2tbaXRlbS5pbnZQYXJhbV1dLFxyXG4gICAgICAgICAgICAgICAgICAgIGljb25Vcmw6ICFpdGVtLmludlBhcmFtID8gaXRlbS5pY29uIDogaXRlbS5pY29uW35+IXBsYXllci50cmFja1tpdGVtLmludlBhcmFtXV0sXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVOb3RpZmljYXRpb24oXHJcbiAgICAgICAgICAgICAgICBwbGF5ZXIuZ2V0Q292ZXJVUkwoJzgweDgwJyksXHJcbiAgICAgICAgICAgICAgICBgJHtwbGF5ZXIuZ2V0QXJ0aXN0cygpfSAtICR7cGxheWVyLnRyYWNrLnRpdGxlfWAgKyAoc3RvcmFnZS5nZXQoJ3BvcHVwX3Nob3dfdmVyc2lvbicpICYmIHBsYXllci50cmFjay52ZXJzaW9uID8gYCAoJHtwbGF5ZXIudHJhY2sudmVyc2lvbn0pYCA6ICcnKSxcclxuICAgICAgICAgICAgICAgIGJ0bnMsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmF1dG9DbG9zZVRpbWVyLFxyXG4gICAgICAgICAgICApLnRoZW4oaWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5ZXJNb2RlID0gcGxheWVyTW9kZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNDb25maXJtID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlkID0gaWQ7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZVRvYXN0KGljb24sIG1zZykge1xyXG4gICAgICAgIGxvZy5kZWJ1Zygnbm90aWZpY2F0aW9ucy5jcmVhdGVUb2FzdCgpIHdpdGggbWVzc2FnZSA8JXM+IGFuZCBpY29uIDwlcz4nLCBtc2csIGljb24pO1xyXG5cclxuICAgICAgICAvL9GD0LHQuNGA0LDQtdC8INGD0LLQtdC00L7QvNC70LXQvdC40LUg0Lgg0LTQsNC70LXQtSDRgdC+0LfQtNCw0LXQvCDQvdC+0LLQvtC1XHJcbiAgICAgICAgdGhpcy5jbGVhcih0aGlzLnRvYXN0SWQpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVOb3RpZmljYXRpb24oXHJcbiAgICAgICAgICAgICAgICBpY29uLFxyXG4gICAgICAgICAgICAgICAgbXNnLFxyXG4gICAgICAgICAgICAgICAgbnVsbCxcclxuICAgICAgICAgICAgICAgIHRoaXMuYXV0b0Nsb3NlVGltZXJUb2FzdCxcclxuICAgICAgICAgICAgKS50aGVuKGlkID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMudG9hc3RJZCA9IGlkO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVDb25maXJtYXRpb24gPSAoYWN0aW9uLCBxdWVzdGlvbiwgaWNvbikgPT4ge1xyXG4gICAgICAgIGxvZy5kZWJ1Zygnbm90aWZpY2F0aW9ucy5jcmVhdGVDb25maXJtYXRpb24oKSB3aXRoIGFjdGlvbiA8JXM+LCBxdWVzdGlvbiA8JXM+LCBpY29uIDwlcz4nLCBhY3Rpb24sIHF1ZXN0aW9uLCBpY29uKTtcclxuXHJcbiAgICAgICAgY29uc3QgdGFiID0gdGFicy5nZXRBY3RpdmVUYWIoKTtcclxuXHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuYXV0b0Nsb3NlVGltZXIpO1xyXG5cclxuICAgICAgICBpZiAoIXRhYikge1xyXG4gICAgICAgICAgICBsb2cuZGVidWcoJ25vdGlmaWNhdGlvbnMuY3JlYXRlQ29uZmlybWF0aW9uKCkgdGhlcmUgaXMgbm8gYWN0aXZlIHRhYnMnKTtcclxuICAgICAgICAgICAgdGhpcy5jbGVhcih0aGlzLmlkKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGJ0bnMgPSBbXTtcclxuICAgICAgICB0aGlzLmNvbmZpcm1CdXR0b25zLmZvckVhY2goYnV0dG9uID0+IHsgYnRucy5wdXNoKHt0aXRsZTogYnV0dG9uLnRpdGxlfSk7IH0pO1xyXG5cclxuICAgICAgICAvL9GD0LHQuNGA0LDQtdC8INGD0LLQtdC00L7QvNC70LXQvdC40LUg0Lgg0LTQsNC70LXQtSDRgdC+0LfQtNCw0LXQvCDQvdC+0LLQvtC1XHJcbiAgICAgICAgdGhpcy5jbGVhcih0aGlzLmlkKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fY3JlYXRlTm90aWZpY2F0aW9uKFxyXG4gICAgICAgICAgICAgICAgaWNvbixcclxuICAgICAgICAgICAgICAgIHF1ZXN0aW9uLFxyXG4gICAgICAgICAgICAgICAgYnRucyxcclxuICAgICAgICAgICAgICAgIHRoaXMuYXV0b0Nsb3NlVGltZXIsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpcm1UaW1lb3V0LFxyXG4gICAgICAgICAgICApLnRoZW4oaWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb25maXJtQWN0aW9uID0gYWN0aW9uO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0NvbmZpcm0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pZCA9IGlkO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgb25DbGlja2VkID0gaWQgPT4ge1xyXG4gICAgICAgIGxvZy50cmFjZSgnbm90aWZpY2F0aW9ucy5vbkNsaWNrZWQoKSB3aXRoIGlkIDwlcz4nLCBpZCk7XHJcbiAgICAgICAgaWYgKCF0YWJzLmdldEFjdGl2ZVRhYigpKSB7XHJcbiAgICAgICAgICAgIGxvZy50cmFjZSgnbm90aWZpY2F0aW9ucy5vbkNsaWNrZWQoKSB0aGVyZSBpcyBubyBhY3RpdmUgdGFicycpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoc3RvcmFnZS5nZXQoJ2ZvY3VzJykpIC8vaWYgKGlkLmluZGV4T2YoXCJjb25maXJtX1wiKSAhPT0gMCAmJiBzdG9yYWdlLmdldCgnZm9jdXMnKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxvZy50cmFjZSgnbm90aWZpY2F0aW9ucy5vbkNsaWNrZWQoKSBmb2N1c2luZyB3aW5kb3cgYWZ0ZXIgY2xpY2snKTtcclxuICAgICAgICAgICAgY2hyb21lLnRhYnMudXBkYXRlKHRhYnMuZ2V0QWN0aXZlVGFiKCkuaWQsIHthY3RpdmU6IHRydWV9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jbGVhcihpZCk7XHJcbiAgICB9O1xyXG5cclxuICAgIG9uQnV0dG9uQ2xpY2tlZCA9IChpZCwgaW5kZXgpID0+IHtcclxuICAgICAgICBsb2cuZGVidWcoJ25vdGlmaWNhdGlvbnMub25CdXR0b25DbGlja2VkKCkgd2l0aCBpZCA8JXM+LCBpbmRleCA8JWQ+JywgaWQsIGluZGV4KTtcclxuXHJcbiAgICAgICAgY29uc3QgdGFiID0gdGFicy5nZXRBY3RpdmVUYWIoKTtcclxuICAgICAgICBpZiAoIXRhYikge1xyXG4gICAgICAgICAgICBsb2cuZGVidWcoJ25vdGlmaWNhdGlvbnMub25CdXR0b25DbGlja2VkKCkgdGhlcmUgaXMgbm8gYWN0aXZlIHRhYnMnKTtcclxuICAgICAgICAgICAgdGhpcy5jbGVhcihpZCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmF1dG9DbG9zZVRpbWVyKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNDb25maXJtKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5jb25maXJtQnV0dG9uc1tpbmRleF0uY29uZmlybSkge1xyXG4gICAgICAgICAgICAgICAgbG9nLmRlYnVnKCdub3RpZmljYXRpb25zLm9uQnV0dG9uQ2xpY2tlZCgpIGNvbmZpcm0gY2FuY2VsZWQnKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxvZy5kZWJ1Zygnbm90aWZpY2F0aW9ucy5vbkJ1dHRvbkNsaWNrZWQoKSBjb25maXJtIGFwcHJvdmVkJyk7XHJcbiAgICAgICAgICAgICAgICB0YWIuc2VuZCh7YWN0aW9uOiB0aGlzLmNvbmZpcm1BY3Rpb259KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuYnV0dG9uc1t0aGlzLnBsYXllck1vZGVdLmZpbHRlcihpdGVtID0+IGl0ZW0udmFsdWUoKSlbaW5kZXhdO1xyXG5cclxuICAgICAgICAgICAgbG9nLmRlYnVnKCdub3RpZmljYXRpb25zLm9uQnV0dG9uQ2xpY2tlZCgpIHJlZ3VsYXIgYnV0dG9uIGNsaWNrIG9uIGJ1dHRvbiAlbycsIGJ1dHRvbik7XHJcblxyXG4gICAgICAgICAgICBpZiAoYnV0dG9uLmNvbmZpcm0gIT09IHVuZGVmaW5lZCAmJiBzdG9yYWdlLmdldChidXR0b24uY29uZmlybS5vcHRpb24pKSB7XHJcbiAgICAgICAgICAgICAgICBsb2cuZGVidWcoJ25vdGlmaWNhdGlvbnMub25CdXR0b25DbGlja2VkKCkgY3JlYXRpbmcgY29uZmlybWF0aW9uICVvIG9mIGFjdGlvbiA8JXM+JywgYnV0dG9uLmNvbmZpcm0sIGJ1dHRvbi5hY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVDb25maXJtYXRpb24oYnV0dG9uLmFjdGlvbiwgYnV0dG9uLmNvbmZpcm0udGl0bGUsIGJ1dHRvbi5jb25maXJtLmljb24pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbG9nLmRlYnVnKCdub3RpZmljYXRpb25zLm9uQnV0dG9uQ2xpY2tlZCgpIHNlbmRpbmcgYWN0aW9uIDwlcz4gdG8gYWN0aXZlIHRhYicsIGJ1dHRvbi5hY3Rpb24pO1xyXG4gICAgICAgICAgICAgICAgdGFiLnNlbmQoe2FjdGlvbjogYnV0dG9uLmFjdGlvbn0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY2xlYXIoaWQpO1xyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3IG5vdGlmaWNhdGlvbnMoKTtcclxuIiwiaW1wb3J0IGxvZyBmcm9tICdsb2dsZXZlbCc7XHJcbmltcG9ydCBqcXVlcnlfZXh0ZW5kIGZyb20gJ2pxdWVyeS1leHRlbmQnO1xyXG5cclxuY2xhc3MgcGxheWVyIHtcclxuICAgIGlzUGxheWluZyA9IGZhbHNlO1xyXG4gICAgaXNBZHZlcnQgPSBmYWxzZTtcclxuICAgIHRyYWNrID0ge1xyXG4gICAgICAgIGFsYnVtOiBudWxsLFxyXG4gICAgICAgIGFydGlzdHM6IG51bGwsXHJcbiAgICAgICAgY292ZXI6IG51bGwsXHJcbiAgICAgICAgZGlzbGlrZWQ6IG51bGwsXHJcbiAgICAgICAgbGlrZWQ6IG51bGwsXHJcbiAgICAgICAgbGluazogbnVsbCxcclxuICAgICAgICB0aXRsZTogbnVsbCxcclxuICAgICAgICB2ZXJzaW9uOiBudWxsLFxyXG4gICAgfTtcclxuICAgIHByb2dyZXNzID0ge1xyXG4gICAgICAgIHBvc2l0aW9uOiBudWxsLFxyXG4gICAgICAgIGR1cmF0aW9uOiBudWxsLFxyXG4gICAgICAgIGxvYWRlZDogbnVsbCxcclxuICAgIH07XHJcbiAgICBzb3VyY2UgPSB7XHJcbiAgICAgICAgdGl0bGU6IG51bGwsXHJcbiAgICAgICAgbGluazogbnVsbCxcclxuICAgICAgICB0eXBlOiBudWxsLFxyXG4gICAgICAgIGNvdmVyOiBudWxsLFxyXG4gICAgICAgIG93bmVyOiBudWxsLFxyXG4gICAgfTtcclxuICAgIGNvbnRyb2xzID0ge1xyXG4gICAgICAgIHN0YXRlczoge1xyXG4gICAgICAgICAgICBkaXNsaWtlOiBudWxsLFxyXG4gICAgICAgICAgICBpbmRleDogbnVsbCxcclxuICAgICAgICAgICAgbGlrZTogbnVsbCxcclxuICAgICAgICAgICAgbmV4dDogbnVsbCxcclxuICAgICAgICAgICAgcHJldjogbnVsbCxcclxuICAgICAgICAgICAgcmVwZWF0OiBudWxsLFxyXG4gICAgICAgICAgICBzaHVmZmxlOiBudWxsLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2h1ZmZsZTogbnVsbCxcclxuICAgICAgICByZXBlYXQ6IG51bGwsXHJcbiAgICAgICAgdm9sdW1lOiBudWxsLFxyXG4gICAgfTtcclxuICAgIHBsYXlsaXN0ID0ge1xyXG4gICAgICAgIHByZXY6IG51bGwsXHJcbiAgICAgICAgbGlzdDogbnVsbCxcclxuICAgICAgICBpbmRleDogbnVsbCxcclxuICAgICAgICBuZXh0OiBudWxsLFxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHt9XHJcblxyXG4gICAgZ2V0QXJ0aXN0cyA9ICgpID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ3BsYXllci5nZXRBcnRpc3RzKCknKTtcclxuICAgICAgICByZXR1cm4gdGhpcy50cmFjay5hcnRpc3RzXHJcbiAgICAgICAgICAgID8gdGhpcy50cmFjay5hcnRpc3RzLm1hcCgoaSkgPT4gaS50aXRsZSkuam9pbignLCAnKVxyXG4gICAgICAgICAgICA6IG51bGw7XHJcbiAgICB9O1xyXG5cclxuICAgIGdldENvdmVyVVJMID0gKHNpemUsIGN0eCA9IHRoaXMpID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ3BsYXllci5nZXRDb3ZlclVSTCgpIHdpdGggc2l6ZSA8JXM+Jywgc2l6ZSk7XHJcblxyXG4gICAgICAgIGNvbnN0IF9jb3ZlciA9ICdodHRwczovL211c2ljLnlhbmRleC5ydS9ibG9ja3MvcGxheWxpc3QtY292ZXItc3RhY2svcGxheWxpc3QtY292ZXJfbm9fY292ZXIzLnBuZyc7XHJcbiAgICAgICAgbGV0IGNvdmVyID0gX2NvdmVyO1xyXG5cclxuICAgICAgICBpZiAoIWN0eC50cmFjaykge1xyXG4gICAgICAgICAgICByZXR1cm4gX2NvdmVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGN0eC50cmFjay5jb3Zlcikge1xyXG4gICAgICAgICAgICBjb3ZlciA9IGN0eC50cmFjay5jb3ZlcjtcclxuICAgICAgICB9IGVsc2UgaWYgKGN0eC50cmFjay5hbGJ1bSAmJiBjdHgudHJhY2suYWxidW0uY292ZXIpIHtcclxuICAgICAgICAgICAgY292ZXIgPSBjdHgudHJhY2suYWxidW0uY292ZXI7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjdHguc291cmNlLmNvdmVyKSB7XHJcbiAgICAgICAgICAgIGNvdmVyID0gY3R4LnNvdXJjZS5jb3ZlcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgY292ZXIgPT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgY292ZXIgPSBjb3Zlci5sZW5ndGggPyBjb3ZlclswXSA6IF9jb3ZlcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvdmVyID0gY292ZXIucmVwbGFjZSgnJSUnLCBzaXplKTtcclxuICAgICAgICBpZiAoY292ZXIuaW5kZXhPZignaHR0cCcpID09IC0xKSB7XHJcbiAgICAgICAgICAgIGNvdmVyID0gJ2h0dHBzOi8vJyArIGNvdmVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNvdmVyO1xyXG4gICAgfTtcclxuXHJcbiAgICB1cGRhdGUgPSAoZGF0YSwgZGVlcCA9IGZhbHNlKSA9PiB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCdwbGF5ZXIudXBkYXRlKCkgd2l0aCBkYXRhICVvJywgZGF0YSk7XHJcbiAgICAgICAgaWYgKGRlZXApIHtcclxuICAgICAgICAgICAganF1ZXJ5X2V4dGVuZChkZWVwLCB0aGlzLCBkYXRhKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhkYXRhKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW2tleV0gPSBkYXRhW2tleV07XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsb2cudHJhY2UoXCJwbGF5ZXIudXBkYXRlKCkgdXBkYXRlZCBwbGF5ZXIgJW9cIiwgdGhpcyk7XHJcbiAgICB9O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBwbGF5ZXI7XHJcbiIsImltcG9ydCB1dGlscyBmcm9tICcuLi9jb21tb24vdXRpbHMnO1xyXG5cclxuY2xhc3Mgc3RvcmFnZSB7XHJcbiAgICBkZWZhdWx0cyA9IHtcclxuICAgICAgICBhZGR0bzogdHJ1ZSxcclxuICAgICAgICBtcl9hZGR0bzogdHJ1ZSxcclxuICAgICAgICByYWRpb19saWtlOiB0cnVlLFxyXG4gICAgICAgIGRpc2xpa2U6IGZhbHNlLFxyXG4gICAgICAgIG1yX2Rpc2xpa2U6IHRydWUsXHJcbiAgICAgICAgcmFkaW9fZGlzbGlrZTogdHJ1ZSxcclxuICAgICAgICBuZXh0OiB0cnVlLFxyXG4gICAgICAgIG1yX25leHQ6IGZhbHNlLFxyXG4gICAgICAgIHJhZGlvX25leHQ6IGZhbHNlLFxyXG4gICAgICAgIGZvY3VzOiB0cnVlLFxyXG4gICAgICAgIHRpbWU6IDQsXHJcbiAgICAgICAgdHlwZTogJ2hvdGtfdHInLFxyXG4gICAgICAgIGF1dG9vcGVuOiB0cnVlLFxyXG4gICAgICAgIGhvdGtleV9saWtlX2FjdGlvbjogJ2FzaycsXHJcbiAgICAgICAgaG90a2V5X2Rpc2xpa2VfYWN0aW9uOiB0cnVlLFxyXG4gICAgICAgIGhvdGtleV9yZXBlYXRfbm90aWY6IGZhbHNlLFxyXG4gICAgICAgIG1fZGlzbGlrZV9hY3Rpb246IHRydWUsXHJcbiAgICAgICAgbXJfZGlzbGlrZV9hY3Rpb246IHRydWUsXHJcbiAgICAgICAgcmFkaW9fZGlzbGlrZV9hY3Rpb246IHRydWUsXHJcbiAgICAgICAgbmV3X3RhYl9waW5uZWQ6IGZhbHNlLFxyXG4gICAgICAgIGdsb2JhbF9tb2RlOiAncG9wdXAnLFxyXG4gICAgICAgIHBvcHVwX3Nob3dfdmFyOiAnZnVsbCcsXHJcbiAgICAgICAgcG9wdXBfc2hvd192ZXJzaW9uOiB0cnVlLFxyXG4gICAgICAgIHBvcHVwX3Nob3dfcl9zaDogdHJ1ZSxcclxuICAgICAgICBwb3B1cF92b2x1bWVfY2xpY2tfdG9nZ2xlOiAnMCcsXHJcbiAgICAgICAgY2xvc2VfYWxlcnQ6IHRydWUsXHJcbiAgICAgICAgc2Nyb2JibGluZzogZmFsc2UsXHJcbiAgICAgICAgc2Nyb2JibGluZ19maWxlbmFtZTogJ3ltdXNpYy50eHQnLFxyXG4gICAgICAgIHNjcm9iYmxpbmdfZm9ybWF0OiAn0KHQtdC50YfQsNGBINC40LPRgNCw0LXRgjogJWFydGlzdHMlIC0gJXRyYWNrJScsXHJcbiAgICAgICAgdXNlcl9pZDogKCkgPT4gdXRpbHMuZ3VpZCgpLFxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc3RvcmFnZScsIHRoaXMub25TdG9yYWdlQ2hhbmdlKTtcclxuICAgIH1cclxuXHJcbiAgICBvblN0b3JhZ2VDaGFuZ2UgPSBlID0+IHtcclxuICAgICAgICBpZiAodGhpcy5vblN0b3JhZ2VDaGFuZ2VDYikge1xyXG4gICAgICAgICAgICB0aGlzLm9uU3RvcmFnZUNoYW5nZUNiKGUpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgb25TdG9yYWdlQ2hhbmdlQ2IgPSByZXF1ZXN0ID0+IHt9O1xyXG5cclxuICAgIGFkZE9uU3RvcmFnZUNoYW5nZUNiID0gY2IgPT4ge1xyXG4gICAgICAgIHRoaXMub25TdG9yYWdlQ2hhbmdlQ2IgPSBjYjtcclxuICAgIH07XHJcblxyXG4gICAgZ2V0QWxsID0gKHJlbW92ZVByZWZpeCA9IGZhbHNlKSA9PiB7XHJcbiAgICAgICAgbGV0IGFsbCA9IHt9O1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbG9jYWxTdG9yYWdlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBrZXkgPSBsb2NhbFN0b3JhZ2Uua2V5KGkpO1xyXG4gICAgICAgICAgICBpZiAoa2V5LmluZGV4T2YoJ3N0b3JlLnNldHRpbmdzJykgIT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIGFsbFtyZW1vdmVQcmVmaXggPyBrZXkucmVwbGFjZSgnc3RvcmUuc2V0dGluZ3MuJywgJycpIDoga2V5XSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFsbDtcclxuICAgIH07XHJcblxyXG4gICAgZ2V0ID0ga2V5ID0+IHtcclxuICAgICAgICBjb25zdCB2YWx1ZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzdG9yZS5zZXR0aW5ncy4nICsga2V5KTtcclxuICAgICAgICByZXR1cm4gKHZhbHVlID09PSBudWxsKSA/IHRoaXMuZGVmYXVsdHNba2V5XSA6IEpTT04ucGFyc2UodmFsdWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBzZXQgPSAoa2V5LCB2YWx1ZSkgPT4ge1xyXG4gICAgICAgIGlmICghdGhpcy5kZWZhdWx0cy5oYXNPd25Qcm9wZXJ0eShrZXkpKSAvL3RoaXMuZGVmYXVsdHNba2V5XSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3N0b3JlLnNldHRpbmdzLicgKyBrZXksIEpTT04uc3RyaW5naWZ5KHZhbHVlKSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGluaXQgPSAoKSA9PiB7XHJcbiAgICAgICAgT2JqZWN0LmtleXModGhpcy5kZWZhdWx0cykuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgICAgICBpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3N0b3JlLnNldHRpbmdzLicgKyBrZXkpID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldChrZXksIHR5cGVvZiB0aGlzLmRlZmF1bHRzW2tleV0gPT0gJ2Z1bmN0aW9uJyA/IHRoaXMuZGVmYXVsdHNba2V5XSgpIDogdGhpcy5kZWZhdWx0c1trZXldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBjbGVhciA9ICgpID0+IHtcclxuICAgICAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKTtcclxuICAgIH07XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG5ldyBzdG9yYWdlKCk7XHJcbiIsImltcG9ydCBsb2cgZnJvbSAnbG9nbGV2ZWwnO1xyXG5pbXBvcnQgdGFicyBmcm9tICcuL3RhYnMnO1xyXG5pbXBvcnQgcGxheWVyIGZyb20gJy4vcGxheWVyJztcclxuaW1wb3J0IGV4dCBmcm9tICcuLi9iZy9leHQnO1xyXG5pbXBvcnQgYnJvd3NlckFjdGlvbiBmcm9tICcuL2Jyb3dzZXJBY3Rpb24nO1xyXG5pbXBvcnQgbm90aWZpY2F0aW9ucyBmcm9tICcuL25vdGlmaWNhdGlvbnMnO1xyXG5pbXBvcnQgc3RvcmFnZSBmcm9tICcuL3N0b3JhZ2UnO1xyXG5pbXBvcnQgdXRpbHMgZnJvbSAnLi4vY29tbW9uL3V0aWxzJztcclxuaW1wb3J0IGRvd25sb2FkZXIgZnJvbSAnLi9kb3dubG9hZGVyJztcclxuXHJcblN0cmluZy5wcm90b3R5cGUuY2FwaXRhbGl6ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0aGlzLnNsaWNlKDEpO1xyXG59O1xyXG5PYmplY3QucHJvdG90eXBlLmZpbHRlciA9IGZ1bmN0aW9uKHByZWRpY2F0ZSkge1xyXG4gICAgbGV0IHJlc3VsdCA9IHt9O1xyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcykge1xyXG4gICAgICAgIGlmICh0aGlzLmhhc093blByb3BlcnR5KGtleSkgJiYgcHJlZGljYXRlKHRoaXNba2V5XSkpIHtcclxuICAgICAgICAgICAgcmVzdWx0W2tleV0gPSB0aGlzW2tleV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbmNsYXNzIHRhYiB7XHJcbiAgICAvL9GC0LDQudC80LXRgCDQvNC+0L3QuNGC0L7RgNGP0YnQuNC5INC20LjQstGD0YfQtdGB0YLRjCDQstC60LvQsNC00LrQuFxyXG4gICAgdGltZXIgPSBudWxsO1xyXG4gICAgLy/QuNC00LXQvdGC0LjRhNC40LrQsNGC0L7RgFxyXG4gICAgaWQgPSBudWxsO1xyXG4gICAgLy/QtdGB0YLRjCDQu9C4INGE0L7QutGD0YEg0L3QsCDQstC60LvQsNC00LrQtVxyXG4gICAgZm9jdXNlZCA9IGZhbHNlO1xyXG4gICAgLy/RgtC40L8g0LLQutC70LDQtNC60Lg6INGA0LDQtNC40L4g0LjQu9C4INC80YPQt9GL0LrQsFxyXG4gICAgdHlwZSA9IG51bGw7XHJcbiAgICAvL9Cy0YDQtdC80Y8g0YHQvtC30LTQsNC90LjRjyDQstC60LvQsNC00LrQuFxyXG4gICAgb3BlbmVkVGltZSA9IG51bGw7XHJcbiAgICAvL9C/0LvQtdC10YBcclxuICAgIHBsYXllciA9IG51bGw7XHJcbiAgICAvL9C/0L7RgNGCINC00LvRjyDRgdCy0Y/Qt9C4INGBIENTINGB0LrRgNC40L/RgtC+0Lwg0L3QsCDRgdGC0YDQsNC90LjRhtC1INCy0LrQu9Cw0LTQutC4XHJcbiAgICBjc0Nvbm5lY3Rpb24gPSBudWxsO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHRhYklkLCB0YWJUeXBlKSB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCd0YWIuY29uc3RydWN0b3IoKSB3aXRoIGlkIDwlZD4gYW5kIHR5cGUgPCVzPicsIHRhYklkLCB0YWJUeXBlKTtcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IHRhYklkO1xyXG4gICAgICAgIHRoaXMub3BlbmVkVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgIHRoaXMudHlwZSA9IHRhYlR5cGU7XHJcbiAgICAgICAgLy/RgNCw0Lcg0LIg0YHQtdC60YPQvdC00YMg0L/RgNC+0LLQtdGA0Y/QtdC8INC20LjQstCwINC70Lgg0LLQutC70LDQtNC60LBcclxuICAgICAgICB0aGlzLnRpbWVyID0gc2V0SW50ZXJ2YWwodGhpcy5hbGl2ZUNoZWNrLCAxMDAwKTtcclxuICAgICAgICAvL9C40L3QuNGG0LjQsNC70LjQt9C40YDRg9C10Lwg0L/Qu9C10LXRgFxyXG4gICAgICAgIHRoaXMucGxheWVyID0gbmV3IHBsYXllcigpO1xyXG4gICAgfVxyXG5cclxuICAgIGFsaXZlQ2hlY2sgPSAoKSA9PiB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCd0YWIuYWxpdmVDaGVjaygpJyk7XHJcblxyXG4gICAgICAgIGNocm9tZS50YWJzLmdldCh0aGlzLmlkLCB0YWIgPT4ge1xyXG4gICAgICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBsb2cudHJhY2UoJ3RhYicsIHRoaXMuaWQsICdyZW1vdmVkIGR1ZSBpdFxcJ3MgdW5hdmFpbGFiaWxpdHknKTtcclxuICAgICAgICAgICAgICAgIGxvZy5lcnJvcignVGFiIGNsb3NlZCB2aWEgaXRcXCdzIHVuYXZhaWxhYmlsaXR5IHdoaWxlIGFsaXZlIGNoZWNrJyk7XHJcbiAgICAgICAgICAgICAgICAvL9Cy0LrQu9Cw0LTQutCwINC90LUg0L3QsNC50LTQtdC90LAsINGD0LTQsNC70Y/QtdC8INCy0LrQu9Cw0LTQutGDICjRgtCw0LnQvNC10YAg0LHRg9C00LXRgiDQvtGH0LjRidC10L0g0LIg0LzQtdGC0L7QtNC1IHNodXRkb3duKVxyXG4gICAgICAgICAgICAgICAgdGFicy5zaHV0ZG93bih0aGlzLmlkKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vVE9ETzog0L3QsNC00L4g0LTQvtCx0LDQstC40YLRjCDQvdC10LrRg9GOINC00L7Qv9C+0LvQvdC40YLQtdC70YzQvdGD0Y4g0LvQvtCz0LjQutGDINC/0YDQvtCy0LXRgNC60Lgg0LLQutC70LDQtNC60Lgg0L3QsCDQttC40LLRg9GH0LXRgdGC0YwganNcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBhZGRQb3J0ID0gcG9ydCA9PiB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCd0YWIuYWRkUG9ydCgpIHdpdGggcG9ydCAlbycsIHBvcnQpO1xyXG4gICAgICAgIHRoaXMuY3NDb25uZWN0aW9uID0gcG9ydDtcclxuICAgICAgICB0aGlzLmNzQ29ubmVjdGlvbi5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIodGhpcy5vbk1lc3NhZ2UpO1xyXG4gICAgICAgIHRoaXMuY3NDb25uZWN0aW9uLm9uRGlzY29ubmVjdC5hZGRMaXN0ZW5lcih0aGlzLm9uRGlzY29ubmVjdCk7XHJcbiAgICB9O1xyXG5cclxuICAgIG9uRGlzY29ubmVjdCA9ICgpID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ3RhYi5vbkRpc2Nvbm5lY3QoKScpO1xyXG4gICAgICAgIC8v0LTQviDRgNC10YTQsNC60YLQvtGA0LjQvdCz0LAg0LLQvtC30L3QuNC60LDQu9CwINC/0YDQvtCx0LvQtdC80LAg0LrQvtCz0LTQsCDQv9GA0Lgg0LjQt9C80LXQvdC10L3QuNC4INGD0YDQu9CwINGB0YLRgNCw0L3QuNGG0Ysg0L3QtSDQv9GA0L7QuNGB0YXQvtC00LjRgiDRgdC+0LHRi9GC0LjQtSBvbnVubG9hZCDQuCDRjdGC0L5cclxuICAgICAgICAvL9C/0YDQuNCy0L7QtNC40YIg0Log0L7RiNC40LHQutC1LCDQvdC+INC30LDRgtC+INC/0YDQvtC40YHRhdC+0LTQuNGCINGB0L7QsdGL0YLQuNC1IG9uRGlzY29ubmVjdCDRgyDQv9C+0YDRgtCwLCDQv9C+0Y3RgtC+0LzRgyDQtNGD0LHQu9C40YDRg9C10Lwg0YTRg9C90LrRhtC40L7QvdCw0Lsg0LfQsNC60YDRi9GC0LjRj1xyXG4gICAgICAgIC8v0LLQutC70LDQtNC60LhcclxuICAgICAgICBsb2cuZXJyb3IoJ1RhYiBjbG9zZWQgdmlhIGNzIHBvcnQgZGlzY29ubmVjdGVkJyk7XHJcbiAgICAgICAgdGFicy5zaHV0ZG93bih0aGlzLmlkKTtcclxuICAgICAgICAvL3RoaXMuY3NDb25uZWN0aW9uID0gbnVsbDtcclxuICAgIH07XHJcblxyXG4gICAgb25NZXNzYWdlID0gKG1zZywgcG9ydCkgPT4ge1xyXG4gICAgICAgIGxvZy50cmFjZSgndGFiLm9uTWVzc2FnZSgpIHdpdGggbWVzc2FnZSAlbyBmcm9tIHBvcnQgJW8nLCBtc2csIHBvcnQpO1xyXG5cclxuICAgICAgICBpZiAoIW1zZy5hY3Rpb24pIHtcclxuICAgICAgICAgICAgbG9nLnRyYWNlKCd0YWIub25NZXNzYWdlKCkgaW52YWxpZCBtZXNzYWdlJyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgYWN0aW9uTGlzdGVuZXJOYW1lID0gYG9uJHttc2cuYWN0aW9uLmNhcGl0YWxpemUoKX1BY3Rpb25gO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuaGFzT3duUHJvcGVydHkoYWN0aW9uTGlzdGVuZXJOYW1lKSkge1xyXG4gICAgICAgICAgICBsb2cudHJhY2UoJ3RhYi5vbk1lc3NhZ2UoKSBsaXN0ZW5lciBvZiBhY3Rpb24gPCVzPiBub3QgZGVmaW5lZCcsIG1zZy5hY3Rpb24pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBpc0FjdGl2ZSA9ICh0YWJzLmdldEFjdGl2ZVRhYigpLmlkID09IHRoaXMuaWQpO1xyXG4gICAgICAgICAgICBsb2cudHJhY2UoJ3RhYi5vbk1lc3NhZ2UoKSBjYWxsaW5nIGFjdGlvbiBsaXN0ZW5lciA8JXM+LCBpcyBhY3RpdmUgdGFiIDwlbz4nLCBhY3Rpb25MaXN0ZW5lck5hbWUsIGlzQWN0aXZlKTtcclxuICAgICAgICAgICAgdGhpc1thY3Rpb25MaXN0ZW5lck5hbWVdLmNhbGwodGhpcywgbXNnLCBpc0FjdGl2ZSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkgeyB1dGlscy5lcnJvckhhbmRsZXIoZSk7IH1cclxuICAgIH07XHJcblxyXG4gICAgc2VuZCA9IGRhdGEgPT4ge1xyXG4gICAgICAgIGxvZy50cmFjZSgndGFiLnNlbmQoKSB3aXRoIGRhdGEgJW8nLCBkYXRhKTtcclxuICAgICAgICBpZiAodGhpcy5jc0Nvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3NDb25uZWN0aW9uLnBvc3RNZXNzYWdlKGRhdGEpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBsb2cuZXJyb3IoJ3RhYi5zZW5kKCkgZXJyb3InLCBlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3NDb25uZWN0aW9uID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgb25GdWxsc3RhdGVBY3Rpb24gPSAobXNnLCBpc0FjdGl2ZSkgPT4ge1xyXG4gICAgICAgIGxvZy50cmFjZSgndGFiLm9uRnVsbHN0YXRlKCkgd2l0aCBtZXNzYWdlICVvLCBpcyBhY3RpdmUgdGFiICVvJywgbXNnLCBpc0FjdGl2ZSk7XHJcblxyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KCd1c2VyX2lkJywgbXNnLnVzZXIudWlkID8gbXNnLnVzZXIudWlkIDogbXNnLnVzZXIuZGlkKTtcclxuXHJcbiAgICAgICAgdGhpcy5wbGF5ZXIudXBkYXRlKHtcclxuICAgICAgICAgICAgJ3RyYWNrJzogbXNnLnRyYWNrLFxyXG4gICAgICAgICAgICAncHJvZ3Jlc3MnOiBtc2cucHJvZ3Jlc3MsXHJcbiAgICAgICAgICAgICdzb3VyY2UnOiBtc2cuc291cmNlLFxyXG4gICAgICAgICAgICAnY29udHJvbHMnOiBtc2cuY29udHJvbHMsXHJcbiAgICAgICAgICAgICdwbGF5bGlzdCc6IG1zZy5wbGF5bGlzdCxcclxuICAgICAgICAgICAgJ2lzUGxheWluZyc6IG1zZy5pc1BsYXlpbmcsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKGlzQWN0aXZlKSB7XHJcbiAgICAgICAgICAgIC8v0L7QsdC90L7QstC70Y/QtdC8INC40LrQvtC90LrRgyDQvdCwINC/0LDQvdC10LvQuCDQsdGA0LDRg9C30LXRgNCwXHJcbiAgICAgICAgICAgIGJyb3dzZXJBY3Rpb24udXBkYXRlKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZXh0LnBvcHVwQ29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgLy9vbGRcclxuICAgICAgICAgICAgICAgIGV4dC5wb3B1cENvbm5lY3Rpb24uc2VuZChbJ3RyYWNrJywgJ3Byb2dyZXNzJywgJ3NvdXJjZScsICdjb250cm9scycsICdwbGF5bGlzdCcsICdpc1BsYXlpbmcnXSk7XHJcbiAgICAgICAgICAgICAgICAvL25ld1xyXG4gICAgICAgICAgICAgICAgZXh0LnBvcHVwQ29ubmVjdGlvbi5zZW5kKHthY3Rpb246ICd0cmFjaycsIHBheWxvYWQ6IG1zZy50cmFja30pO1xyXG4gICAgICAgICAgICAgICAgZXh0LnBvcHVwQ29ubmVjdGlvbi5zZW5kKHthY3Rpb246ICdwcm9ncmVzcycsIHBheWxvYWQ6IG1zZy5wcm9ncmVzc30pO1xyXG4gICAgICAgICAgICAgICAgZXh0LnBvcHVwQ29ubmVjdGlvbi5zZW5kKHthY3Rpb246ICdzb3VyY2UnLCBwYXlsb2FkOiB7Li4ubXNnLnNvdXJjZSwgdGFiVHlwZTogdGhpcy50eXBlfX0pO1xyXG4gICAgICAgICAgICAgICAgZXh0LnBvcHVwQ29ubmVjdGlvbi5zZW5kKHthY3Rpb246ICdjb250cm9scycsIHBheWxvYWQ6IG1zZy5jb250cm9sc30pO1xyXG4gICAgICAgICAgICAgICAgZXh0LnBvcHVwQ29ubmVjdGlvbi5zZW5kKHthY3Rpb246ICdwbGF5bGlzdCcsIHBheWxvYWQ6IG1zZy5wbGF5bGlzdH0pO1xyXG4gICAgICAgICAgICAgICAgZXh0LnBvcHVwQ29ubmVjdGlvbi5zZW5kKHthY3Rpb246ICdpc1BsYXlpbmcnLCBwYXlsb2FkOiBtc2cuaXNQbGF5aW5nfSk7XHJcbiAgICAgICAgICAgICAgICAvL9GN0YLQvtGCINC/0LDRgNCw0LzQtdGC0YAg0LzRiyDRhdGA0LDQvdC40Lwg0LIg0YHQvtGB0YLQvtGP0L3QuNC4INGE0L7QvdC+0LLQvtC5INGB0YLRgNCw0L3QuNGG0YssINGCLtC6LiDQutC+0L3RgtC10L3Rgi3RgdGC0YDQsNC90LjRhtCwINC90LUg0LjQvNC10LXRgiDQvNC10YLQvtC00LAsXHJcbiAgICAgICAgICAgICAgICAvL9Cy0L7Qt9Cy0YDQsNGJ0LDRjtGJ0LXQs9C+INGE0LvQsNCzINGA0LXQutC70LDQvNCwINGB0LXQudGH0LDRgSDQuNC70Lgg0L3QtdGCINC4INC+0LHQvdC+0LLQu9GP0LXRgtGB0Y8g0YLQvtC70YzQutC+INGH0LXRgNC10Lcgb25BZHZlcnRBY3Rpb24sINC/0L7Qu9GD0YfQtdC90L3QvtCz0L5cclxuICAgICAgICAgICAgICAgIC8v0L7RgiDQutC+0L3RgtC10L3Rgi3RgdGC0YDQsNC90LjRhtGLLlxyXG4gICAgICAgICAgICAgICAgZXh0LnBvcHVwQ29ubmVjdGlvbi5zZW5kKHthY3Rpb246ICdhZHZlcnQnLCBwYXlsb2FkOiB0aGlzLnBsYXllci5pc0FkdmVydH0pO1xyXG4gICAgICAgICAgICAgICAgbG9nLnRyYWNlKCd0YWIub25GdWxsc3RhdGUoKSBldmVudCBzZW50IHRvIHBvcHVwJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIG9uU3RhdGVBY3Rpb24gPSAobXNnLCBpc0FjdGl2ZSkgPT4ge1xyXG4gICAgICAgIGxvZy50cmFjZSgndGFiLm9uU3RhdGUoKSB3aXRoIG1lc3NhZ2UgJW8sIGlzIGFjdGl2ZSB0YWIgJW8nLCBtc2csIGlzQWN0aXZlKTtcclxuICAgICAgICB0aGlzLnBsYXllci51cGRhdGUoeydpc1BsYXlpbmcnOiBtc2cuaXNQbGF5aW5nfSk7XHJcbiAgICAgICAgaWYgKGlzQWN0aXZlKSB7XHJcbiAgICAgICAgICAgIC8v0L7QsdC90L7QstC70Y/QtdC8INC40LrQvtC90LrRgyDQvdCwINC/0LDQvdC10LvQuCDQsdGA0LDRg9C30LXRgNCwXHJcbiAgICAgICAgICAgIGJyb3dzZXJBY3Rpb24udXBkYXRlKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZXh0LnBvcHVwQ29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgLy9vbGRcclxuICAgICAgICAgICAgICAgIGV4dC5wb3B1cENvbm5lY3Rpb24uc2VuZChbJ2lzUGxheWluZyddKTtcclxuICAgICAgICAgICAgICAgIC8vbmV3XHJcbiAgICAgICAgICAgICAgICBleHQucG9wdXBDb25uZWN0aW9uLnNlbmQoe2FjdGlvbjogJ2lzUGxheWluZycsIHBheWxvYWQ6IG1zZy5pc1BsYXlpbmd9KTtcclxuICAgICAgICAgICAgICAgIGxvZy50cmFjZSgndGFiLm9uU3RhdGUoKSBldmVudCBzZW50IHRvIHBvcHVwJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIG9uU2h1dGRvd25BY3Rpb24gPSAobXNnLCBpc0FjdGl2ZSkgPT4ge1xyXG4gICAgICAgIGxvZy50cmFjZSgndGFiLm9uU2h1dGRvd24oKSB3aXRoIG1lc3NhZ2UgJW8sIGlzIGFjdGl2ZSB0YWIgJW8nLCBtc2csIGlzQWN0aXZlKTtcclxuICAgICAgICBsb2cuZXJyb3IoJ1RhYiBjbG9zZWQgdmlhIGNzIHNodXRkb3duIGFjdGlvbicpO1xyXG4gICAgICAgIHRhYnMuc2h1dGRvd24odGhpcy5pZCk7XHJcbiAgICB9O1xyXG5cclxuICAgIG9uRm9jdXNBY3Rpb24gPSAobXNnLCBpc0FjdGl2ZSkgPT4ge1xyXG4gICAgICAgIGxvZy50cmFjZSgndGFiLm9uRm9jdXMoKSB3aXRoIG1lc3NhZ2UgJW8sIGlzIGFjdGl2ZSB0YWIgJW8nLCBtc2csIGlzQWN0aXZlKTtcclxuICAgICAgICB0aGlzLmZvY3VzZWQgPSB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICBvbkJsdXJBY3Rpb24gPSAobXNnLCBpc0FjdGl2ZSkgPT4ge1xyXG4gICAgICAgIGxvZy50cmFjZSgndGFiLm9uQmx1cigpIHdpdGggbWVzc2FnZSAlbywgaXMgYWN0aXZlIHRhYiAlbycsIG1zZywgaXNBY3RpdmUpO1xyXG4gICAgICAgIHRoaXMuZm9jdXNlZCA9IGZhbHNlO1xyXG4gICAgfTtcclxuXHJcbiAgICBvblZvbHVtZUFjdGlvbiA9IChtc2csIGlzQWN0aXZlKSA9PiB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCd0YWIub25Wb2x1bWUoKSB3aXRoIG1lc3NhZ2UgJW8sIGlzIGFjdGl2ZSB0YWIgJW8nLCBtc2csIGlzQWN0aXZlKTtcclxuICAgICAgICB0aGlzLnBsYXllci51cGRhdGUoeydjb250cm9scyc6IHt2b2x1bWU6IG1zZy52b2x1bWV9fSwgdHJ1ZSk7XHJcbiAgICAgICAgaWYgKGlzQWN0aXZlICYmIGV4dC5wb3B1cENvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgLy9vbGRcclxuICAgICAgICAgICAgZXh0LnBvcHVwQ29ubmVjdGlvbi5zZW5kKFsnY29udHJvbHMnXSk7XHJcbiAgICAgICAgICAgIC8vbmV3XHJcbiAgICAgICAgICAgIGV4dC5wb3B1cENvbm5lY3Rpb24uc2VuZCh7YWN0aW9uOiAndm9sdW1lJywgcGF5bG9hZDogbXNnLnZvbHVtZX0pO1xyXG4gICAgICAgICAgICBsb2cudHJhY2UoJ3RhYi5vblZvbHVtZSgpIGV2ZW50IHNlbnQgdG8gcG9wdXAnKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIG9uQWR2ZXJ0QWN0aW9uID0gKG1zZywgaXNBY3RpdmUpID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ3RhYi5vbkFkdmVydEFjdGlvbigpIHdpdGggbWVzc2FnZSAlbywgaXMgYWN0aXZlIHRhYiAlbycsIG1zZywgaXNBY3RpdmUpO1xyXG4gICAgICAgIHRoaXMucGxheWVyLnVwZGF0ZSh7J2lzQWR2ZXJ0JzogbXNnLnN0YXRlfSk7XHJcbiAgICAgICAgaWYgKGlzQWN0aXZlICYmIGV4dC5wb3B1cENvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgZXh0LnBvcHVwQ29ubmVjdGlvbi5zZW5kKHthY3Rpb246ICdhZHZlcnQnLCBwYXlsb2FkOiBtc2cuc3RhdGV9KTtcclxuICAgICAgICAgICAgbG9nLnRyYWNlKCd0YWIub25BZHZlcnRBY3Rpb24oKSBldmVudCBzZW50IHRvIHBvcHVwJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBvblByb2dyZXNzQWN0aW9uID0gKG1zZywgaXNBY3RpdmUpID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ3RhYi5vblByb2dyZXNzKCkgd2l0aCBtZXNzYWdlICVvLCBpcyBhY3RpdmUgdGFiICVvJywgbXNnLCBpc0FjdGl2ZSk7XHJcbiAgICAgICAgdGhpcy5wbGF5ZXIudXBkYXRlKHsncHJvZ3Jlc3MnOiBtc2cucHJvZ3Jlc3N9KTtcclxuICAgICAgICBpZiAoaXNBY3RpdmUgJiYgZXh0LnBvcHVwQ29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICAvL29sZFxyXG4gICAgICAgICAgICBleHQucG9wdXBDb25uZWN0aW9uLnNlbmQoWydwcm9ncmVzcyddKTtcclxuICAgICAgICAgICAgLy9uZXdcclxuICAgICAgICAgICAgZXh0LnBvcHVwQ29ubmVjdGlvbi5zZW5kKHthY3Rpb246ICdwcm9ncmVzcycsIHBheWxvYWQ6IG1zZy5wcm9ncmVzc30pO1xyXG4gICAgICAgICAgICBsb2cudHJhY2UoJ3RhYi5vblByb2dyZXNzKCkgZXZlbnQgc2VudCB0byBwb3B1cCcpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgb25UcmFja3NsaXN0QWN0aW9uID0gKG1zZywgaXNBY3RpdmUpID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ3RhYi5vblRyYWNrc2xpc3QoKSB3aXRoIG1lc3NhZ2UgJW8sIGlzIGFjdGl2ZSB0YWIgJW8nLCBtc2csIGlzQWN0aXZlKTtcclxuXHJcbiAgICAgICAgLy/Qv9C70LXQudC70LjRgdGCINC+0YfQuNGJ0LXQvVxyXG4gICAgICAgIGlmIChtc2cucGxheWxpc3QubGlzdC5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICBsb2cudHJhY2UoJ3RhYi5vblRyYWNrc2xpc3QoKSBwbGF5bGlzdCBjbGVhcmVkLCBjbGVhcmluZyBwbGF5ZXInKTtcclxuICAgICAgICAgICAgLy/Qv9GA0Lgg0L7Rh9C40YHRgtC60LUg0L/Qu9C10LXRgNCwINGB0L7RhdGA0LDQvdGP0LXQvCDQt9C90LDRh9C10L3QuNC1INCz0YDQvtC80LrQvtGB0YLQuFxyXG4gICAgICAgICAgICBjb25zdCBjdXJWb2x1bWUgPSB0aGlzLnBsYXllci5jb250cm9scy52b2x1bWU7XHJcbiAgICAgICAgICAgIHRoaXMucGxheWVyID0gbmV3IHBsYXllcigpO1xyXG4gICAgICAgICAgICB0aGlzLnBsYXllci51cGRhdGUoeydjb250cm9scyc6IHt2b2x1bWU6IGN1clZvbHVtZX19LCB0cnVlKTtcclxuICAgICAgICAgICAgaWYgKGlzQWN0aXZlICYmIGV4dC5wb3B1cENvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIC8vb2xkXHJcbiAgICAgICAgICAgICAgICBleHQucG9wdXBDb25uZWN0aW9uLnNlbmQoWyd0cmFjaycsICdwcm9ncmVzcycsICdzb3VyY2UnLCAnY29udHJvbHMnLCAncGxheWxpc3QnLCAnaXNQbGF5aW5nJ10pO1xyXG4gICAgICAgICAgICAgICAgLy9uZXdcclxuICAgICAgICAgICAgICAgIGV4dC5wb3B1cENvbm5lY3Rpb24uc2VuZCh7YWN0aW9uOiAndHJhY2snLCBwYXlsb2FkOiBtc2cudHJhY2t9KTtcclxuICAgICAgICAgICAgICAgIGV4dC5wb3B1cENvbm5lY3Rpb24uc2VuZCh7YWN0aW9uOiAncHJvZ3Jlc3MnLCBwYXlsb2FkOiBtc2cucHJvZ3Jlc3N9KTtcclxuICAgICAgICAgICAgICAgIGV4dC5wb3B1cENvbm5lY3Rpb24uc2VuZCh7YWN0aW9uOiAnc291cmNlJywgcGF5bG9hZDogey4uLm1zZy5zb3VyY2UsIHRhYlR5cGU6IHRoaXMudHlwZX19KTtcclxuICAgICAgICAgICAgICAgIGV4dC5wb3B1cENvbm5lY3Rpb24uc2VuZCh7YWN0aW9uOiAnY29udHJvbHMnLCBwYXlsb2FkOiBtc2cuY29udHJvbHN9KTtcclxuICAgICAgICAgICAgICAgIGV4dC5wb3B1cENvbm5lY3Rpb24uc2VuZCh7YWN0aW9uOiAncGxheWxpc3QnLCBwYXlsb2FkOiBtc2cucGxheWxpc3R9KTtcclxuICAgICAgICAgICAgICAgIGV4dC5wb3B1cENvbm5lY3Rpb24uc2VuZCh7YWN0aW9uOiAnaXNQbGF5aW5nJywgcGF5bG9hZDogbXNnLmlzUGxheWluZ30pO1xyXG4gICAgICAgICAgICAgICAgbG9nLnRyYWNlKCd0YWIub25UcmFja3NsaXN0KCkgYWxsIGV2ZW50cyBzZW50IHRvIHBvcHVwJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy/QvtCx0L3QvtCy0LvRj9C10Lwg0LjQutC+0L3QutGDINC90LAg0L/QsNC90LXQu9C4INCx0YDQsNGD0LfQtdGA0LBcclxuICAgICAgICAgICAgYnJvd3NlckFjdGlvbi51cGRhdGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy/QvtCx0L3QvtCy0LvQtdC90LjQtSDQv9C70LXQudC70LjRgdGC0LBcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5wbGF5ZXIudXBkYXRlKHsncGxheWxpc3QnOiBtc2cucGxheWxpc3R9KTtcclxuICAgICAgICAgICAgaWYgKGlzQWN0aXZlICYmIGV4dC5wb3B1cENvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIC8vb2xkXHJcbiAgICAgICAgICAgICAgICBleHQucG9wdXBDb25uZWN0aW9uLnNlbmQoWydwbGF5bGlzdCddKTtcclxuICAgICAgICAgICAgICAgIC8vbmV3XHJcbiAgICAgICAgICAgICAgICBleHQucG9wdXBDb25uZWN0aW9uLnNlbmQoe2FjdGlvbjogJ3BsYXlsaXN0JywgcGF5bG9hZDogbXNnLnBsYXlsaXN0fSk7XHJcbiAgICAgICAgICAgICAgICBsb2cudHJhY2UoJ3RhYi5vblRyYWNrc2xpc3QoKSBldmVudCBzZW50IHRvIHBvcHVwJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIG9uQ29udHJvbHNBY3Rpb24gPSAobXNnLCBpc0FjdGl2ZSkgPT4ge1xyXG4gICAgICAgIGxvZy50cmFjZSgndGFiLm9uQ29udHJvbHMoKSB3aXRoIG1lc3NhZ2UgJW8sIGlzIGFjdGl2ZSB0YWIgJW8nLCBtc2csIGlzQWN0aXZlKTtcclxuICAgICAgICB0aGlzLnBsYXllci51cGRhdGUoeydjb250cm9scyc6IG1zZy5jb250cm9sc30pO1xyXG4gICAgICAgIGlmIChpc0FjdGl2ZSAmJiBleHQucG9wdXBDb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIC8vb2xkXHJcbiAgICAgICAgICAgIGV4dC5wb3B1cENvbm5lY3Rpb24uc2VuZChbJ2NvbnRyb2xzJ10pO1xyXG4gICAgICAgICAgICAvL25ld1xyXG4gICAgICAgICAgICBleHQucG9wdXBDb25uZWN0aW9uLnNlbmQoe2FjdGlvbjogJ2NvbnRyb2xzJywgcGF5bG9hZDogbXNnLmNvbnRyb2xzfSk7XHJcbiAgICAgICAgICAgIGxvZy50cmFjZSgndGFiLm9uQ29udHJvbHMoKSBldmVudCBzZW50IHRvIHBvcHVwJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBvblRyYWNrQWN0aW9uID0gKG1zZywgaXNBY3RpdmUpID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ3RhYi5vblRyYWNrKCkgd2l0aCBtZXNzYWdlICVvLCBpcyBhY3RpdmUgdGFiICVvJywgbXNnLCBpc0FjdGl2ZSwgdGhpcy5wbGF5ZXIpO1xyXG4gICAgICAgIGNvbnN0IGlzSW5pdGlhbCA9ICh0aGlzLnBsYXllciA9PT0gbnVsbCk7XHJcblxyXG4gICAgICAgIHRoaXMucGxheWVyLnVwZGF0ZSh7XHJcbiAgICAgICAgICAgICd0cmFjayc6IG1zZy50cmFjayxcclxuICAgICAgICAgICAgJ3Byb2dyZXNzJzogbXNnLnByb2dyZXNzLFxyXG4gICAgICAgICAgICAnc291cmNlJzogbXNnLnNvdXJjZSxcclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAoaXNBY3RpdmUgJiYgZXh0LnBvcHVwQ29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICAvL29sZFxyXG4gICAgICAgICAgICBleHQucG9wdXBDb25uZWN0aW9uLnNlbmQoWyd0cmFjaycsICdwcm9ncmVzcycsICdzb3VyY2UnXSk7XHJcbiAgICAgICAgICAgIC8vbmV3XHJcbiAgICAgICAgICAgIGV4dC5wb3B1cENvbm5lY3Rpb24uc2VuZCh7YWN0aW9uOiAndHJhY2snLCBwYXlsb2FkOiBtc2cudHJhY2t9KTtcclxuICAgICAgICAgICAgZXh0LnBvcHVwQ29ubmVjdGlvbi5zZW5kKHthY3Rpb246ICdwcm9ncmVzcycsIHBheWxvYWQ6IG1zZy5wcm9ncmVzc30pO1xyXG4gICAgICAgICAgICBleHQucG9wdXBDb25uZWN0aW9uLnNlbmQoe2FjdGlvbjogJ3NvdXJjZScsIHBheWxvYWQ6IG1zZy5zb3VyY2V9KTtcclxuICAgICAgICAgICAgbG9nLnRyYWNlKCd0YWIub25UcmFjaygpIGV2ZW50IHNlbnQgdG8gcG9wdXAnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFpc0FjdGl2ZSkge1xyXG4gICAgICAgICAgICBsb2cudHJhY2UoJ3RhYi5vblRyYWNrKCkgdGFiIGlzIG5vdCBhY3RpdmUsIGRvblxcJ3QgY3JlYXRlIG5vdGlmaWNhdGlvbicpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzY3JvYmJsaW5nID0gc3RvcmFnZS5nZXQoJ3Njcm9iYmxpbmcnKTtcclxuICAgICAgICBjb25zdCBzY3JvYmJsaW5nRmlsZW5hbWUgPSBzdG9yYWdlLmdldCgnc2Nyb2JibGluZ19maWxlbmFtZScpO1xyXG4gICAgICAgIGNvbnN0IHNjcm9iYmxpbmdGb3JtYXQgPSBzdG9yYWdlLmdldCgnc2Nyb2JibGluZ19mb3JtYXQnKTtcclxuICAgICAgICBpZiAoc2Nyb2JibGluZyAmJiAhaXNJbml0aWFsKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSBzY3JvYmJsaW5nRm9ybWF0XHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgnJWFydGlzdHMlJywgdGhpcy5wbGF5ZXIuZ2V0QXJ0aXN0cygpKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoJyV0cmFjayUnLCB0aGlzLnBsYXllci50cmFjay50aXRsZSlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKCclYWxidW0lJywgdGhpcy5wbGF5ZXIudHJhY2suYWxidW0udGl0bGUpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgnJWFsYnVtWWVhciUnLCB0aGlzLnBsYXllci50cmFjay5hbGJ1bS55ZWFyKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoJyV2ZXJzaW9uJScsIHRoaXMucGxheWVyLnRyYWNrLnZlcnNpb24gfHwgJycpO1xyXG4gICAgICAgICAgICBkb3dubG9hZGVyLmRvd25sb2FkKHNjcm9iYmxpbmdGaWxlbmFtZSwgdGV4dCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB0eXBlID0gc3RvcmFnZS5nZXQoJ3R5cGUnKTsgLy/RgNC10LbQuNC8INC/0L7QutCw0LfQsCDRg9Cy0LXQtNC+0LzQu9C10L3QuNC5XHJcblxyXG4gICAgICAgIGlmICh0eXBlID09ICdub25lJyB8fCB0eXBlID09ICdob3RrJykge1xyXG4gICAgICAgICAgICBsb2cudHJhY2UoJ3RhYi5vblRyYWNrKCkgZG9uXFwndCBjcmVhdGUgbm90aWZpY2F0aW9uIGR1ZSBzZXR0aW5ncycpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChpc0luaXRpYWwpIHtcclxuICAgICAgICAgICAgbG9nLmRlYnVnKCd0YWIub25UcmFjaygpIGRvblxcJ3QgY3JlYXRlIG5vdGlmaWNhdGlvbiBvbiBpbml0aWFsJyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG1zZy5zZWNvbmRhcnkpIHtcclxuICAgICAgICAgICAgbG9nLnRyYWNlKCd0YWIub25UcmFjaygpIGRvblxcJ3QgY3JlYXRlIG5vdGlmaWNhdGlvbiBkdWUgc2Vjb25kYXJ5IGFjdGlvbicpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8v0LXRgdC70Lgg0L7RgtC60YDRi9GCINC/0L7Qv9Cw0L8g0LjQu9C4INGE0L7QutGD0YEg0L3QsCDRgtC10LrRg9GJ0LXQuSDQstC60LvQsNC00LrQtSDQv9C70LXQtdGA0LAgLSDQvdC1INC/0L7QutCw0LfRi9Cy0LDQtdC8INC90L7RgtC40YTQuNC60LDRhtGOXHJcbiAgICAgICAgaWYgKGNocm9tZS5leHRlbnNpb24uZ2V0Vmlld3Moe3R5cGU6ICdwb3B1cCd9KS5sZW5ndGggPiAwIHx8IHRhYnMuZ2V0QWN0aXZlVGFiKCkuZm9jdXNlZCkge1xyXG4gICAgICAgICAgICBsb2cudHJhY2UoJ3RhYi5vblRyYWNrKCkgZG9uXFwndCBjcmVhdGUgbm90aWZpY2F0aW9uIGR1ZSBmb2N1c2VkIG9yIHBvcHVwIG9wZW5lZCcpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsb2cudHJhY2UoJ3RhYi5vblRyYWNrKCkgY3JlYXRpbmcgbm90aWZpY2F0aW9uJyk7XHJcbiAgICAgICAgbGV0IGJ1dHRvbnNUeXBlID0gdGhpcy50eXBlO1xyXG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT0gJ211c2ljJyAmJiB0aGlzLnBsYXllci5zb3VyY2UudHlwZSA9PSAncmFkaW8nKSB7XHJcbiAgICAgICAgICAgIGJ1dHRvbnNUeXBlICs9ICdyYWRpbyc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG5vdGlmaWNhdGlvbnMuY3JlYXRlKHRoaXMucGxheWVyLCBidXR0b25zVHlwZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIG9uSW5mb0FjdGlvbiA9IChtc2csIGlzQWN0aXZlKSA9PiB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCd0YWIub25JbmZvKCkgd2l0aCBtZXNzYWdlICVvLCBpcyBhY3RpdmUgdGFiICVvJywgbXNnLCBpc0FjdGl2ZSk7XHJcblxyXG4gICAgICAgIGlmICghbXNnLnRyYWNrKSB7XHJcbiAgICAgICAgICAgIGxvZy50cmFjZSgndGFiLm9uSW5mbygpIGVtcHR5IGRhdGEnKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWlzQWN0aXZlKSB7XHJcbiAgICAgICAgICAgIGxvZy50cmFjZSgndGFiLm9uSW5mbygpIHRhYiBpcyBub3QgYWN0aXZlLCBkb25cXCd0IGNyZWF0ZSBub3RpZmljYXRpb24nKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdHlwZSA9IHN0b3JhZ2UuZ2V0KCd0eXBlJyk7IC8v0YDQtdC20LjQvCDQv9C+0LrQsNC30LAg0YPQstC10LTQvtC80LvQtdC90LjQuVxyXG5cclxuICAgICAgICBpZiAodHlwZSA9PSAnbm9uZScgfHwgdHlwZSA9PSAndHInKSB7XHJcbiAgICAgICAgICAgIGxvZy50cmFjZSgndGFiLm9uSW5mbygpIGRvblxcJ3QgY3JlYXRlIG5vdGlmaWNhdGlvbiBkdWUgc2V0dGluZ3MnKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbG9nLnRyYWNlKCd0YWIub25UcmFjaygpIGNyZWF0aW5nIG5vdGlmaWNhdGlvbicpO1xyXG4gICAgICAgIGxldCBidXR0b25zVHlwZSA9IHRoaXMudHlwZTtcclxuICAgICAgICBpZiAodGhpcy50eXBlID09ICdtdXNpYycgJiYgdGhpcy5wbGF5ZXIuc291cmNlLnR5cGUgPT0gJ3JhZGlvJykge1xyXG4gICAgICAgICAgICBidXR0b25zVHlwZSArPSAncmFkaW8nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBub3RpZmljYXRpb25zLmNyZWF0ZSh0aGlzLnBsYXllciwgYnV0dG9uc1R5cGUpO1xyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgdGFiO1xyXG4iLCJpbXBvcnQgbG9nIGZyb20gJ2xvZ2xldmVsJztcclxuaW1wb3J0IHV0aWxzIGZyb20gJy4uL2NvbW1vbi91dGlscyc7XHJcbmltcG9ydCB0YWIgZnJvbSAnLi90YWInO1xyXG5pbXBvcnQgYnJvd3NlckFjdGlvbiBmcm9tICcuL2Jyb3dzZXJBY3Rpb24nO1xyXG5cclxuY2xhc3MgdGFicyB7XHJcbiAgICBsaXN0ID0ge307XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCd0YWJzLmNvbnN0cnVjdG9yKCknKTtcclxuXHJcbiAgICAgICAgLy/QtNC+0LHQsNCy0LvRj9C10Lwg0YHQu9GD0YjQsNGC0LXQu9GMINC90LAg0LjQt9C80LXQvdC10L3QuNGPIFVSTCfQvtCyINCy0LrQu9Cw0LTQvtC6XHJcbiAgICAgICAgdGhpcy5hZGRUYWJzTGlzdGVuZXJzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy/QtNC+0LHQsNCy0LvRj9C10Lwg0YHQu9GD0YjQsNGC0LXQu9GMINC90LAg0LjQt9C80LXQvdC10L3QuNGPIFVSTCfQvtCyINCy0LrQu9Cw0LTQvtC6XHJcbiAgICBhZGRUYWJzTGlzdGVuZXJzID0gKCkgPT4ge1xyXG4gICAgICAgIGxvZy50cmFjZSgndGFicy5hZGRUYWJzTGlzdGVuZXJzKCknKTtcclxuICAgICAgICAvL9GB0L7QsdGL0YLQuNC1INC+0LHQvdC+0LLQu9C10L3QuNGPINCy0LrQu9Cw0LTQutC4XHJcbiAgICAgICAgY2hyb21lLnRhYnMub25VcGRhdGVkLmFkZExpc3RlbmVyKHRoaXMub25VcGRhdGVkKTtcclxuICAgICAgICAvL9GB0L7QsdGL0YLQuNC1INC30LDQutGA0YvRgtC40Y8g0LLQutC70LDQtNC60LhcclxuICAgICAgICBjaHJvbWUudGFicy5vblJlbW92ZWQuYWRkTGlzdGVuZXIodGhpcy5vblJlbW92ZWQpO1xyXG4gICAgfTtcclxuXHJcbiAgICBvblJlbW92ZWQgPSAodGFiSWQsIHJlbW92ZUluZm8pID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ3RhYnMub25SZW1vdmVkKCkgb24gdGFiIDwlZD4sIHJlbW92ZUluZm8gJW8nLCB0YWJJZCwgcmVtb3ZlSW5mbyk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0QnlJZCh0YWJJZCkpIHtcclxuICAgICAgICAgICAgICAgIGxvZy50cmFjZSgndGFicy5vblJlbW92ZWQoKSByZW1vdmluZyB0YWIgZnJvbSBsaXN0Jyk7XHJcbiAgICAgICAgICAgICAgICBsb2cuZXJyb3IoJ1RhYiBjbG9zZWQgdmlhIHRhYnMgb25SZW1vdmVkIGV2ZW50Jyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNodXRkb3duKHRhYklkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgdXRpbHMuZXJyb3JIYW5kbGVyKGUpOyB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8v0JIgQ1Mg0L3QsCDRgdGC0YDQsNC90LjRhtGDINCy0LXRiNCw0LXRgtGB0Y8g0L7QsdGA0LDQsdC+0YLRh9C40Log0YHQvtCx0YvRgtC40Y8gb25iZWZvcmV1bmxvYWQsINC60L7RgtC+0YDRi9C5INC/0LXRgNC10LQg0LfQsNC60YDRi9GC0LjQtdC8INC+0LrQvdCwINC/0YDQuNGB0YvQu9Cw0LXRgiDRgdC+0L7QsdGJ0LXQvdC40LVcclxuICAgIC8v0YDQsNGB0YjQuNGA0LXQvdC40Y4g0Lgg0YHQvtC+0YLQstC10YLRgdGC0LLRg9GO0YnQtdC5INCy0LrQu9Cw0LTQutC1INC00LXQu9Cw0LXRgtGB0Y8gc2h1dGRvd24uINCh0LDQvCDRgdC10YDQstC40YEg0Y/QstC70Y/QtdGC0YHRjyBTUEEg0Lgg0L/RgNC4INC90LDQstC40LPQsNGG0LjQuCDRjdGC0L4g0YHQvtCx0YvRgtC40LUg0L3QtVxyXG4gICAgLy/RgdGA0LDQsdCw0YLRi9Cy0LDQtdGCLCDRgtC10Lwg0YHQsNC80YvQvCwg0L3QtSDQvdGD0LbQvdC+INGB0LvQtdC00LjRgtGMINC60YPQtNCwINGD0LbQtSDQt9Cw0LjQvdC20LXQutGC0LjQu9C4INC60L7QtCwg0LAg0LrRg9C00LAg0L3QtdGCLiDQotCw0LrQttC1INC+INC30LDQutGA0YvRgtC40Lgg0L7QutC90LAg0LzQvtC20LXRglxyXG4gICAgLy/Qv9C+0YLQtdC90LXRhtC40LDQu9GM0L3QviDRgdC+0L7QsdGJ0LjRgtGMINGB0L7QsdGL0YLQuNC1IG9uRGlzY29ubmVjdCDRgyDQv9C+0YDRgtCwLCDRh9C10YDQtdC3INC60L7RgtC+0YDRi9C5INC40LTQtdGCINC+0LHQvNC10L0g0YHQvtC+0LHRidC10L3QuNGP0LzQuC5cclxuICAgIG9uVXBkYXRlZCA9ICh0YWJJZCwgY2hhbmdlSW5mbywgdGFiKSA9PiB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCd0YWJzLm9uVXBkYXRlZCgpIG9uIHRhYiA8JWQ+LCBjaGFuZ2VJbmZvICVvLCB0YWIgJW8nLCB0YWJJZCwgY2hhbmdlSW5mbywgdGFiKTtcclxuXHJcbiAgICAgICAgaWYgKCEoJ3N0YXR1cycgaW4gY2hhbmdlSW5mbyB8fCAndXJsJyBpbiBjaGFuZ2VJbmZvKSkge1xyXG4gICAgICAgICAgICBsb2cudHJhY2UoJ29uVXBkYXRlZCgpIG5vdCBpbnRlcmVzdGVkIGNoYW5nZSBldmVudCcsIGNoYW5nZUluZm8pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL9C/0YDQvtCy0LXRgNGP0LXQvCDRgdC+0LLQv9Cw0LTQtdC90LjQtSBVUkwn0LBcclxuICAgICAgICBjb25zdCBVUkwgPSB1dGlscy5pc1VybE1hdGNoKHRhYi51cmwpO1xyXG4gICAgICAgIGxvZy50cmFjZSgndGFicy5vblVwZGF0ZWQoKSBVUkwnLCBVUkwpO1xyXG4gICAgICAgIGlmIChjaGFuZ2VJbmZvLnN0YXR1cyAhPSAnY29tcGxldGUnKSB7XHJcbiAgICAgICAgICAgIGxvZy50cmFjZSgndGFicy5vblVwZGF0ZWQoKSBVUkwgbG9hZGluZyBpcyBub3QgY29tcGxldGVkJyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKFVSTCA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0QnlJZCh0YWJJZCkpIHtcclxuICAgICAgICAgICAgICAgIGxvZy5lcnJvcigndGFicy5vblVwZGF0ZWQoKSBVUkwgY2hhbmdlZCB0byBub24tbWF0Y2hlZCwgcmVtb3ZpbmcgaXQgZnJvbSBsaXN0Jyk7XHJcbiAgICAgICAgICAgICAgICBsb2cuZXJyb3IoJ1RhYiBjbG9zZWQgdmlhIFVSTCBjaGFuZ2VkIHRvIG5vbi1tYXRjaGVkIHdoaWxlIHRhYnMgb25VcGRhdGVkIGV2ZW50Jyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNodXRkb3duKHRhYklkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL9C90L7QstCw0Y8g0LLQutC70LDQtNC60LAsINC00L7QsdCw0LLQu9GP0LXQvCDQsiDRgdC/0LjRgdC+0LpcclxuICAgICAgICBpZiAoIXRoaXMuZ2V0QnlJZCh0YWJJZCkpIHtcclxuICAgICAgICAgICAgbG9nLnRyYWNlKCd0YWJzLm9uVXBkYXRlZCgpIHRhYiBVUkwgdmFsaWQgYW5kIG5vdCBmb3VuZCBpbiBsaXN0LCBhZGRpbmcnKTtcclxuICAgICAgICAgICAgLy/QtNC+0LHQsNCy0LvRj9C10Lwg0LLQutC70LDQtNC60YMg0LIg0YHQv9C40YHQvtC6XHJcbiAgICAgICAgICAgIHRoaXMuYWRkKHRhYklkLCBVUkwuaXNNdXNpYyA/ICdtdXNpYycgOiAncmFkaW8nKTtcclxuICAgICAgICAgICAgLy/QtNC10LvQsNC10Lwg0LjQvdGK0LXQutGG0LjRjlxyXG4gICAgICAgICAgICB1dGlscy5pbmplY3RTY3JpcHQodGFiSWQsICdleHRlbnNpb24vY3MuanMnKTtcclxuICAgICAgICAgICAgLy/QvtCx0L3QvtCy0LvRj9C10Lwg0LjQutC+0L3QutGDINC90LAg0L/QsNC90LXQu9C4INCx0YDQsNGD0LfQtdGA0LBcclxuICAgICAgICAgICAgYnJvd3NlckFjdGlvbi51cGRhdGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHNodXRkb3duID0gdGFiSWQgPT4ge1xyXG4gICAgICAgIGxvZy50cmFjZSgndGFicy5zaHV0ZG93bigpIG9uIDwlZD4nLCB0YWJJZCk7XHJcbiAgICAgICAgLy/QtdGB0LvQuCDQt9Cw0LrRgNGL0LLQsNC10Lwg0YLQtdC60YPRidGD0Y4g0LLQutC70LDQtNC60YMsINC30LDQutGA0YvQstCw0LXQvCDQv9C+0L/QsNC/XHJcbiAgICAgICAgaWYgKHRoaXMuZ2V0QWN0aXZlVGFiKCkuaWQgPT0gdGFiSWQpIHtcclxuICAgICAgICAgICAgbG9nLnRyYWNlKCd0YWJzLnNodXRkb3duKCkgY2xvc2luZyBwb3B1cCcpO1xyXG4gICAgICAgICAgICBicm93c2VyQWN0aW9uLmNsb3NlUG9wdXAoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8v0YPQtNCw0LvRj9C10Lwg0LLQutC70LDQtNC60YNcclxuICAgICAgICBpZiAodGhpcy5saXN0W3RhYklkXSkge1xyXG4gICAgICAgICAgICBsb2cudHJhY2UoJ3RhYnMuc2h1dGRvd24oKSBjbG9zaW5nIHRhYicpO1xyXG4gICAgICAgICAgICAvL9C/0LXRgNC10LQg0YPQtNCw0LvQtdC90LjQtdC8INC+0YfQuNGJ0LDQtdC8INGC0LDQudC80LXRgCDQstC60LvQsNC00LrQuCwg0LrQvtGC0L7RgNGL0Lkg0LzQvtC90LjRgtC+0YDQuNC7INC10LUg0LbQuNCy0YPRh9C10YHRgtGMXHJcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5saXN0W3RhYklkXS50aW1lcik7XHJcbiAgICAgICAgICAgIC8v0YPQtNCw0LvRj9C10LxcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMubGlzdFt0YWJJZF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL9C+0LHQvdC+0LLQu9GP0LXQvCDQuNC60L7QvdC60YMg0L3QsCDQv9Cw0L3QtdC70Lgg0LHRgNCw0YPQt9C10YDQsFxyXG4gICAgICAgIGJyb3dzZXJBY3Rpb24udXBkYXRlKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGdldEJ5SWQgPSB0YWJJZCA9PiB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCd0YWJzLmdldEJ5SWQoKSBvbiA8JWQ+JywgdGFiSWQpO1xyXG5cclxuICAgICAgICBsb2cudHJhY2UoJ3RhYnMuZ2V0QnlJZCgpIHJldHVybnMgJW8nLCB0aGlzLmxpc3RbdGFiSWRdKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5saXN0W3RhYklkXTsgLy90YWIgb3IgdW5kZWZpbmVkXHJcbiAgICB9O1xyXG5cclxuICAgIGdldEFjdGl2ZVRhYiA9ICgpID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ3RhYnMuZ2V0QWN0aXZlVGFiKCkgZnJvbSBsaXN0ICVvJywgdGhpcy5saXN0KTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY291bnQoKSA9PSAxKSB7XHJcbiAgICAgICAgICAgIGxvZy50cmFjZSgndGFicy5nZXRBY3RpdmVUYWIoKSByZXR1cm5zICVvJywgdGhpcy5saXN0W09iamVjdC5rZXlzKHRoaXMubGlzdClbMF1dKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGlzdFtPYmplY3Qua2V5cyh0aGlzLmxpc3QpWzBdXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8v0LDQutGC0LjQstC90L7QuSDRgdGH0LjRgtCw0LXRgtGB0Y8g0L/QtdGA0LLQsNGPICjQv9C+INCy0YDQtdC80LXQvdC4KSDQvtGC0LrRgNGL0YLQsNGPINCy0LrQu9Cw0LTQutCwINC40Lcg0YHQv9C40YHQutCwXHJcbiAgICAgICAgY29uc3Qgc29ydGVkQnlUaW1lID0gQXJyYXkucHJvdG90eXBlLnNvcnQuY2FsbCh0aGlzLmxpc3QsIChhLCBiKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChhLm9wZW5lZFRpbWUgPCBiLm9wZW5lZFRpbWUpIHJldHVybiAtMTtcclxuICAgICAgICAgICAgaWYgKGEub3BlbmVkVGltZSA+IGIub3BlbmVkVGltZSkgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdCByZXN1bHQgPSBPYmplY3Qua2V5cyhzb3J0ZWRCeVRpbWUpLmxlbmd0aCA/IHNvcnRlZEJ5VGltZVtPYmplY3Qua2V5cyhzb3J0ZWRCeVRpbWUpWzBdXSA6IGZhbHNlO1xyXG4gICAgICAgIGxvZy50cmFjZSgndGFicy5nZXRBY3RpdmVUYWIoKSByZXR1cm5zICVvJywgcmVzdWx0KTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfTtcclxuXHJcbiAgICBhZGQgPSAodGFiSWQsIHRhYlR5cGUpID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ3RhYnMuYWRkVGFiKCkgb24gPCVkPiB3aXRoIHR5cGUgPCVzPicsIHRhYklkLCB0YWJUeXBlKTtcclxuXHJcbiAgICAgICAgdGhpcy5saXN0W3RhYklkXSA9IG5ldyB0YWIodGFiSWQsIHRhYlR5cGUpO1xyXG4gICAgfTtcclxuXHJcbiAgICB1cGRhdGUgPSAodGFiSWQsIGtleSwgdmFsdWUpID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ3RhYnMudXBkYXRlKCkgb24gPCVkPiB3aXRoIGRhdGEgJXMgPT4gJW8nLCB0YWJJZCwga2V5LCB2YWx1ZSk7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5saXN0W3RhYklkXSB8fCAhdGhpcy5saXN0W3RhYklkXS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgICAgIGxvZy50cmFjZSgndGFicy51cGRhdGUoKSBub3QgdXBkYXRlZCcpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmxpc3RbdGFiSWRdW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICBsb2cudHJhY2UoJ3RhYnMudXBkYXRlKCkgdXBkYXRlZCcpO1xyXG4gICAgfTtcclxuXHJcbiAgICBjb3VudCA9ICgpID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ3RhYnMuY291bnQoKSByZXR1cm5zIDwlZD4nLCBPYmplY3Qua2V5cyh0aGlzLmxpc3QpLmxlbmd0aCk7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMubGlzdCkubGVuZ3RoO1xyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3IHRhYnMoKTtcclxuIiwiaW1wb3J0IGxvZyBmcm9tICdsb2dsZXZlbCc7XHJcblxyXG5jbGFzcyBwb3J0IHtcclxuXHJcbiAgICBwb3J0ID0gbnVsbDtcclxuICAgIHBvcnROYW1lID0gbnVsbDtcclxuICAgIHBvcnRUeXBlID0gbnVsbDtcclxuICAgIHRocm90dGxlZCA9IHt9O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHBvcnROYW1lLCBwb3J0VHlwZSA9ICdjbGllbnQnLCBjbGllbnRDb25uZWN0ZWRQb3J0ID0gbnVsbCkge1xyXG4gICAgICAgIGxvZy50cmFjZSgncG9ydFslc11bJXNdLmNvbnN0cnVjdG9yKCkgd2l0aCBwb3J0VHlwZSA8JXM+IGFuZCBjbGllbnRcXCdzIGNvbm5lY3RlZCBwb3J0ICVvJywgdGhpcy5wb3J0TmFtZSwgdGhpcy5wb3J0VHlwZSwgcG9ydFR5cGUsIGNsaWVudENvbm5lY3RlZFBvcnQpO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChwb3J0VHlwZSA9PSAnY2xpZW50Jykge1xyXG4gICAgICAgICAgICAgICAgbG9nLnRyYWNlKCdwb3J0WyVzXVslc10uY29uc3RydWN0b3IoKSBwb3J0IGNvbm5lY3RpbmcnLCB0aGlzLnBvcnROYW1lLCB0aGlzLnBvcnRUeXBlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9ydCA9IGNocm9tZS5ydW50aW1lLmNvbm5lY3Qoe25hbWU6IHBvcnROYW1lfSk7XHJcbiAgICAgICAgICAgICAgICBsb2cudHJhY2UoJ3BvcnRbJXNdWyVzXS5jb25zdHJ1Y3RvcigpIHBvcnQgY29ubmVjdGVkJywgdGhpcy5wb3J0TmFtZSwgdGhpcy5wb3J0VHlwZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocG9ydFR5cGUgPT0gJ2hvc3QnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcnQgPSBjbGllbnRDb25uZWN0ZWRQb3J0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucG9ydC5vbkRpc2Nvbm5lY3QuYWRkTGlzdGVuZXIodGhpcy5vbkRpc2Nvbm5lY3QpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcnQub25NZXNzYWdlLmFkZExpc3RlbmVyKHRoaXMub25NZXNzYWdlKTtcclxuICAgICAgICAgICAgdGhpcy5wb3J0VHlwZSA9IHBvcnRUeXBlO1xyXG4gICAgICAgICAgICB0aGlzLnBvcnROYW1lID0gcG9ydE5hbWU7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBsb2cudHJhY2UoJ3BvcnRbJXNdWyVzXS5jb25zdHJ1Y3RvcigpIHBvcnQgY29ubmVjdGlvbiBlcnJvciAlbycsIHRoaXMucG9ydE5hbWUsIHRoaXMucG9ydFR5cGUsIGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvbk1lc3NhZ2UgPSByZXF1ZXN0ID0+IHtcclxuICAgICAgICBsb2cudHJhY2UoJ3BvcnRbJXNdWyVzXS5vbk1lc3NhZ2UoKSByZXF1ZXN0ICVvJywgdGhpcy5wb3J0TmFtZSwgdGhpcy5wb3J0VHlwZSwgcmVxdWVzdCk7XHJcbiAgICAgICAgaWYgKHRoaXMub25NZXNzYWdlQ2IpIHtcclxuICAgICAgICAgICAgdGhpcy5vbk1lc3NhZ2VDYihyZXF1ZXN0KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIG9uTWVzc2FnZUNiID0gcmVxdWVzdCA9PiB7XHJcbiAgICAgICAgbG9nLnRyYWNlKCdwb3J0WyVzXVslc10ub25NZXNzYWdlQ2IoKSByZXF1ZXN0ICVvJywgdGhpcy5wb3J0TmFtZSwgdGhpcy5wb3J0VHlwZSwgcmVxdWVzdCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGFkZE9uTWVzc2FnZUNiID0gY2IgPT4ge1xyXG4gICAgICAgIGxvZy50cmFjZSgncG9ydFslc11bJXNdLmFkZE9uTWVzc2FnZUNiKCkgd2l0aCBjYiAlbycsIHRoaXMucG9ydE5hbWUsIHRoaXMucG9ydFR5cGUsIGNiKTtcclxuICAgICAgICB0aGlzLm9uTWVzc2FnZUNiID0gY2I7XHJcbiAgICB9O1xyXG5cclxuICAgIG9uRGlzY29ubmVjdCA9ICgpID0+IHtcclxuICAgICAgICBsb2cuZXJyb3IoJ3BvcnRbJXNdWyVzXS5jb25zdHJ1Y3RvcigpIHBvcnQgZGlzY29ubmVjdGVkIGZyb20gb3RoZXIgc2lkZScsIHRoaXMucG9ydE5hbWUsIHRoaXMucG9ydFR5cGUpO1xyXG4gICAgICAgIHRoaXMucG9ydCA9IG51bGw7XHJcbiAgICB9O1xyXG5cclxuICAgIHNlbmQgPSAoZGF0YSwgdXNlVGhyb3R0bGluZyA9IGZhbHNlLCB0aHJvdHRsaW5nS2V5ID0gbnVsbCwgdGhyb3R0bGVUaW1lID0gMTAwMCkgPT4ge1xyXG4gICAgICAgIGxvZy50cmFjZSgncG9ydFslc11bJXNdLnNlbmQoKScgKyAodXNlVGhyb3R0bGluZyA/ICcgdGhyb3R0bGVkJyA6ICcnKSArICcgZGF0YSAlbycsIHRoaXMucG9ydE5hbWUsIHRoaXMucG9ydFR5cGUsIGRhdGEpO1xyXG4gICAgICAgIGlmICghdGhpcy5wb3J0KSB7XHJcbiAgICAgICAgICAgIGxvZy5kZWJ1ZygncG9ydFslc11bJXNdLnNlbmQoKSBwb3J0IG5vdCBjb25uZWN0ZWQnLCB0aGlzLnBvcnROYW1lLCB0aGlzLnBvcnRUeXBlKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbG9nLnRyYWNlKCdwb3J0WyVzXVslc10uc2VuZCgpIHNlbmRpbmcnLCB0aGlzLnBvcnROYW1lLCB0aGlzLnBvcnRUeXBlKTtcclxuICAgICAgICAgICAgaWYgKCF1c2VUaHJvdHRsaW5nIHx8IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gdGhyb3R0bGVUaW1lID4gKHRoaXMudGhyb3R0bGVkW3Rocm90dGxpbmdLZXldIHx8IDApKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcnQucG9zdE1lc3NhZ2UoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICBpZiAodXNlVGhyb3R0bGluZykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGhyb3R0bGVkW3Rocm90dGxpbmdLZXldID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBsb2cuZGVidWcoJ3BvcnRbJXNdWyVzXS5zZW5kKCkgc2VudCBkYXRhICVvJywgdGhpcy5wb3J0TmFtZSwgdGhpcy5wb3J0VHlwZSwgZGF0YSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsb2cudHJhY2UoJ3BvcnRbJXNdWyVzXS5zZW5kKCkgc2VuZCBjYW5jZWxlZCBkdWUgdGhyb3R0bGluZyAlZCBtcycsIHRoaXMucG9ydE5hbWUsIHRoaXMucG9ydFR5cGUsIHRocm90dGxlVGltZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9ydCA9IG51bGw7XHJcbiAgICAgICAgICAgIGxvZy5lcnJvcihcInBvcnRbJXNdWyVzXS5zZW5kKCkgZXJyb3Igd2hpbGUgc2VuZGluZyAlb1wiLCB0aGlzLnBvcnROYW1lLCB0aGlzLnBvcnRUeXBlLCBlKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBwb3J0O1xyXG4iLCJpbXBvcnQgbG9nIGZyb20gJ2xvZ2xldmVsJztcclxuXHJcbmNsYXNzIHV0aWxzIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge31cclxuXHJcbiAgICAvL9C/0YDQvtCy0LXRgNC60LAgVVJMJ9CwINCy0LrQu9Cw0LTQutC4INC90LAg0L/RgNC10LTQvNC10YIg0K8u0JzRg9C30YvQutC4INC40LvQuCDQry7QoNCw0LTQuNC+XHJcbiAgICBzdGF0aWMgaXNVcmxNYXRjaCh1cmwpIHtcclxuICAgICAgICBpZiAodXJsLm1hdGNoKC9eaHR0cHM/OlxcL1xcLyhyYWRpb3xtdXNpYylcXC55YW5kZXhcXC4ocnV8Ynl8a3p8dWEpXFwvLipcXC4oZ2lmfHBuZ3xqcGd8c3ZnfGpzfGNzc3xpY28pJC8pKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBpc1JhZGlvID0gKHVybC5tYXRjaCgvXmh0dHBzPzpcXC9cXC9yYWRpb1xcLnlhbmRleFxcLihydXxieXxrenx1YSlcXC8uKiQvKSAhPT0gbnVsbCksXHJcbiAgICAgICAgICAgIGlzTXVzaWMgPSAodXJsLm1hdGNoKC9eaHR0cHM/OlxcL1xcL211c2ljXFwueWFuZGV4XFwuKHJ1fGJ5fGt6fHVhKVxcLy4qJC8pICE9PSBudWxsKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGlzUmFkaW8gfHwgaXNNdXNpYyA/IHtpc1JhZGlvOiBpc1JhZGlvLCBpc011c2ljOiBpc011c2ljfSA6IGZhbHNlO1xyXG4gICAgfTtcclxuXHJcbiAgICAvL2luamVjdCfQuNC8INC90LDRiCDQutC+0LQg0LIgY29udGVudC1zY3JpcHQg0LLQutC70LDQtNC60LhcclxuICAgIHN0YXRpYyBpbmplY3RTY3JpcHQodGFiSWQsIGZpbGUpIHtcclxuICAgICAgICBjaHJvbWUudGFicy5leGVjdXRlU2NyaXB0KHRhYklkLCB7ZmlsZTogZmlsZX0sICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlID09ICdUaGUgdGFiIHdhcyBjbG9zZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW5qZWN0IG9mIGZpbGUgPCcgKyBmaWxlICsgJz4gb24gdGFiIDwnICsgdGFiSWQgKyAnPiBlcnJvcjogJyArIGNocm9tZS5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvL2luamVjdCDQutC+0LTQsCDQsiDQv9GA0L7RgdGC0YDQsNC90L7RgdGC0LLQviDRgdGC0YDQsNC90LjRhtGLINC40LcgQ1Mg0YHQutGA0LjQv9GC0LAsINC60L7RgtC+0YDRi9C5INCy0YvQv9C+0LvQvdGP0LXRgtGB0Y8g0LIg0L/QtdGB0L7Rh9C90LjRhtC1XHJcbiAgICBzdGF0aWMgaW5qZWN0Q29kZShmdW5jLCAuLi5hcmdzKSB7XHJcbiAgICAgICAgbGV0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xyXG4gICAgICAgIHNjcmlwdC50ZXh0Q29udGVudCA9ICd0cnkgeygnICsgZnVuYyArICcpKCcgKyBhcmdzICsgJyk7IH0gY2F0Y2goZSkge2NvbnNvbGUuZXJyb3IoXCJpbmplY3RlZCBlcnJvclwiLCBlKTt9Oyc7XHJcbiAgICAgICAgKGRvY3VtZW50LmhlYWQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KS5hcHBlbmRDaGlsZChzY3JpcHQpO1xyXG4gICAgICAgIHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGd1aWQoKSB7XHJcbiAgICAgICAgbGV0IHM0ID0gZnVuY3Rpb24oKSB7IHJldHVybiBNYXRoLmZsb29yKCgxICsgTWF0aC5yYW5kb20oKSkgKiAweDEwMDAwKS50b1N0cmluZygxNikuc3Vic3RyaW5nKDEpOyB9O1xyXG4gICAgICAgIHJldHVybiBgJHtzNCgpfSR7czQoKX0tJHtzNCgpfS0ke3M0KCl9LSR7czQoKX0tJHtzNCgpfSR7czQoKX0ke3M0KCl9YDtcclxuICAgIH07XHJcblxyXG4gICAgc3RhdGljIGVycm9ySGFuZGxlciA9IGUgPT4ge1xyXG4gICAgICAgIGxvZy5lcnJvcignZXJyb3JIYW5kbGVyKCkgd2l0aCBlcnJvcicsIGUpO1xyXG4gICAgICAgIGdhKCdzZW5kJywgJ2V2ZW50JywgJ2Vycm9yJywgJ2JnJywgJ3YnICsgY2hyb21lLnJ1bnRpbWUuZ2V0TWFuaWZlc3QoKS52ZXJzaW9uICsgXCJcXG5cIiArIGUuc3RhY2spO1xyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgdXRpbHM7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vbGliL2pxdWVyeVwiKS5leHRlbmQ7XG4iLCIvKiFcbiAqIChleHRyYWN0ZWQgZnJvbSlcbiAqIGpRdWVyeSBKYXZhU2NyaXB0IExpYnJhcnkgdjIuMC4zXG4gKiBodHRwOi8vanF1ZXJ5LmNvbS9cbiAqXG4gKiBDb3B5cmlnaHQgMjAwNSwgMjAxMyBqUXVlcnkgRm91bmRhdGlvbiwgSW5jLiBhbmQgb3RoZXIgY29udHJpYnV0b3JzXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqIGh0dHA6Ly9qcXVlcnkub3JnL2xpY2Vuc2VcbiAqXG4gKiBEYXRlOiAyMDEzLTA3LTAzVDEzOjMwWlxuICovXG52YXIgY2xhc3MydHlwZSA9IHtcbiAgXCJbb2JqZWN0IEJvb2xlYW5dXCI6ICAgXCJib29sZWFuXCIsXG4gIFwiW29iamVjdCBOdW1iZXJdXCI6ICAgIFwibnVtYmVyXCIsXG4gIFwiW29iamVjdCBTdHJpbmddXCI6ICAgIFwic3RyaW5nXCIsXG4gIFwiW29iamVjdCBGdW5jdGlvbl1cIjogIFwiZnVuY3Rpb25cIixcbiAgXCJbb2JqZWN0IEFycmF5XVwiOiAgICAgXCJhcnJheVwiLFxuICBcIltvYmplY3QgRGF0ZV1cIjogICAgICBcImRhdGVcIixcbiAgXCJbb2JqZWN0IFJlZ0V4cF1cIjogICAgXCJyZWdleHBcIixcbiAgXCJbb2JqZWN0IE9iamVjdF1cIjogICAgXCJvYmplY3RcIixcbiAgXCJbb2JqZWN0IEVycm9yXVwiOiAgICAgXCJlcnJvclwiXG59O1xuXG52YXIgY29yZV90b1N0cmluZyA9IGNsYXNzMnR5cGUudG9TdHJpbmcsXG4gICAgY29yZV9oYXNPd24gICA9IGNsYXNzMnR5cGUuaGFzT3duUHJvcGVydHk7XG5cbnZhciBqUXVlcnkgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5qUXVlcnkuaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKCBvYmogKSB7XG4gIHJldHVybiBqUXVlcnkudHlwZShvYmopID09PSBcImZ1bmN0aW9uXCI7XG59O1xuXG5qUXVlcnkuaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG5cbmpRdWVyeS5pc1dpbmRvdyA9IGZ1bmN0aW9uKCBvYmogKSB7XG4gIHJldHVybiBvYmogIT0gbnVsbCAmJiBvYmogPT09IG9iai53aW5kb3c7XG59O1xuXG5qUXVlcnkudHlwZSA9IGZ1bmN0aW9uKCBvYmogKSB7XG4gIGlmICggb2JqID09IG51bGwgKSB7XG4gICAgcmV0dXJuIFN0cmluZyggb2JqICk7XG4gIH1cbiAgcmV0dXJuIHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIG9iaiA9PT0gXCJmdW5jdGlvblwiID9cbiAgICBjbGFzczJ0eXBlWyBjb3JlX3RvU3RyaW5nLmNhbGwob2JqKSBdIHx8IFwib2JqZWN0XCIgOlxuICAgIHR5cGVvZiBvYmo7XG59O1xuXG5qUXVlcnkuaXNQbGFpbk9iamVjdCA9IGZ1bmN0aW9uKCBvYmogKSB7XG4gIGlmICggalF1ZXJ5LnR5cGUoIG9iaiApICE9PSBcIm9iamVjdFwiIHx8IG9iai5ub2RlVHlwZSB8fCBqUXVlcnkuaXNXaW5kb3coIG9iaiApICkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgaWYgKCBvYmouY29uc3RydWN0b3IgJiYgIWNvcmVfaGFzT3duLmNhbGwoIG9iai5jb25zdHJ1Y3Rvci5wcm90b3R5cGUsIFwiaXNQcm90b3R5cGVPZlwiICkgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9IGNhdGNoICggZSApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbmpRdWVyeS5leHRlbmQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG9wdGlvbnMsXG4gICAgICBuYW1lLFxuICAgICAgc3JjLFxuICAgICAgY29weSxcbiAgICAgIGNvcHlJc0FycmF5LFxuICAgICAgY2xvbmUsXG4gICAgICB0YXJnZXQgPSBhcmd1bWVudHNbMF0gfHwge30sXG4gICAgICBpID0gMSxcbiAgICAgIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGgsXG4gICAgICBkZWVwID0gZmFsc2U7XG5cbiAgaWYgKCB0eXBlb2YgdGFyZ2V0ID09PSBcImJvb2xlYW5cIiApIHtcbiAgICBkZWVwID0gdGFyZ2V0O1xuICAgIHRhcmdldCA9IGFyZ3VtZW50c1sxXSB8fCB7fTtcbiAgICBpID0gMjtcbiAgfVxuXG4gIGlmICggdHlwZW9mIHRhcmdldCAhPT0gXCJvYmplY3RcIiAmJiAhalF1ZXJ5LmlzRnVuY3Rpb24odGFyZ2V0KSApIHtcbiAgICB0YXJnZXQgPSB7fTtcbiAgfVxuXG4gIGlmICggbGVuZ3RoID09PSBpICkge1xuICAgIHRhcmdldCA9IHRoaXM7XG4gICAgLS1pO1xuICB9XG5cbiAgZm9yICggOyBpIDwgbGVuZ3RoOyBpKysgKSB7XG4gICAgaWYgKCAob3B0aW9ucyA9IGFyZ3VtZW50c1sgaSBdKSAhPSBudWxsICkge1xuICAgICAgZm9yICggbmFtZSBpbiBvcHRpb25zICkge1xuICAgICAgICBzcmMgPSB0YXJnZXRbIG5hbWUgXTtcbiAgICAgICAgY29weSA9IG9wdGlvbnNbIG5hbWUgXTtcblxuICAgICAgICBpZiAoIHRhcmdldCA9PT0gY29weSApIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggZGVlcCAmJiBjb3B5ICYmICggalF1ZXJ5LmlzUGxhaW5PYmplY3QoY29weSkgfHwgKGNvcHlJc0FycmF5ID0galF1ZXJ5LmlzQXJyYXkoY29weSkpICkgKSB7XG4gICAgICAgICAgaWYgKCBjb3B5SXNBcnJheSApIHtcbiAgICAgICAgICAgIGNvcHlJc0FycmF5ID0gZmFsc2U7XG4gICAgICAgICAgICBjbG9uZSA9IHNyYyAmJiBqUXVlcnkuaXNBcnJheShzcmMpID8gc3JjIDogW107XG5cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2xvbmUgPSBzcmMgJiYgalF1ZXJ5LmlzUGxhaW5PYmplY3Qoc3JjKSA/IHNyYyA6IHt9O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRhcmdldFsgbmFtZSBdID0galF1ZXJ5LmV4dGVuZCggZGVlcCwgY2xvbmUsIGNvcHkgKTtcblxuICAgICAgICB9IGVsc2UgaWYgKCBjb3B5ICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgdGFyZ2V0WyBuYW1lIF0gPSBjb3B5O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRhcmdldDtcbn07XG4iLCIvKlxuKiBsb2dsZXZlbCAtIGh0dHBzOi8vZ2l0aHViLmNvbS9waW10ZXJyeS9sb2dsZXZlbFxuKlxuKiBDb3B5cmlnaHQgKGMpIDIwMTMgVGltIFBlcnJ5XG4qIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiovXG4oZnVuY3Rpb24gKHJvb3QsIGRlZmluaXRpb24pIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShkZWZpbml0aW9uKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3QubG9nID0gZGVmaW5pdGlvbigpO1xuICAgIH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgLy8gU2xpZ2h0bHkgZHViaW91cyB0cmlja3MgdG8gY3V0IGRvd24gbWluaW1pemVkIGZpbGUgc2l6ZVxuICAgIHZhciBub29wID0gZnVuY3Rpb24oKSB7fTtcbiAgICB2YXIgdW5kZWZpbmVkVHlwZSA9IFwidW5kZWZpbmVkXCI7XG5cbiAgICB2YXIgbG9nTWV0aG9kcyA9IFtcbiAgICAgICAgXCJ0cmFjZVwiLFxuICAgICAgICBcImRlYnVnXCIsXG4gICAgICAgIFwiaW5mb1wiLFxuICAgICAgICBcIndhcm5cIixcbiAgICAgICAgXCJlcnJvclwiXG4gICAgXTtcblxuICAgIC8vIENyb3NzLWJyb3dzZXIgYmluZCBlcXVpdmFsZW50IHRoYXQgd29ya3MgYXQgbGVhc3QgYmFjayB0byBJRTZcbiAgICBmdW5jdGlvbiBiaW5kTWV0aG9kKG9iaiwgbWV0aG9kTmFtZSkge1xuICAgICAgICB2YXIgbWV0aG9kID0gb2JqW21ldGhvZE5hbWVdO1xuICAgICAgICBpZiAodHlwZW9mIG1ldGhvZC5iaW5kID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gbWV0aG9kLmJpbmQob2JqKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kLmNhbGwobWV0aG9kLCBvYmopO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIC8vIE1pc3NpbmcgYmluZCBzaGltIG9yIElFOCArIE1vZGVybml6ciwgZmFsbGJhY2sgdG8gd3JhcHBpbmdcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHkuYXBwbHkobWV0aG9kLCBbb2JqLCBhcmd1bWVudHNdKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQnVpbGQgdGhlIGJlc3QgbG9nZ2luZyBtZXRob2QgcG9zc2libGUgZm9yIHRoaXMgZW52XG4gICAgLy8gV2hlcmV2ZXIgcG9zc2libGUgd2Ugd2FudCB0byBiaW5kLCBub3Qgd3JhcCwgdG8gcHJlc2VydmUgc3RhY2sgdHJhY2VzXG4gICAgZnVuY3Rpb24gcmVhbE1ldGhvZChtZXRob2ROYW1lKSB7XG4gICAgICAgIGlmIChtZXRob2ROYW1lID09PSAnZGVidWcnKSB7XG4gICAgICAgICAgICBtZXRob2ROYW1lID0gJ2xvZyc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgPT09IHVuZGVmaW5lZFR5cGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gTm8gbWV0aG9kIHBvc3NpYmxlLCBmb3Igbm93IC0gZml4ZWQgbGF0ZXIgYnkgZW5hYmxlTG9nZ2luZ1doZW5Db25zb2xlQXJyaXZlc1xuICAgICAgICB9IGVsc2UgaWYgKGNvbnNvbGVbbWV0aG9kTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGJpbmRNZXRob2QoY29uc29sZSwgbWV0aG9kTmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY29uc29sZS5sb2cgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGJpbmRNZXRob2QoY29uc29sZSwgJ2xvZycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUaGVzZSBwcml2YXRlIGZ1bmN0aW9ucyBhbHdheXMgbmVlZCBgdGhpc2AgdG8gYmUgc2V0IHByb3Blcmx5XG5cbiAgICBmdW5jdGlvbiByZXBsYWNlTG9nZ2luZ01ldGhvZHMobGV2ZWwsIGxvZ2dlck5hbWUpIHtcbiAgICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsb2dNZXRob2RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbWV0aG9kTmFtZSA9IGxvZ01ldGhvZHNbaV07XG4gICAgICAgICAgICB0aGlzW21ldGhvZE5hbWVdID0gKGkgPCBsZXZlbCkgP1xuICAgICAgICAgICAgICAgIG5vb3AgOlxuICAgICAgICAgICAgICAgIHRoaXMubWV0aG9kRmFjdG9yeShtZXRob2ROYW1lLCBsZXZlbCwgbG9nZ2VyTmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZWZpbmUgbG9nLmxvZyBhcyBhbiBhbGlhcyBmb3IgbG9nLmRlYnVnXG4gICAgICAgIHRoaXMubG9nID0gdGhpcy5kZWJ1ZztcbiAgICB9XG5cbiAgICAvLyBJbiBvbGQgSUUgdmVyc2lvbnMsIHRoZSBjb25zb2xlIGlzbid0IHByZXNlbnQgdW50aWwgeW91IGZpcnN0IG9wZW4gaXQuXG4gICAgLy8gV2UgYnVpbGQgcmVhbE1ldGhvZCgpIHJlcGxhY2VtZW50cyBoZXJlIHRoYXQgcmVnZW5lcmF0ZSBsb2dnaW5nIG1ldGhvZHNcbiAgICBmdW5jdGlvbiBlbmFibGVMb2dnaW5nV2hlbkNvbnNvbGVBcnJpdmVzKG1ldGhvZE5hbWUsIGxldmVsLCBsb2dnZXJOYW1lKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IHVuZGVmaW5lZFR5cGUpIHtcbiAgICAgICAgICAgICAgICByZXBsYWNlTG9nZ2luZ01ldGhvZHMuY2FsbCh0aGlzLCBsZXZlbCwgbG9nZ2VyTmFtZSk7XG4gICAgICAgICAgICAgICAgdGhpc1ttZXRob2ROYW1lXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIEJ5IGRlZmF1bHQsIHdlIHVzZSBjbG9zZWx5IGJvdW5kIHJlYWwgbWV0aG9kcyB3aGVyZXZlciBwb3NzaWJsZSwgYW5kXG4gICAgLy8gb3RoZXJ3aXNlIHdlIHdhaXQgZm9yIGEgY29uc29sZSB0byBhcHBlYXIsIGFuZCB0aGVuIHRyeSBhZ2Fpbi5cbiAgICBmdW5jdGlvbiBkZWZhdWx0TWV0aG9kRmFjdG9yeShtZXRob2ROYW1lLCBsZXZlbCwgbG9nZ2VyTmFtZSkge1xuICAgICAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgICAgICByZXR1cm4gcmVhbE1ldGhvZChtZXRob2ROYW1lKSB8fFxuICAgICAgICAgICAgICAgZW5hYmxlTG9nZ2luZ1doZW5Db25zb2xlQXJyaXZlcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIExvZ2dlcihuYW1lLCBkZWZhdWx0TGV2ZWwsIGZhY3RvcnkpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBjdXJyZW50TGV2ZWw7XG4gICAgICB2YXIgc3RvcmFnZUtleSA9IFwibG9nbGV2ZWxcIjtcbiAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgIHN0b3JhZ2VLZXkgKz0gXCI6XCIgKyBuYW1lO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBwZXJzaXN0TGV2ZWxJZlBvc3NpYmxlKGxldmVsTnVtKSB7XG4gICAgICAgICAgdmFyIGxldmVsTmFtZSA9IChsb2dNZXRob2RzW2xldmVsTnVtXSB8fCAnc2lsZW50JykudG9VcHBlckNhc2UoKTtcblxuICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSB1bmRlZmluZWRUeXBlKSByZXR1cm47XG5cbiAgICAgICAgICAvLyBVc2UgbG9jYWxTdG9yYWdlIGlmIGF2YWlsYWJsZVxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc3RvcmFnZUtleV0gPSBsZXZlbE5hbWU7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGNhdGNoIChpZ25vcmUpIHt9XG5cbiAgICAgICAgICAvLyBVc2Ugc2Vzc2lvbiBjb29raWUgYXMgZmFsbGJhY2tcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICB3aW5kb3cuZG9jdW1lbnQuY29va2llID1cbiAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoc3RvcmFnZUtleSkgKyBcIj1cIiArIGxldmVsTmFtZSArIFwiO1wiO1xuICAgICAgICAgIH0gY2F0Y2ggKGlnbm9yZSkge31cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZ2V0UGVyc2lzdGVkTGV2ZWwoKSB7XG4gICAgICAgICAgdmFyIHN0b3JlZExldmVsO1xuXG4gICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09IHVuZGVmaW5lZFR5cGUpIHJldHVybjtcblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHN0b3JlZExldmVsID0gd2luZG93LmxvY2FsU3RvcmFnZVtzdG9yYWdlS2V5XTtcbiAgICAgICAgICB9IGNhdGNoIChpZ25vcmUpIHt9XG5cbiAgICAgICAgICAvLyBGYWxsYmFjayB0byBjb29raWVzIGlmIGxvY2FsIHN0b3JhZ2UgZ2l2ZXMgdXMgbm90aGluZ1xuICAgICAgICAgIGlmICh0eXBlb2Ygc3RvcmVkTGV2ZWwgPT09IHVuZGVmaW5lZFR5cGUpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgIHZhciBjb29raWUgPSB3aW5kb3cuZG9jdW1lbnQuY29va2llO1xuICAgICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gY29va2llLmluZGV4T2YoXG4gICAgICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHN0b3JhZ2VLZXkpICsgXCI9XCIpO1xuICAgICAgICAgICAgICAgICAgaWYgKGxvY2F0aW9uICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgIHN0b3JlZExldmVsID0gL14oW147XSspLy5leGVjKGNvb2tpZS5zbGljZShsb2NhdGlvbikpWzFdO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGNhdGNoIChpZ25vcmUpIHt9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gSWYgdGhlIHN0b3JlZCBsZXZlbCBpcyBub3QgdmFsaWQsIHRyZWF0IGl0IGFzIGlmIG5vdGhpbmcgd2FzIHN0b3JlZC5cbiAgICAgICAgICBpZiAoc2VsZi5sZXZlbHNbc3RvcmVkTGV2ZWxdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgc3RvcmVkTGV2ZWwgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHN0b3JlZExldmVsO1xuICAgICAgfVxuXG4gICAgICAvKlxuICAgICAgICpcbiAgICAgICAqIFB1YmxpYyBsb2dnZXIgQVBJIC0gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9waW10ZXJyeS9sb2dsZXZlbCBmb3IgZGV0YWlsc1xuICAgICAgICpcbiAgICAgICAqL1xuXG4gICAgICBzZWxmLm5hbWUgPSBuYW1lO1xuXG4gICAgICBzZWxmLmxldmVscyA9IHsgXCJUUkFDRVwiOiAwLCBcIkRFQlVHXCI6IDEsIFwiSU5GT1wiOiAyLCBcIldBUk5cIjogMyxcbiAgICAgICAgICBcIkVSUk9SXCI6IDQsIFwiU0lMRU5UXCI6IDV9O1xuXG4gICAgICBzZWxmLm1ldGhvZEZhY3RvcnkgPSBmYWN0b3J5IHx8IGRlZmF1bHRNZXRob2RGYWN0b3J5O1xuXG4gICAgICBzZWxmLmdldExldmVsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBjdXJyZW50TGV2ZWw7XG4gICAgICB9O1xuXG4gICAgICBzZWxmLnNldExldmVsID0gZnVuY3Rpb24gKGxldmVsLCBwZXJzaXN0KSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBsZXZlbCA9PT0gXCJzdHJpbmdcIiAmJiBzZWxmLmxldmVsc1tsZXZlbC50b1VwcGVyQ2FzZSgpXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgIGxldmVsID0gc2VsZi5sZXZlbHNbbGV2ZWwudG9VcHBlckNhc2UoKV07XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0eXBlb2YgbGV2ZWwgPT09IFwibnVtYmVyXCIgJiYgbGV2ZWwgPj0gMCAmJiBsZXZlbCA8PSBzZWxmLmxldmVscy5TSUxFTlQpIHtcbiAgICAgICAgICAgICAgY3VycmVudExldmVsID0gbGV2ZWw7XG4gICAgICAgICAgICAgIGlmIChwZXJzaXN0ICE9PSBmYWxzZSkgeyAgLy8gZGVmYXVsdHMgdG8gdHJ1ZVxuICAgICAgICAgICAgICAgICAgcGVyc2lzdExldmVsSWZQb3NzaWJsZShsZXZlbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVwbGFjZUxvZ2dpbmdNZXRob2RzLmNhbGwoc2VsZiwgbGV2ZWwsIG5hbWUpO1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgPT09IHVuZGVmaW5lZFR5cGUgJiYgbGV2ZWwgPCBzZWxmLmxldmVscy5TSUxFTlQpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBcIk5vIGNvbnNvbGUgYXZhaWxhYmxlIGZvciBsb2dnaW5nXCI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aHJvdyBcImxvZy5zZXRMZXZlbCgpIGNhbGxlZCB3aXRoIGludmFsaWQgbGV2ZWw6IFwiICsgbGV2ZWw7XG4gICAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgc2VsZi5zZXREZWZhdWx0TGV2ZWwgPSBmdW5jdGlvbiAobGV2ZWwpIHtcbiAgICAgICAgICBpZiAoIWdldFBlcnNpc3RlZExldmVsKCkpIHtcbiAgICAgICAgICAgICAgc2VsZi5zZXRMZXZlbChsZXZlbCwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHNlbGYuZW5hYmxlQWxsID0gZnVuY3Rpb24ocGVyc2lzdCkge1xuICAgICAgICAgIHNlbGYuc2V0TGV2ZWwoc2VsZi5sZXZlbHMuVFJBQ0UsIHBlcnNpc3QpO1xuICAgICAgfTtcblxuICAgICAgc2VsZi5kaXNhYmxlQWxsID0gZnVuY3Rpb24ocGVyc2lzdCkge1xuICAgICAgICAgIHNlbGYuc2V0TGV2ZWwoc2VsZi5sZXZlbHMuU0lMRU5ULCBwZXJzaXN0KTtcbiAgICAgIH07XG5cbiAgICAgIC8vIEluaXRpYWxpemUgd2l0aCB0aGUgcmlnaHQgbGV2ZWxcbiAgICAgIHZhciBpbml0aWFsTGV2ZWwgPSBnZXRQZXJzaXN0ZWRMZXZlbCgpO1xuICAgICAgaWYgKGluaXRpYWxMZXZlbCA9PSBudWxsKSB7XG4gICAgICAgICAgaW5pdGlhbExldmVsID0gZGVmYXVsdExldmVsID09IG51bGwgPyBcIldBUk5cIiA6IGRlZmF1bHRMZXZlbDtcbiAgICAgIH1cbiAgICAgIHNlbGYuc2V0TGV2ZWwoaW5pdGlhbExldmVsLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgLypcbiAgICAgKlxuICAgICAqIFRvcC1sZXZlbCBBUElcbiAgICAgKlxuICAgICAqL1xuXG4gICAgdmFyIGRlZmF1bHRMb2dnZXIgPSBuZXcgTG9nZ2VyKCk7XG5cbiAgICB2YXIgX2xvZ2dlcnNCeU5hbWUgPSB7fTtcbiAgICBkZWZhdWx0TG9nZ2VyLmdldExvZ2dlciA9IGZ1bmN0aW9uIGdldExvZ2dlcihuYW1lKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIiB8fCBuYW1lID09PSBcIlwiKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIllvdSBtdXN0IHN1cHBseSBhIG5hbWUgd2hlbiBjcmVhdGluZyBhIGxvZ2dlci5cIik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbG9nZ2VyID0gX2xvZ2dlcnNCeU5hbWVbbmFtZV07XG4gICAgICAgIGlmICghbG9nZ2VyKSB7XG4gICAgICAgICAgbG9nZ2VyID0gX2xvZ2dlcnNCeU5hbWVbbmFtZV0gPSBuZXcgTG9nZ2VyKFxuICAgICAgICAgICAgbmFtZSwgZGVmYXVsdExvZ2dlci5nZXRMZXZlbCgpLCBkZWZhdWx0TG9nZ2VyLm1ldGhvZEZhY3RvcnkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsb2dnZXI7XG4gICAgfTtcblxuICAgIC8vIEdyYWIgdGhlIGN1cnJlbnQgZ2xvYmFsIGxvZyB2YXJpYWJsZSBpbiBjYXNlIG9mIG92ZXJ3cml0ZVxuICAgIHZhciBfbG9nID0gKHR5cGVvZiB3aW5kb3cgIT09IHVuZGVmaW5lZFR5cGUpID8gd2luZG93LmxvZyA6IHVuZGVmaW5lZDtcbiAgICBkZWZhdWx0TG9nZ2VyLm5vQ29uZmxpY3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IHVuZGVmaW5lZFR5cGUgJiZcbiAgICAgICAgICAgICAgIHdpbmRvdy5sb2cgPT09IGRlZmF1bHRMb2dnZXIpIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2cgPSBfbG9nO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlZmF1bHRMb2dnZXI7XG4gICAgfTtcblxuICAgIGRlZmF1bHRMb2dnZXIuZ2V0TG9nZ2VycyA9IGZ1bmN0aW9uIGdldExvZ2dlcnMoKSB7XG4gICAgICAgIHJldHVybiBfbG9nZ2Vyc0J5TmFtZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGRlZmF1bHRMb2dnZXI7XG59KSk7XG4iLCJsZXQgbmV3cyA9IHtcclxuICAgICcxLjcuMTMnOiB7XHJcbiAgICAgICAgZGF0ZTogJzA1INCw0LLQs9GD0YHRgtCwIDIwMjAnLFxyXG4gICAgICAgIHRleHQ6ICfQoNCw0LfRgNC10YjQtdC90LjRjyDQvdCwINC30LDQv9C40YHRjCDQsiDRhNCw0LnQuyAo0LTQu9GPINGB0YLRgNC40LzQtdGA0L7Qsikg0LLRi9C90LXRgdC10L3RiyDQsiDQvdC10L7QsdGP0LfQsNGC0LXQu9GM0L3Ri9C1JyxcclxuICAgIH0sXHJcbiAgICAnMS43LjExJzoge1xyXG4gICAgICAgIGRhdGU6ICcwNSDQvtC60YLRj9Cx0YDRjyAyMDE4JyxcclxuICAgICAgICB0ZXh0OiAn0JTQvtCx0LDQstC70LXQvdCwINC+0LHRj9C30LDRgtC10LvRjNC90YvQuSDQvtC/0YDQvtGBINC/0YDQviDQvdC+0LLRg9GOINGE0YPQvdC60YbQuNGOLicsXHJcbiAgICAgICAgdXJnZW50OiB0cnVlLFxyXG4gICAgfSxcclxuICAgICcxLjcuOCc6IHtcclxuICAgICAgICBkYXRlOiAnMTYg0YHQtdC90YLRj9Cx0YDRjyAyMDE4JyxcclxuICAgICAgICB0ZXh0OiAn0JTQvtCx0LDQstC70LXQvdCwINC90L7QstCw0Y8g0YTRg9C90LrRhtC40Y8g0YLRgNCw0L3RgdC70Y/RhtC40Lgg0LjQvdGE0L7RgNC80LDRhtC40Lgg0L4g0YLQtdC60YPRidC10Lwg0YLRgNC10LrQtSDQsiDRhNCw0LnQuywg0LTQvtGB0YLRg9C/0L3QviDQsiDRgNCw0LfQtNC10LvQtSBcItCj0LLQtdC00L7QvNC70LXQvdC40Y9cIiA+IFwi0KLRgNCw0L3RgdC70Y/RhtC40Y9cIi4g0JTQu9GPINC00LDQvdC90L7QuSDRhNGD0L3QutGG0LjQuCDQv9C+0YLRgNC10LHQvtCy0LDQu9C40YHRjCDQvdC+0LLRi9C1INGA0LDQt9GA0LXRiNC10L3QuNGPIFwi0KPQv9GA0LDQstC70LXQvdC40LUg0YHQutCw0YfQsNC90L3Ri9C80Lgg0YTQsNC50LvQsNC80LhcIiwg0L4g0YfQtdC8INC90LDQv9C40YHQsNC90L4g0LIg0YDQsNC30LTQtdC70LUgXCLQn9C+0LzQvtGJ0YxcIi4nLFxyXG4gICAgfSxcclxuICAgICcxLjcuNic6IHtcclxuICAgICAgICBkYXRlOiAnMTYg0LDQv9GA0LXQu9GPIDIwMTgnLFxyXG4gICAgICAgIHRleHQ6ICfQktC90LjQvNCw0L3QuNC1ISDQkiBHb29nbGUgQ2hyb21lINCy0LXRgNGB0LjQuCA2NSDQutCw0LrQvtC5LdGC0L4g0LHQsNCzINGBINCz0L7RgNGP0YfQuNC80Lgg0LrQu9Cw0LLQuNGI0LDQvNC4LCDQuNGFINC90LUg0L/QvtC70YPRh9Cw0LXRgtGB0Y8g0L/QtdGA0LXQutC70Y7Rh9C40YLRjCDQsiDRgNC10LbQuNC8IFwi0JPQu9C+0LHQsNC70YzQvdC+XCIsINC00LDQttC1INC10YHQu9C4INC30L3QsNGH0LXQvdC40LUg0YPRgdGC0LDQvdCw0LLQu9C40LLQsNC10YLRgdGPLCDQsiDRgNC10LDQu9GM0L3QvtGB0YLQuCDQutC90L7Qv9C60Lgg0L3QtSDRgNCw0LHQvtGC0LDRjtGCINCy0L3QtSDQvtC60L3QsCDQsdGA0LDRg9C30LXRgNCwISDQn9C+0LrQsCDRjdGC0L4g0L3QtSDQuNGB0L/RgNCw0LLRj9GCLCDRgdC40LvQsNC80Lgg0YDQsNGB0YjQuNGA0LXQvdC40Y8g0Y3RgtC+INC90LUg0L/QvtGH0LjQvdC40YLRjC4uLicsXHJcbiAgICAgICAgaGlnaDogdHJ1ZSxcclxuICAgIH0sXHJcbiAgICAnMS43LjQnOiB7XHJcbiAgICAgICAgZGF0ZTogJzE0INC40Y7Qu9GPIDIwMTcnLFxyXG4gICAgICAgIHRleHQ6ICfQlNC+0LHQsNCy0LjQuyDQs9C+0YDRj9GH0LjQtSDQutC70LDQstC40YjQuCDQtNC70Y8g0L/QtdGA0LXQvNC+0YLQutC4INCy0L/QtdGA0LXQtCDQvdCw0LfQsNC0INC90LAgMTDRgdC10LouJyxcclxuICAgIH0sXHJcbiAgICAnMS43LjMnOiB7XHJcbiAgICAgICAgZGF0ZTogJzI2INC+0LrRgtGP0LHRgNGPIDIwMTYnLFxyXG4gICAgICAgIHRleHQ6ICfQlNC+0LHQsNCy0LjQuyDQv9C+0LTQtNC10YDQttC60YMg0LLRi9GB0L7QutC40YUg0YDQsNC30YDQtdGI0LXQvdC40Lkg0Y3QutGA0LDQvdC+0LIsINC90L4g0LLRi9GB0L7RgtCwINCy0YHQv9C70YvQstCw0Y7RidC10LPQviDQvtC60L3QsCDQvdC1INC80L7QttC10YIg0LHRi9GC0Ywg0LHQvtC70YzRiNC1IDYwMCAtINGN0YLQviDQvtCz0YDQsNC90LjRh9C10L3QuNC1INCx0YDQsNGD0LfQtdGA0LAhJyxcclxuICAgIH0sXHJcbiAgICAnMS43LjEnOiB7XHJcbiAgICAgICAgZGF0ZTogJzE2INGB0LXQvdGC0Y/QsdGA0Y8gMjAxNicsXHJcbiAgICAgICAgdGV4dDogJ9Cf0L7Qu9C90YvQuSDRgNC10YTQsNC60YLQvtGA0LjQvdCzINC+0LrQvdCwINGBINGD0L/RgNCw0LLQu9C10L3QuNC10Lwg0L/Qu9C10LXRgNC+0LwsINC00L7RgNCw0LHQvtGC0LrQsCDQv9C+0LTQtNC10YDQttC60Lgg0YDQtdC60LvQsNC80YssINC60L7RgtC+0YDQvtC5LCDQuiDRgdC+0LbQsNC70LXQvdC40Y4sINC90LAg0YHQsNC50YLQtSDQvdCwINCx0LXRgdC/0LvQsNGC0L3QvtC8INCw0LrQutCw0YPQvdGC0LUg0YHRgtCw0LvQviDQvtGH0LXQvdGMINC80L3QvtCz0L4uJyxcclxuICAgIH0sXHJcbiAgICAnMS43LjAnOiB7XHJcbiAgICAgICAgZGF0ZTogJzE2INGB0LXQvdGC0Y/QsdGA0Y8gMjAxNicsXHJcbiAgICAgICAgdGV4dDogJ9Cb0LXRgtC+INC/0YDQvtGI0LvQviwg0L3QsNC60L7QvdC10YYg0Y8g0LLQtdGA0L3Rg9C70YHRjyDQuiDQtNC+0YDQsNCx0L7RgtC60LDQvCDRgNCw0YHRiNC40YDQtdC90LjRjy4g0J7RhNC40YbQuNCw0LvRjNC90YvQuSDQv9C70LDQs9C40L0g0L7RgiDQry7QnNGD0LfRi9C60Lgg0L3QtSDQv9C+0LrQsNC30LDQuyDRgtC10YUg0L/QvtC60LDQt9Cw0YLQtdC70LXQuSDQutC+0LvQuNGH0LXRgdGC0LLQsCDQv9C+0LvRjNC30L7QstCw0YLQtdC70LXQuSwg0LrQvtGC0L7RgNGL0LUg0Y8g0L/QtdGH0LDQu9GM0L3QviDQv9GA0LXQtNC/0L7Qu9Cw0LPQsNC7INC4INGN0YLQviDQtNCw0LbQtSDQvdC1INGB0LzQvtGC0YDRjyDQvdCwINGA0LXQutC70LDQvNGDINC/0YDRj9C80L4g0L3QsCDQstC40YLRgNC40L3QtS4g0KLQsNC6INGH0YLQviDQvtCx0L3QvtCy0LvQtdC90LjRjyDQtdGJ0LUg0LHRg9C00YPRgiEg0J/QvtC80L3RjiDQuCDQv9GA0L4g0YLRg9C00YMt0LvQuNGB0YIg0LIg0L7RgtC30YvQstCw0YUgOyknLFxyXG4gICAgfSxcclxuICAgICcxLjYuMTUnOiB7XHJcbiAgICAgICAgZGF0ZTogJzI0INC80LDRjyAyMDE2JyxcclxuICAgICAgICB0ZXh0OiAn0JTQvtCx0LDQstC40Lsg0LLQvtC30LzQvtC20L3QvtGB0YLRjCDQvtGC0LrQu9GO0YfQtdC90LjRjyDQv9C+0LTRgtCy0LXRgNC20LTQtdC90LjRjyDQv9GA0Lgg0L7RgtC60YDRi9GC0LjQuCDQstC60LvQsNC00LrQuCDRgSDQry7QnNGD0LfRi9C60L7QuSDQstC+INCy0YDQtdC80Y8g0L/RgNC+0LjQs9GA0YvQstCw0L3QuNGPLiDQnNC+0LbQvdC+INCy0YvQutC70Y7Rh9C40YLRjCDQsiDQndCw0YHRgtGA0L7QudC60LggPiDQntCx0YnQtdC1ID4g0J/RgNC+0YfQtdC1JyxcclxuICAgIH0sXHJcbiAgICAnMS42LjE0Jzoge1xyXG4gICAgICAgIGRhdGU6ICcyMSDQsNC/0YDQtdC70Y8gMjAxNicsXHJcbiAgICAgICAgdGV4dDogJ9CU0L7QsdCw0LLQuNC7INC/0L7QtNC00LXRgNC20LrRgyDQutC90L7Qv9C60LggXCLQndC1INGA0LXQutC+0LzQtdC90LTQvtCy0LDRgtGMXCIg0LIg0YPQstC10LTQvtC80LvQtdC90LjRjyDQuCDQs9C+0YDRj9GH0LjQtSDQutC70LDQstC40YjQuC4g0KLQsNC60LbQtSDQsdGL0LvQuCDQuNGB0L/RgNCw0LLQu9C10L3RiyDQvdC10LrQvtGC0L7RgNGL0LUg0L7RiNC40LHQutC4LCDQstC+0LfQvdC40LrRiNC40LUg0LjQty3Qt9CwINC90L7QstC+0LPQviDRgNC10LvQuNC30LAg0K8u0JzRg9C30YvQutC4LicsXHJcbiAgICB9LFxyXG4gICAgJzEuNi4xMSc6IHtcclxuICAgICAgICBkYXRlOiAnMDgg0LDQv9GA0LXQu9GPIDIwMTYnLFxyXG4gICAgICAgIHRleHQ6ICfQlNC+0LHQsNCy0LjQuyDQstC+0LfQvNC+0LbQvdC+0YHRgtGMINCyINC90LDRgdGC0YDQvtC50LrQsNGFINCyINGA0LDQt9C00LXQu9C1IFwi0JPQvtGA0Y/Rh9C40LUg0LrQu9Cw0LLQuNGI0LhcIiDQstC60LvRjtGH0LjRgtGMINGD0LLQtdC00L7QvNC70LXQvdC40LUg0L7QsSDQuNC30LzQtdC90LXQvdC40Lgg0YDQtdC20LjQvNCwINC/0L7QstGC0L7RgNCwLicsXHJcbiAgICB9LFxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3cztcclxuIl19
