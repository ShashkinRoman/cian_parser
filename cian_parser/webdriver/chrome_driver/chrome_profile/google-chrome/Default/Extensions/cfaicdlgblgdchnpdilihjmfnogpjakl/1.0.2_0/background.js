!function(){"use strict";function s(e,t){d[e]?chrome.tabs.sendMessage(e,t):(chrome.tabs.executeScript({file:"content.js"},function(){chrome.tabs.sendMessage(e,t)}),d[e]=!0)}function a(r){chrome.tabs.query({active:!0,currentWindow:!0},function(e){var t=e[0];t&&s(t.id,r)})}function n(r){void 0===r&&(r=!1),chrome.tabs.query({active:!0,currentWindow:!0},function(e){var t=e[0].id;delete d[t],delete b[t],r&&(h[t]=!0),chrome.tabs.reload(t)})}function o(e){void 0===e&&(e={});var t="",r=e.icon||"images/32x32.png";switch(e.result){case 1:t="#24BC8C";break;case 2:t="#F16D6D"}chrome.browserAction.setIcon({path:r}),t?(chrome.browserAction.setBadgeText({text:" "}),chrome.browserAction.setBadgeBackgroundColor({color:t})):chrome.browserAction.setBadgeText({text:""})}function c(e){void 0===e&&(e=!0),e?(chrome.browserAction.setPopup({popup:"popup.html"}),o(),chrome.tabs.executeScript({file:"indicator.js"},function(e){return chrome.runtime.lastError})):(chrome.browserAction.setPopup({popup:""}),o({icon:"images/32x32_disabled.png"}))}function i(a,n){chrome.tabs.query({active:!0,currentWindow:!0},function(e){var t=e[0];if(t){var r=t.id,s=b[r];s?s.ready?chrome.tabs.sendMessage(r,[a,n]):p.push([a,n]):(p.push([a,n]),chrome.tabs.executeScript({file:"parse.js"},function(){b[r]={ready:!0},p.forEach(function(e){return chrome.tabs.sendMessage(r,e)}),p=[]}),b[r]={ready:!1})}})}var u=/^https?\:\/\//g,d={},h={},b={},p=[];chrome.runtime.onMessage.addListener(function(e){var t=e[0],r=e[1];switch(t){case"injectSettings":a(["openSettings",3]);break;case"injectSettingsWithReload":n(!0);break;case"injectPreset":a(["showPreset"]);break;case"showPresetInfo":a(["showPresetInfo"]);break;case"reloadTabOnSettingsClose":n();break;case"updateParseStatus":c();break;case"clearParseStatus":o();break;case"parseStatus":o(r);break;case"runParsingEngine":i("run");break;case"savePreset":i("preset:save",r)}}),chrome.storage.onChanged.addListener(function(e){(e.parsed||e.auth)&&c()}),chrome.tabs.onUpdated.addListener(function(t,e){var r=e.status;"loading"===r&&(delete d[t],delete b[t]),chrome.tabs.getSelected(null,function(e){if(t===e.id)switch(r){case"complete":c((e.url||e.pendingUrl||"").match(u)),h[t]&&(s(t,["openSettings",1]),delete h[t]);break;default:o()}})}),chrome.tabs.onActivated.addListener(function(e){var t=e.windowId;chrome.tabs.getSelected(t,function(e){var t=e.url,r=e.pendingUrl;"complete"===e.status&&c((t||r||"").match(u))})})}();
