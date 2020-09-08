/*
  CONG-186: Hoverboard picker should not trigger while viewport is in motion
*/

// our logic version
const LOGIC_VERSION = 2020082401;

((w, d, a) => {
  var $ = (w[a.k] = {
    w,
    d,
    a,
    b: chrome || browser,
    // local global variables
    v: {
      debug: false,
      lang: 'en',
      domain: 'www',
      hazButton: false,
      nopin: false,
      observer: {},
      meta: {},
      msg: {},
      lastWheel: 0,
    },
    // Structure: button and iframe overlays will live here
    s: {},
    f: {
      // console.log to background window
      debug: (o) => {
        if (o && $.v.debug) {
          console.log(o);
        }
      },
      // get a DOM property or text attribute
      get: (o) => {
        var v = null;
        if (typeof o.el[o.att] === 'string') {
          v = o.el[o.tt];
        } else {
          v = o.el.getAttribute(o.att);
        }
        return v;
      },
      // set a DOM property or text attribute
      set: (o) => {
        if (typeof o.el[o.att] === 'string') {
          o.el[o.att] = o.string;
        } else {
          o.el.setAttribute(o.att, o.string);
        }
      },
      // remove a DOM element
      kill: (o) => {
        if (o.el && o.el.parentNode) {
          o.el.parentNode.removeChild(o.el);
        }
      },
      // create a DOM element
      make: (o) => {
        var el = false,
          t,
          a,
          k;
        for (t in o) {
          el = $.d.createElement(t);
          for (a in o[t]) {
            if (typeof o[t][a] === 'string') {
              $.f.set({ el: el, att: a, string: o[t][a] });
            } else {
              if (a === 'style') {
                for (k in o[t][a]) {
                  el.style[k] = o[t][a][k];
                }
              }
            }
          }
          break;
        }
        return el;
      },
      // taken from background.js's $.f.context.makeUUID()
      // make a hexadecimal string of an RFC4122 compliant UUID
      makeUUID: () => {
        return [1e7, 1e3, 4e3, 8e3, 1e11]
          .join('')
          .replace(/[018]/g, (c) =>
            (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16),
          );
      },
      // send a message
      sendMessage: (o) => {
        $.f.debug('Sending message');
        o.via = $.v.me;
        if (!o.to) {
          o.to = 'background';
        }
        $.f.debug(JSON.stringify(o));
        $.b.runtime.sendMessage(o);
      },
      // send a ping from the background process to log.pinterest.com
      log: (o) => {
        o.lv = $.a.version;
        if (!o.via) {
          o.via = $.d.URL;
        }
        $.f.sendMessage({
          act: 'log',
          data: o,
        });
      },
      // make a base-60 number of length n
      random60: (n) => {
        let i, r;
        r = '';
        n = n - 0;
        if (!n) {
          n = 12;
        }
        for (i = 0; i < n; i = i + 1) {
          r = r + $.a.digits.substr(Math.floor(Math.random() * 60), 1);
        }
        return r;
      },
      // determine our experimental segment
      getSegment: () => {
        let t = $.v.xuid.split('');
        $.v.segment =
          ($.a.version +
            $.a.digits.indexOf(t[0]) +
            $.a.digits.indexOf(t[1]) +
            $.a.digits.indexOf(t[2])) %
          100;
        $.f.debug('Your segment: ' + $.v.segment);
      },
      // if we're right-clicking on an image, save it to $.v.contextEl
      context: (e) => {
        let t;
        if (e.button === 2) {
          t = e.target;
          if (t && t.tagName && t.tagName === 'IMG') {
            $.v.contextEl = t;
          }
        }
      },
      // get the position of a DOM element
      getPos: (o) => {
        const rect = o.el.getBoundingClientRect();
        return {
          top: rect.top + $.w.scrollY,
          left: rect.left + $.w.scrollX,
          bottom: rect.bottom + $.w.scrollY,
          right: rect.right + $.w.scrollX,
        };
      },
      // return an event's target element
      getEl: (e) => {
        var r = e.target;
        // text node; return parent
        if (r.targetNodeType === 3) {
          r = r.parentNode;
        }
        return r;
      },

      // get image data for save/search
      getImageData: (img) => {
        let i, r, dataPinId;
        r = {};
        dataPinId = $.f.get({ el: img, att: 'data-pin-id' });
        r.media = $.f.get({ el: img, att: 'data-pin-media' }) || img.currentSrc;
        r.description = $.f.get({ el: img, att: 'data-pin-description' }) || img.title || $.d.title;
        if (r.media === $.d.URL) {
          r.description = '';
        }
        if (dataPinId) {
          r.id = dataPinId;
        } else {
          r.url = $.f.get({ el: img, att: 'data-pin-url' }) || $.d.URL;
        }
        return r;
      },
      // open the pin create form
      pop: (o) => {
        let query, data, logMe, dualScreenLeft, dualScreenTop, height, width, left, top;

        dualScreenLeft = $.w.screenLeft != undefined ? $.w.screenLeft : screen.left;
        dualScreenTop = $.w.screenTop != undefined ? $.w.screenTop : screen.top;

        width = $.w.outerWidth
          ? $.w.outerWidth
          : $.w.defaultStatus.documentElement.clientWidth
          ? $.w.defaultStatus.documentElement.clientWidth
          : screen.width;
        height = $.w.outerHeight
          ? $.w.outerHeight
          : $.w.defaultStatus.documentElement.clientHeight
          ? $.w.defaultStatus.documentElement.clientHeight
          : screen.height;
        left = (width - $.a.pop.width) / 2 + dualScreenLeft;
        top = (height - $.a.pop.height) / 2 + dualScreenTop;

        if (!o.method) {
          // default to hoverbutton method
          o.method = 'h';
        }
        data = $.f.getImageData(o.img);
        data.method = o.method;
        // what to log
        logMe = { event: 'click', xm: data.method };
        if (data.id) {
          // repin
          query = $.v.rePinCreate.replace(/%s/, data.id);
          // log the pin ID
          logMe.repin = data.id;
        } else {
          query =
            $.v.pinCreate +
            '?url=' +
            encodeURIComponent(data.url) +
            '&media=' +
            encodeURIComponent(data.media) +
            '&xm=' +
            data.method +
            '&xv=' +
            $.v.xv +
            '&xuid=' +
            $.v.xuid +
            '&description=' +
            encodeURIComponent(data.description);
        }
        // open pop-up window
        $.w.open(
          query,
          'pin' + Date.now(),
          'status=no,resizable=yes,scrollbars=yes,personalbar=no,directories=no,location=no,toolbar=no,menubar=no,height=' +
            $.a.pop.height +
            ',width=' +
            $.a.pop.width +
            ',left=' +
            left +
            ',top=' +
            top,
        );
        // log it
        $.f.log(logMe);
      },
      // context click will pin this image
      checkImage: (o) => {
        let r, f, i;
        // an array of functions to be run in order
        f = [
          // be sure we have an image
          () => {
            if (!o.img) {
              return true;
            }
          },
          // be sure our image has a source
          () => {
            if (!o.img.currentSrc) {
              return true;
            }
          },
          // be sure our source comes from a server so we can verify
          () => {
            if (!o.img.currentSrc.match(/^http/) && !o.img.currentSrc.match(/^data/)) {
              return true;
            }
          },
          // be sure height AND width are greater than 90px
          () => {
            if (o.img.naturalHeight < 90 || o.img.naturalWidth < 90) {
              return true;
            }
          },
          // if we're at least 90x90, check that height OR width > 119
          () => {
            if (o.img.naturalHeight > 119 || o.img.naturalWidth > 119) {
              return false;
            } else {
              return true;
            }
          },
          // some images are resized using img.height and img.width; don't hover over these if they are too small
          () => {
            if (o.img.height < 90 || o.img.width < 90) {
              return true;
            }
          },
          // if we're at least 90x90, check that height OR width > 119
          () => {
            if (o.img.height > 119 || o.img.width > 119) {
              return false;
            } else {
              return true;
            }
          },
          // don't offer to pin images that are more than 3x wider than they are tall
          () => {
            if (o.img.naturalHeight < o.img.naturalWidth / 3) {
              return true;
            }
          },
          // don't pin if our image has nopin or data-pin-nopin
          () => {
            if (o.img.getAttribute('nopin') || o.img.getAttribute('data-pin-nopin')) {
              return true;
            }
          },
        ];

        // assume the image is good
        r = false;

        // if r turns true at any point, quit checking
        for (i = 0; i < f.length; i = i + 1) {
          r = f[i](o);
          if (r) {
            break;
          }
        }

        return r;
      },
      // overlays should only show on top level window OR in iframes that are the same size as window.top
      canHazOverlay: () => {
        let r = false;
        // are we in the top frame?
        if ($.w.self === $.w.top) {
          // we're good
          r = true;
        } else {
          // can we run inside this iframe?
          $.f.debug('We are inside an iframe.');
          // this is in a try/catch block because looking at the parent window's size may trigger a cross-origin frame access warning
          try {
            if (
              $.w.top.innerHeight === $.w.self.innerHeight &&
              $.w.top.innerWidth === $.w.self.innerWidth
            ) {
              $.f.debug(
                'This iframe is the same size as the top window; allowing the extension to run.',
              );
              // are we on Naver or Daum?
              if (
                $.w.top.location.href.match(/^https?:\/\/blog\.naver\.com\//) ||
                $.w.top.location.href.match(/^https?:\/\/blog\.daum\.net\//)
              ) {
                r = true;
              }
            } else {
              $.f.debug(
                "This frame's dimensions: " + $.w.self.innerHeight + 'x' + $.w.self.innerWidth,
              );
              $.f.debug('Top window dimensions: ' + $.w.top.innerHeight + 'x' + $.w.top.innerWidth);
            }
          } catch (err) {
            // $.f.debug('This error message was caught so it doesn\'t clutter up console.log.');
            // $.f.debug(err);
          }
        }
        return r;
      },
      // warn that you can't pin
      warn: (o) => {
        // don't pop alerts from iframes
        if (!o.msg) {
          o.msg = $.b.i18n.getMessage('errorPin');
        }
        $.w.alert(o.msg);
      },
      // experiment: browser_extension_auto_scroll_lazy_load
      scrollToBottom: (duration) => {
        return new Promise((resolve, reject) => {
          let startTimestamp = performance.now();
          const endTimestamp = startTimestamp + duration;
          const distance = $.d.b.scrollHeight - $.w.scrollY;
          // Limit max step per milisecond, otherwise some images on the page might get skipped and not loaded
          const stepPerMs = Math.max($.a.scrollToBottom.MAX_PIXEL_PER_MS, distance / duration);
          // Target position can be less than 0 if the page is smaller than viewport's height
          const targetPositionY = Math.max(0, $.d.b.scrollHeight - $.w.innerHeight);
          const initTimestamp = performance.now(); // for logging purpose
          let prevTimestamp = performance.now();
          let prevPositionY = $.w.scrollY;

          function step(timestamp) {
            // mark the scroll that has reached target if it has reached 90% of the page
            const hasReachedTarget = prevPositionY >= 0.9 * targetPositionY;
            const hasRunLongEnough = timestamp >= endTimestamp;
            $.f.debug(prevPositionY, hasReachedTarget, hasRunLongEnough);
            let newPositionY;
            if (hasReachedTarget || hasRunLongEnough) {
              $.f.debug('scrollToBottom ends', {
                hasReachedTarget,
                documentLeftPx: targetPositionY - prevPositionY,
                hasRunLongEnough,
                durationLeftMs: endTimestamp - timestamp,
              });
              resolve();
            } else {
              newPositionY = prevPositionY + (timestamp - prevTimestamp) * stepPerMs;
              $.f.debug({
                scrolling: `${(timestamp - prevTimestamp) * stepPerMs}px`,
                duration: `${timestamp - initTimestamp}`,
                newPositionY: `${newPositionY}`,
              });
              $.w.scrollTo($.w.scrollX, newPositionY);
              $.w.requestAnimationFrame(step);
            }
            prevTimestamp = timestamp;
            prevPositionY = newPositionY;
          }

          $.w.requestAnimationFrame(step);
        });
      },
      // open an iframe overlay
      openOverlay: (o) => {
        let path,
          postMessageObj = {},
          witnessMe,
          writeStyles;

        // be sure there's an ID; don't open more than one copy of any overlay
        if (o.id && !$.s[o.id]) {
          // save scroll position
          $.v.pageX = $.w.pageXOffset;
          $.v.pageY = $.w.pageYOffset;
          path = '/html/' + o.id + '.html';

          // id will be grid, create, save or search
          $.s[o.id] = $.f.make({
            IFRAME: {
              src: $.b.extension.getURL(path),
            },
          });

          // watch our iframe for attribute changes
          witnessMe = () => {
            // set $.v.observer.grid for the grid, $.v.observer.create for create, etc.
            // IMPORTANT: observer callback function must not use arrow notation, because we need local "this" to disconnect
            $.v.observer[o.id] = new MutationObserver(function (o) {
              // keep an eye on our styles
              if (o[0].attributeName === 'style' || o[0].attributeName === 'class') {
                // we might want to log document.URL for future analysis
                $.f.debug('overlay styles have changed; rewriting');
                // disconnect the current observer so we don't trigger it again when we rewrite styles
                this.disconnect();
                // rewrite the proper styles back into the iframe
                writeStyles(o[0].target);
                // log this event (only once, in case the page keeps trying)
                if (!$.v.hazWitnessed) {
                  $.v.hazWitnessed = true;
                  $.f.log({
                    event: 'witness',
                    via: $.d.URL,
                  });
                }
              }
            });
            $.v.observer[o.id].observe($.s[o.id], { attributes: true });
          };

          // style our iframe and make sure nobody has tried to attach a className
          writeStyles = (el) => {
            // our iframes should never have class names
            el.removeAttribute('class');
            // brute force our styles because we want !important on each item
            el.setAttribute('style', $.a.overlay.style.join('!important;'));
            // connect a mutation observer to watch for changes in iframe styling
            witnessMe();
          };

          // write the original style set
          writeStyles($.s[o.id]);

          // after we load, request data
          $.s[o.id].onload = () => {
            // optional background thing to do after loading
            if (o.act) {
              $.f.sendMessage({ to: 'background', act: o.act });
            }
            // populate the overlay with whatever we're showing
            if (o.data) {
              o.data.meta = $.v.meta;
              $.f.sendMessage({
                to: 'background',
                act: 'populate' + o.id.charAt(0).toUpperCase() + o.id.slice(1),
                data: o.data,
              });
            }
            // might be able to combine this with o.act
            if (o.callback) {
              o.callback();
            }
            // always steal focus
            $.s[o.id].focus();
            $.f.log({
              event: 'open',
              overlay: o.id,
            });
          };
          // append to DOM
          $.d.b.appendChild($.s[o.id]);
        }
      },
      // close an iframe overlay
      closeOverlay: (o) => {
        if (o.id && $.s[o.id]) {
          $.f.debug('closing ' + o.id);
          // shut down iframe style observers
          if ($.v.observer[o.id]) {
            $.v.observer[o.id].disconnect();
            delete $.v.observer[o.id];
          }
          $.f.kill({ el: $.s[o.id] });
          delete $.s[o.id];
          $.f.log({
            event: 'close',
            overlay: o.id,
          });
          $.w.scrollTo($.v.pageX, $.v.pageY);
        }
      },
      openGridOverlayAndInjectPinmarklet: () => {
        $.f.openOverlay({
          id: 'grid',
          callback: () => {
            $.b.runtime.sendMessage({
              to: 'background',
              act: 'injectPinmarklet',
            });
          },
        });
      },
      // experiment: browser_extension_hover_board_picker
      imageEligibleForHoverBoardPicker: (img) => {
        return (
          $.v.hazLogin &&
          $.v.canHazHoverBoardPicker &&
          img &&
          img.naturalWidth >= $.a.hoverBoardPicker.MIN_IMAGE_WIDTH_PX &&
          img.width >= $.a.hoverBoardPicker.MIN_IMAGE_WIDTH_PX
        );
      },
      // functions that may be called by messages from the background process
      act: {
        // we're eligible to see the hover picker
        showHoverBoardPicker: (o) => {
          const expName = 'browser_extension_hover_board_picker';
          const expGroup = (o.experimentGroup[expName] || {}).group;
          if (expGroup && (expGroup.startsWith('enabled') || expGroup.startsWith('employees'))) {
            $.v.canHazHoverBoardPicker = true;
          }
        },
        // ask for fresh context menus
        refreshContext: () => {
          // start with the nosearch flag
          let hideSearch = $.v.nosearch;
          // should we hide search because we're not logged in?
          if (!$.v.hazLogin && $.v.ctrl.search.authRequired) {
            hideSearch = true;
          }
          // in case we switch between tabs we need to check this again
          if (!$.f.canHazOverlay()) {
            $.v.nopin = true;
            hideSearch = true;
          }
          $.f.sendMessage({
            to: 'background',
            act: 'refreshContextMenus',
            data: {
              nopin: $.v.nopin,
              nosearch: hideSearch,
            },
          });
        },
        // background process says we've right-clicked and chosen Save
        contextSave: () => {
          let data;
          if ($.v.contextEl) {
            if ($.v.nopin || $.f.checkImage({ img: $.v.contextEl })) {
              $.f.warn({});
            } else {
              $.f.pinMeOnly($.v.contextEl);
            }
          } else {
            $.f.debug('No context element');
          }
        },
        // experiment: browser_extension_hover_save_redesign
        addSaveButton: (o) => {
          if (!$.v.bodyHazButtonSave) {
            // experiment: browser_extension_hover_save_redesign
            const expName = 'browser_extension_hover_save_redesign';
            const expGroup = (o.experimentGroup[expName] || {}).group;
            let myStyle = 'control';
            switch (expGroup) {
              case 'enabled_lego_white':
                myStyle = 'legoWhite';
                break;
              case 'enabled_lego':
              case 'employees':
                myStyle = 'lego';
                break;
              case 'enabled_no_label_plus':
                myStyle = 'noLabelPlus';
                $.s.buttonSave.innerText = '';
                break;
              case 'enabled_no_label':
                myStyle = 'noLabel';
                $.s.buttonSave.innerText = '';
                break;
            }
            $.s.buttonSave.setAttribute('style', $.a.save.style[myStyle].join('!important;'));

            // update design for search button
            if (expGroup && (expGroup.startsWith('enabled') || expGroup.startsWith('employees'))) {
              $.s.buttonSearch.style.background =
                'rgba(0,0,0,.4) url(data:image/svg+xml;base64,PHN2ZyBpZD0ic291cmNlIiB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHZpZXdCb3g9IjAgMCAyMiAyMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTEiIGN5PSIxMSIgcj0iMTEiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuOCI+PC9jaXJjbGU+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTUuMDgzNCA0LjU4MzMzSDEzLjMzMzRWNS43NDk5OUgxNS4wODM0QzE1LjcyNjggNS43NDk5OSAxNi4yNSA2LjI3MzI0IDE2LjI1IDYuOTE2NjZWOC42NjY2NkgxNy40MTY3VjYuOTE2NjZDMTcuNDE2NyA1LjYyOTgzIDE2LjM3MDIgNC41ODMzMyAxNS4wODM0IDQuNTgzMzNaTTE2LjI1IDE1LjA4MzNDMTYuMjUgMTUuNzI2NyAxNS43MjY4IDE2LjI1IDE1LjA4MzQgMTYuMjVIMTMuMzMzNFYxNy40MTY3SDE1LjA4MzRDMTYuMzcwMiAxNy40MTY3IDE3LjQxNjcgMTYuMzcwMiAxNy40MTY3IDE1LjA4MzNWMTMuMzMzM0gxNi4yNVYxNS4wODMzWk01Ljc1MDA0IDE1LjA4MzNWMTMuMzMzM0g0LjU4MzM3VjE1LjA4MzNDNC41ODMzNyAxNi4zNzAyIDUuNjI5ODcgMTcuNDE2NyA2LjkxNjcxIDE3LjQxNjdIOC42NjY3MVYxNi4yNUg2LjkxNjcxQzYuMjczMjkgMTYuMjUgNS43NTAwNCAxNS43MjY3IDUuNzUwMDQgMTUuMDgzM1pNNS43NTAwNCA2LjkxNjY2QzUuNzUwMDQgNi4yNzMyNCA2LjI3MzI5IDUuNzQ5OTkgNi45MTY3MSA1Ljc0OTk5SDguNjY2NzFWNC41ODMzM0g2LjkxNjcxQzUuNjI5ODcgNC41ODMzMyA0LjU4MzM3IDUuNjI5ODMgNC41ODMzNyA2LjkxNjY2VjguNjY2NjZINS43NTAwNFY2LjkxNjY2Wk05LjI1MDA0IDEwLjcwODNDOS4yNTAwNCA5LjkwNDQ5IDkuOTA0NTQgOS4yNDk5OSAxMC43MDg0IDkuMjQ5OTlDMTEuNTEyMiA5LjI0OTk5IDEyLjE2NjcgOS45MDQ0OSAxMi4xNjY3IDEwLjcwODNDMTIuMTY2NyAxMS41MTIyIDExLjUxMjIgMTIuMTY2NyAxMC43MDg0IDEyLjE2NjdDOS45MDQ1NCAxMi4xNjY3IDkuMjUwMDQgMTEuNTEyMiA5LjI1MDA0IDEwLjcwODNaTTEzLjYyNSAxNC41QzEzLjg0OSAxNC41IDE0LjA3MyAxNC40MTQ4IDE0LjI0NCAxNC4yNDM5QzE0LjU4NTIgMTMuOTAyMSAxNC41ODUyIDEzLjM0NzkgMTQuMjQ0IDEzLjAwNjFMMTMuMDcwMyAxMS44MzNDMTMuMjM0MiAxMS40OTA2IDEzLjMzMzQgMTEuMTEyNiAxMy4zMzM0IDEwLjcwODNDMTMuMzMzNCA5LjI2MTA4IDEyLjE1NTYgOC4wODMzMyAxMC43MDg0IDguMDgzMzNDOS4yNjExMiA4LjA4MzMzIDguMDgzMzcgOS4yNjEwOCA4LjA4MzM3IDEwLjcwODNDOC4wODMzNyAxMi4xNTU2IDkuMjYxMTIgMTMuMzMzMyAxMC43MDg0IDEzLjMzMzNDMTEuMTEyNiAxMy4zMzMzIDExLjQ5MDYgMTMuMjM0MiAxMS44MzMgMTMuMDcwMkwxMy4wMDYxIDE0LjI0MzlDMTMuMTc3IDE0LjQxNDggMTMuNDAxIDE0LjUgMTMuNjI1IDE0LjVaIiBmaWxsPSJ3aGl0ZSI+PC9wYXRoPgo8L3N2Zz4=) 50% 50% no-repeat';
              $.s.buttonSearch.style.backgroundSize = '24px 24px';
            }
            $.d.b.appendChild($.s.buttonSave);
            $.v.bodyHazButtonSave = true;
          }

          if ($.v.hoverImage) {
            let p = $.f.getPos({ el: $.v.hoverImage });
            $.s.buttonSave.style.top = p.top + $.a.save.offset.top + 'px';
            $.s.buttonSave.style.left = p.left + $.a.save.offset.left + 'px';
            $.s.buttonSave.style.display = 'block';
            $.v.hazButton = true;
            // clear timeout if any
            $.w.clearTimeout($.v.hazFade);
          }
        },
        // background has sent us the word on whether we should block features for this domain
        renderFeatureBlock: (o) => {
          if (o.data) {
            $.f.debug('Shall we block features by domain hash?');
            $.f.debug(o.data);
            if (o.data.nopin === true) {
              $.v.nopin = true;
            }
            if (o.data.nohover === true) {
              $.v.nohover = true;
            }
            if (o.data.nosearch === true) {
              $.v.nosearch = true;
            }
          }
          // always re-flag the browser button and context menus
          $.f.act.refreshContext();
        },
        // open the new inline board picker
        openSave: (o) => {
          if (o.data) {
            $.f.openOverlay({ id: 'save', data: o.data });
          }
        },
        // close the new inline board picker
        closeSave: (o) => {
          $.f.debug('Request to close save overlay received.');
          $.f.closeOverlay({ id: 'save' });
        },
        // open the search form
        openSearch: (o) => {
          if (o.data) {
            $.f.openOverlay({ id: 'search', data: o.data });
          }
        },
        // close the search form
        closeSearch: () => {
          $.f.closeOverlay({ id: 'search' });
        },
        // open the pin create form
        openCreate: (o) => {
          if (o.data) {
            $.f.openOverlay({ id: 'create', act: 'getBoards', data: o.data });
          }
        },
        // close the pin create form
        closeCreate: () => {
          $.f.closeOverlay({ id: 'create' });
        },
        // experiment: browser_extension_auto_scroll_lazy_load
        scrollWindowAndOpenGrid: (o) => {
          const getCurrentOverflowY = () => {
            if (($.d.b.style || {}).overflowY) {
              $.f.debug('overflowY', $.d.b.style.overflowY);
              return $.d.b.style.overflowY;
            }
          };
          const expName = 'browser_extension_auto_scroll_lazy_load';
          const expGroup = (o.experimentGroup[expName] || {}).group;
          if (expGroup && (expGroup.startsWith('enabled') || expGroup.startsWith('employees'))) {
            const initialXOffset = $.w.pageXOffset;
            const initialYOffset = $.w.pageYOffset;
            $.f.openOverlay({
              id: 'grid',
              callback: () => {
                // store the current overflowY
                const overflowYStyling = getCurrentOverflowY() || '';
                // hide the scrollbar while scrolling
                $.d.b.style.overflowY = 'hidden';
                $.f.scrollToBottom($.a.scrollToBottom.DURATION).finally(() => {
                  // return the scrollbar to the previous position
                  $.w.scrollTo(initialXOffset, initialYOffset);

                  // display back the scrollbar based on the previous overflowY
                  $.d.b.style.overflowY = overflowYStyling;
                  $.b.runtime.sendMessage({
                    to: 'background',
                    act: 'injectPinmarklet',
                  });
                });
              },
            });
          } else {
            $.f.openGridOverlayAndInjectPinmarklet();
          }
        },

        // open the thumbnail grid
        openGrid: (o) => {
          // Display an alert telling the user that there the user can't pin
          warnCannotPin = () => {
            $.f.log({
              event: 'click',
              action: 'open_grid',
              error: 'nopin_domain',
            });
            $.f.warn({
              msg: $.v.customNoPinDomain || $.v.msg.noPinDomain,
            });
            $.f.sendMessage({
              to: 'background',
              act: 'contextLog',
              data: {
                eventType: 'SAVE_BROWSER_PIN_IMAGES_NOT_FOUND',
                auxData: {
                  url: $.d.URL,
                  funnel_uuid: $.f.makeUUID(),
                },
              },
            });
          };

          if ($.v.nopin) {
            warnCannotPin();
          } else {
            // experiment: browser_extension_auto_scroll_lazy_load
            let shouldScroll = true;
            // do not scroll if this call comes from pinMeOnly
            if ($.a.scrollToBottom.SHOULD_SCROLL_FLAG in o) {
              shouldScroll = o[$.a.scrollToBottom.SHOULD_SCROLL_FLAG];
            }
            // do not scroll if the window position is more than 70% of document.height
            if ($.w.scrollY >= 0.7 * $.d.b.scrollHeight - $.w.innerHeight) {
              shouldScroll = false;
            }
            if (shouldScroll) {
              $.f.sendMessage({
                act: 'activate',
                experimentName: 'browser_extension_auto_scroll_lazy_load',
                callback: 'scrollWindowAndOpenGrid',
              });
            } else {
              $.f.openGridOverlayAndInjectPinmarklet();
            }
          }
        },
        // close the thumbnail grid
        closeGrid: () => {
          $.f.closeOverlay({ id: 'grid' });
        },
        // digest the results of login (and pfob) cookie check
        pongLogin: (o) => {
          $.f.debug('Login check has returned!');
          $.v.hazLogin = o.data.auth;
          // If we're signed in, see if we're allowed to log PFOB (Personalization from Offsite Browsing)
          // and / or show the hoverboard picker
          if ($.v.hazLogin === true) {
            // experiment: browser_extension_hover_board_picker
            // for better performance we will want to activate this on page load, not image hover
            $.f.sendMessage({
              act: 'activate',
              experimentName: 'browser_extension_hover_board_picker',
              callback: 'showHoverBoardPicker',
            });
            $.f.debug(
              'PFOB: Logged in to Pinterest.  Checking to see if we have PFOB turned off on the back end.',
            );
            if ($.v.ctrl.canHaz.pfob) {
              $.f.debug(
                'PFOB: is allowed per global flag.  Checking for specific user permissions.',
              );
              if (!$.w.navigator.doNotTrack && !$.w.doNotTrack) {
                $.f.debug('PFOB: Do Not Track flag not found.');
                if (!$.v.nopeList) {
                  $.f.debug('PFOB: Not on a domain mentioned in the Nope List');
                  if (o.data.pfob) {
                    $.f.debug('PFOB: is allowed by user settings.');
                    if ($.d.referrer) {
                      $.f.debug('PFOB: found document.referrer; logging for PFOB.');
                      // don't double-log pfob
                      if (!$.v.hazLoggedPfob) {
                        $.v.hazLoggedPfob = true;
                        $.f.log({
                          anon: true,
                          event: 'pfob',
                          via: $.d.URL.split('/')[2],
                          ref: $.d.referrer.split('/')[2],
                        });
                      }
                    } else {
                      $.f.debug('PFOB: did NOT find document.referrer; not logging.');
                    }
                  } else {
                    $.f.debug('PFOB: is either disallowed or not set; not logging.');
                  }
                } else {
                  $.f.debug('PFOB: domain appears on the Nope List.');
                }
              } else {
                $.f.debug('PFOB: Do Not Track is enabled; not logging.');
              }
            } else {
              $.f.debug('PFOB is NOT allowed, because canHaz.pfob = ' + $.v.ctrl.canHaz.pfob);
            }
          } else {
            $.f.debug('NOT logged in to Pinterest, so not checking on PFOB status.');
          }
        },
      },
      // hide hoverbuttons
      hide: () => {
        // this timeout is global, so we can cancel it when we're over the image and we move over the button
        $.w.clearTimeout($.v.hazFade);
        $.v.hazFade = $.w.setTimeout(() => {
          $.s.buttonSave.style.display = 'none';
          $.s.buttonSearch.style.display = 'none';
          $.v.hazButton = false;
        }, 100);
      },
      // wheel event
      wheel: (e) => {
        // set a global so we can tell if we're in mid-scroll
        $.v.lastWheel = Date.now();
      },
      // scroll event
      scroll: (e) => {
        // set the SAME global as set by the wheel event
        // to keep mac, windows, firefox, chrome, and safari all happy
        $.v.lastWheel = Date.now();
      },
      // mouse over
      over: (e) => {
        var p,
          m,
          el = $.f.getEl(e);
        if (el && el.tagName) {
          // should we show inline save?
          // experiment: browser_extension_hover_board_picker
          if (el === $.s.buttonSave && $.f.imageEligibleForHoverBoardPicker($.v.hoverImage)) {
            // $.v.lastWheel updates whenever we wheel or scroll, so let's be sure we've been holding
            // still for at least a hundredth of a second before showing hoverboard picker
            if ($.v.lastWheel < Date.now() - 10) {
              // we can potentially not display the hover board picker
              // canceling the hide timeout to be safe
              $.w.clearTimeout($.v.hazFade);
              // get URL, media, description, and pin ID from the image under the button
              const data = $.f.getImageData($.v.hoverImage);
              // add position
              data.top = Math.floor($.s.buttonSave.style.top.split('px')[0] - $.w.scrollY);
              data.left = Math.floor($.s.buttonSave.style.left.split('px')[0] - $.w.scrollX);
              // bounce the openSave request through the background process to allow us to send boards back
              // with the initial request, if we have a fresh copy on hand
              $.f.sendMessage({
                to: 'background',
                act: 'getBoardsForSave',
                data,
              });
            }
          } else {
            if (el === $.s.buttonSave || el === $.s.buttonSearch) {
              // we won't allow our overlays to render unless we have a click AND our mouse is over the button
              // we've just moved from inside an image to the visible button
              // stop hiding the button and exit
              $.w.clearTimeout($.v.hazFade);
            } else {
              if (el.tagName === 'IMG') {
                // should we just show the Search button?
                if (!$.v.hazLogin && !el.currentSrc.match(/^((http|https):\/\/)/)) {
                  $.s.buttonSave.style.display = 'none';
                } else {
                  if (!$.v.nopin) {
                    if (!$.f.checkImage({ img: el })) {
                      p = $.f.getPos({ el: el });
                      if (!$.v.nohover) {
                        // append to body on first hover over eligible image
                        if (!$.v.bodyHazButtonSave) {
                          // experiment: browser_extension_hover_save_redesign
                          $.f.sendMessage({
                            act: 'activate',
                            experimentName: 'browser_extension_hover_save_redesign',
                            callback: 'addSaveButton',
                          });
                          // first time we hover, prepare to show board list
                          $.f.sendMessage({
                            to: 'background',
                            act: 'requestBoards',
                          });
                        } else {
                          $.s.buttonSave.style.top = p.top + $.a.save.offset.top + 'px';
                          $.s.buttonSave.style.left = p.left + $.a.save.offset.left + 'px';
                          $.s.buttonSave.style.display = 'block';
                          $.v.hazButton = true;
                          // clear timeout if any because we just moved onto a new image
                          $.w.clearTimeout($.v.hazFade);
                        }
                        $.v.hoverImage = el;
                      }
                      // complex dance around showing Search button
                      if (!$.v.nosearch && !$.v.nohover) {
                        if ($.v.hazLogin || !$.v.ctrl.search.authRequired) {
                          // append to body on first hover over eligible image
                          if (!$.v.bodyHazButtonSearch) {
                            $.d.b.appendChild($.s.buttonSearch);
                            $.v.bodyHazButtonSearch = true;
                          }
                          $.s.buttonSearch.style.display = 'block';
                          $.s.buttonSearch.style.top = p.top + $.a.save.offset.top + 'px';
                          $.s.buttonSearch.style.left = p.right - $.a.save.offset.right + 'px';
                          $.v.hazButton = true;
                          // clear timeout if any because we just moved onto a new image
                          $.w.clearTimeout($.v.hazFade);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      // mouse out
      out: (e) => {
        var el = $.f.getEl(e);
        // if we have hoverbuttons
        if ($.v.hazButton) {
          // hide if we did not just exit one of them
          if (el !== $.s.buttonSave && el !== $.s.buttonSearch) {
            $.f.hide();
          }
        }
      },
      pinMeOnly: (el) => {
        // save for later
        if (el.src && el.src.match(/^data:/)) {
          // do not scrape data: URIs
          $.f.act.openCreate({ data: $.f.getImageData(el) });
        } else {
          // tell pinmarklet to rank this image infinitely high so it's the only one in the grid
          el.setAttribute('data-pin-me-only', 'true');
          // open the grid
          $.f.act.openGrid({ [$.a.scrollToBottom.SHOULD_SCROLL_FLAG]: false });
          // wait one second and remove the attribute we just added
          $.w.setTimeout(() => {
            el.removeAttribute('data-pin-me-only');
          }, 1000);
        }
      },
      // click
      click: (e) => {
        let el, data;
        el = $.f.getEl(e);
        if (el === $.s.buttonSave) {
          if ($.v.hoverImage) {
            $.f.pinMeOnly($.v.hoverImage);
          }
        }
        if (el === $.s.buttonSearch) {
          if ($.v.hoverImage) {
            data = $.f.getImageData($.v.hoverImage);
            $.f.act.openSearch({ data: { method: 'h', searchMe: data.media } });
          }
        }
      },
      // check page for reasons we might not want to pin or show hoverbuttons
      check: () => {
        let i, f;
        f = [
          // init $.v.nopin and $.v.nohover
          () => {
            let i;
            for (i in $.a.seek) {
              $.v[$.a.seek[i]] = false;
            }
            // do we have hoverbuttons hidden in preferences?
            if ($.v.hideHoverButtons) {
              $.v.nohover = true;
            }
          },
          // no pinning from Pinterest
          () => {
            let pinterestMatch = /^https?:\/\/(([a-z]{1,3}|latest)\.)?pinterest\.([a-z]{0,2}\.)?([a-z]{1,3})\//;

            /*
            ^ = only look at the beginning of the string
            https? = http or https
            \/\/ = escaped //
            (([a-z]{1,3})\.)? = one to three characters of lowercase letters followed by a dot, OR nothing
            pinterest\. = pinterest followed by an escaped dot
            ([a-z]{0,2}\.)? = zero to two lowercase letters followed by a dot, OR nothing (the co. in co.uk)
            ([a-z]{2,3}) = two or three lower-case characters (br, de, com)
            \/ = trailing forward-slash after top-level domain (so we don't get caught by pinterest.completelybogus.org)
            */

            // important: test document.URL, not document.domain, which won't have the http/https protocol
            if ($.d.URL.match(pinterestMatch)) {
              $.f.debug('Nopin: Pinterest app');
              $.v.nopin = true;
            }
          },
          // check our onboard nopin / nohover lists
          () => {
            let i, n;
            for (i = 0, n = $.a.nopeList.length; i < n; i = i + 1) {
              if ($.d.URL.match($.a.nopeList[i])) {
                $.f.debug('nopeList: ' + $.d.URL + ' matches ' + $.a.nopeList[i]);
                $.v.nopeList = true;
                $.v.nopin = true;
                break;
              }
            }
            for (i = 0, n = $.a.noHoverList.length; i < n; i = i + 1) {
              // we're using $.d.URL because it includes the protocol
              if ($.d.URL.match($.a.noHoverList[i])) {
                $.f.debug('Nohover: ' + $.d.domain + ' matches ' + $.a.noHoverList[i]);
                $.v.nohover = true;
              }
            }
          },
          // gather metadata and set special flags for nopin, hover, and nosearch
          () => {
            let patch,
              mod = {},
              arr = [],
              obj = {},
              meta = $.d.getElementsByTagName('META'),
              key,
              value,
              i,
              j,
              k,
              p,
              q,
              z,
              lkey,
              lvalue;
            // scrape our META tags, looking for keys and values
            for (i = 0; i < meta.length; i = i + 1) {
              value = meta[i].getAttribute('content');
              if (value) {
                // get the property or name
                key = meta[i].getAttribute('property') || meta[i].getAttribute('name');
                if (key) {
                  // push into an array so we can sort it later
                  arr.push({ k: key, v: value });
                  // if a key is one of the ones we're looking for (nopin, nohover, nosearch) set it
                  lkey = key.toLowerCase();
                  lvalue = value.toLowerCase();
                  if (lkey === 'pinterest') {
                    // does the value correspond to nopin, nohover, or nosearch?
                    if ($.a.seek[lvalue]) {
                      // $.v.nopin, $.v.nohover, or $.v.nosearch = true
                      $.v[lvalue] = true;
                    }
                    // shall we add the custom error description?
                    if (lvalue === 'nopin') {
                      if (meta[i].getAttribute('description')) {
                        $.v.customNoPinDomain = meta[i].getAttribute('description');
                      }
                    }
                  }
                }
              }
            }
            // sort our array so we don't wind up overwriting things as we split on colons
            arr.sort(function (a, b) {
              var r = 0;
              if (a.k > b.k) {
                r = 1;
              } else {
                if (a.k < b.k) {
                  r = -1;
                }
              }
              return r;
            });
            // our array now contains objects with keys and values, sorted by key
            for (i = 0; i < arr.length; i = i + 1) {
              // split each key on the colon
              k = arr[i].k.split(':');
              // start at the root of the object we're working on
              z = obj;
              for (j = 0; j < k.length; j = j + 1) {
                if (typeof z[k[j]] === 'undefined') {
                  // make a new sub-object
                  z[k[j]] = {};
                }
                // go again
                z = z[k[j]];
              }
              // see if we've seen this one before
              q = typeof z['~'];
              if (q === 'undefined') {
                // key does not exist, so add it
                z['~'] = arr[i].v;
              } else {
                // turn existing duplicate strings into arrays
                if (q === 'string') {
                  // convert the existing string into the first element of an array
                  z['~'] = [z['~']];
                }
                // push the next value onto the array
                z['~'].push(arr[i].v);
              }
            }
            // recursively fix up the naive object so strings show as strings
            // but objects that have both strings and sub-objects aren't lost
            patch = function (o, parentObj, parentKey) {
              for (var k in o) {
                if (typeof o[k] === 'object') {
                  // is this member zero of an array?
                  if (typeof o[k][0] === 'string') {
                    parentObj[parentKey] = o[k];
                  } else {
                    patch(o[k], o, k);
                  }
                } else {
                  // if we have only one key, it's the ~, so we can set object[key] equal to its string value
                  if (Object.keys(o).length === 1) {
                    parentObj[parentKey] = o[k];
                  }

                  // YOLO ALERT: this will deliver misleading results for situations like this:
                  //
                  //   <meta name="foo" content="woo">
                  //   <meta name="foo" content="yay">
                  //   <meta name="foo:bar" content="baz">
                  //
                  // ... where we will get:
                  //
                  //     foo:["woo","yay"]
                  //
                  // ... instead of:
                  //
                  //     foo:{"~":["woo", "yay"],"bar":"baz"}
                  //
                  // As of right now this is good enough for what we need
                }
              }
              return o;
            };
            // Now that we have $.v.meta, send it with all new pins
            $.v.meta = patch(obj, null, null);
          },
          // don't overwrite hoverbuttons made by pinit.js, which may be customized
          () => {
            if ($.d.b && $.d.b.getAttribute('data-pin-hover')) {
              $.f.debug('data-pin-hover found!');
              $.v.nohover = true;
            }
          },
          // check for feature block (sets $.v.hover, $.v.search, and $.v.pin)
          () => {
            $.f.sendMessage({
              act: 'checkFeatureBlock',
              domain: $.d.domain,
            });
          },
        ];
        for (let i = 0; i < f.length; i = i + 1) {
          f[i]();
        }
      },
      init: () => {
        // check for logins
        $.f.sendMessage({ to: 'background', act: 'login' });
        if (!$.f.canHazOverlay()) {
          $.v.nopin = true;
          $.v.nosearch = true;
          // tell the background process to hide context menus
          $.f.act.refreshContext();
        } else {
          // shall we hide search from users who are not signed in to Pinterest?
          if ($.v.ctrl.search.authRequired) {
            // give me a number from 0 to 99, based on $.a.version + $.v.xuid
            $.f.getSegment();
            if ($.v.segment < $.v.ctrl.search.unauthPercent) {
              $.v.ctrl.search.authRequired = false;
            }
          }
          $.d.b = $.d.getElementsByTagName('BODY')[0];
          // identity changes with each page load so we avoid weird conditions such as delayed messages from background
          $.v.me = $.f.random60();
          // pin and repin create pop-ups may have different domains
          $.v.pinCreate = $.a.endpoint.pinCreate;
          $.v.rePinCreate = $.a.endpoint.rePinCreate;
          $.d.addEventListener('mousedown', $.f.context);
          // check for nopin / nohover metas;
          if ($.d.domain) {
            // go look for reasons why we might not want to show hoverbuttons or allow pinning
            $.f.check();
          }
          // make Save button
          $.s.buttonSave = $.f.make({
            SPAN: {
              innerText: $.v.msg.saveAction,
            },
          });
          // make Search button
          $.s.buttonSearch = $.d.createElement('SPAN');
          $.s.buttonSearch.setAttribute('style', $.a.search.style.join('!important;'));
          // if we click, check if we need to pin
          $.d.b.addEventListener('click', $.f.click);
          // if we mouse over an element, check if we need to show hoverbuttons
          $.d.b.addEventListener('mouseover', $.f.over);
          // if we mouse out of an element, check if we need to hide hoverbuttons
          $.d.b.addEventListener('mouseout', $.f.out);
          // if the tab changes, hide hoverbuttons
          $.w.addEventListener('blur', $.f.hide);
          // if we're wheeling, take note
          $.d.addEventListener('wheel', $.f.wheel, { passive: false });
          // if we're scrolling, take note
          $.w.addEventListener('scroll', $.f.scroll, { passive: false });
        }
      },
    },
  });
  // if an incoming message from script is for us and triggers a function in $.f.act, run it
  $.b.runtime.onMessage.addListener((r) => {
    if (r.to === $.v.me || r.to === 'content') {
      $.f.debug('Message received.');
      $.f.debug(r);
      if (r.act && typeof $.f.act[r.act] === 'function') {
        $.f.act[r.act](r);
      }
    }
  });
  // get everything in local storage and then init
  $.b.storage.local.get(null, (r) => {
    for (let i in r) {
      $.v[i] = r[i];
    }
    // promote only the right subset of messages
    $.v.msg = $.v.msg.logic;
    $.f.init();
  });
})(window, document, {
  k: 'LOGIC',
  version: LOGIC_VERSION,
  // searchAuthRequired: SEARCH_AUTH_REQUIRED,
  // searchUnauthPercent: SEARCH_UNAUTH_PERCENT,
  digits: '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ_abcdefghijkmnopqrstuvwxyz',
  endpoint: {
    pinCreate: 'https://www.pinterest.com/pin/create/extension/',
    rePinCreate: 'https://www.pinterest.com/pin/%s/repin/x/',
  },
  // experiment: browser_extension_auto_scroll_lazy_load
  scrollToBottom: {
    DURATION: 2000,
    SHOULD_SCROLL_FLAG: 'SHOULD_SCROLL_FLAG',
    MAX_PIXEL_PER_MS: 1,
  },
  // experiment: browser_extension_hover_board_picker
  hoverBoardPicker: {
    MIN_IMAGE_WIDTH_PX: 250,
  },
  overlay: {
    style: [
      'border: none',
      'display: block',
      'position: fixed',
      'height: 100%',
      'width: 100%',
      'top: 0',
      'right: 0',
      'bottom: 0',
      'left: 0',
      'margin: 0',
      'clip: auto',
      'opacity: 1',
      'padding: 0',
      'z-index: 9223372036854775807',
    ],
  },
  search: {
    style: [
      'width: 24px',
      'height: 24px',
      'background: rgba(0,0,0,.4) url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pjxzdmcgd2lkdGg9IjI0cHgiIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAwIDI0IDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxkZWZzPjxtYXNrIGlkPSJtIj48cmVjdCBmaWxsPSIjZmZmIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI2IiByeT0iNiIvPjxyZWN0IGZpbGw9IiMwMDAiIHg9IjUiIHk9IjUiIHdpZHRoPSIxNCIgaGVpZ2h0PSIxNCIgcng9IjEiIHJ5PSIxIi8+PHJlY3QgZmlsbD0iIzAwMCIgeD0iMTAiIHk9IjAiIHdpZHRoPSI0IiBoZWlnaHQ9IjI0Ii8+PHJlY3QgZmlsbD0iIzAwMCIgeD0iMCIgeT0iMTAiIHdpZHRoPSIyNCIgaGVpZ2h0PSI0Ii8+PC9tYXNrPjwvZGVmcz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiNmZmYiIG1hc2s9InVybCgjbSkiLz48L3N2Zz4=) 50% 50% no-repeat',
      'background-size: 14px 14px',
      'position: absolute',
      'opacity: 1',
      'z-index: 8675309',
      'display: none',
      'cursor: pointer',
      'border: none',
      'border-radius: 12px',
    ],
  },
  save: {
    domain: {
      www: true,
      uk: true,
      br: true,
      jp: true,
      fr: true,
      es: true,
      pl: true,
      de: true,
      ru: true,
      it: true,
      au: true,
      nl: true,
      tr: true,
      id: true,
      hu: true,
      pt: true,
      se: true,
      cz: true,
      gr: true,
      kr: true,
      ro: true,
      dk: true,
      sk: true,
      fi: true,
      in: true,
      no: true,
      za: true,
      nz: true,
    },
    lookup: {
      // alt location: cs
      cs: {
        d: 'cz',
      },
      // alt location: dk
      da: {
        d: 'dk',
      },
      // default de / de-de; alt de-at
      de: {
        alt: {
          // Austria
          at: 'de',
        },
      },
      // alt locale: gr; Greece also gets requests for el-cy
      el: {
        d: 'gr',
        alt: {
          // Cyprus
          cy: 'gr',
        },
      },
      // English has many alt domains
      en: {
        alt: {
          // Australia
          au: 'au',
          // Great Britain
          gb: 'uk',
          // Ireland
          ie: 'uk',
          // India
          in: 'in',
          // New Zealand
          nz: 'nz',
          // United Kingdom
          uk: 'uk',
          // South Africa
          za: 'za',
        },
      },
      // Spanish also has many alt domains
      es: {
        alt: {
          // Latin America
          '419': 'www',
          // Argentina
          ar: 'www',
          // Chile
          cl: 'www',
          // Columbia
          co: 'www',
          // Latin America
          la: 'www',
          // Mexico
          mx: 'www',
          // Peru
          pe: 'www',
          // USA
          us: 'www',
          // Uruguay
          uy: 'www',
          // Venezuela
          ve: 'www',
          // Latin America
          xl: 'www',
        },
      },
      // Finnish: fi and fi-fi work; all others go to lang-domain
      fi: true,
      // French: auto-default to France, but do the right things for Belgium and Canada
      fr: {
        alt: {
          be: 'fr',
          ca: 'www',
        },
      },
      // Hindu: redirect to India (so does en-in)
      hi: {
        d: 'in',
      },
      hu: true,
      id: true,
      it: true,
      ja: {
        d: 'jp',
      },
      ko: {
        d: 'kr',
      },
      // Malaysian: send to WWW
      ms: {
        d: 'www',
      },
      nl: {
        alt: {
          be: 'nl',
        },
      },
      nb: {
        d: 'no',
      },
      pl: true,
      pt: {
        alt: {
          // Brazil
          br: {
            d: 'br',
            s: 'pt-br',
          },
        },
      },
      ro: true,
      ru: true,
      sk: true,
      sv: {
        d: 'se',
      },
      tl: {
        d: 'www',
      },
      th: {
        d: 'www',
      },
      tr: {
        alt: {
          // Cyprus
          cy: 'tr',
        },
      },
      uk: true,
      vi: true,
    },
    style: {
      // experiment: browser_extension_hover_save_redesign
      control: [
        // base rules for all Save buttons
        'border-radius: 3px',
        'text-indent: 20px',
        'width: auto',
        'padding: 0 4px 0 0',
        'text-align: center',
        'font: 11px/20px "Helvetica Neue", Helvetica, sans-serif',
        'font-weight: bold',
        'color: #fff',
        'background: #e60023 url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMzBweCIgd2lkdGg9IjMwcHgiIHZpZXdCb3g9Ii0xIC0xIDMxIDMxIj48Zz48cGF0aCBkPSJNMjkuNDQ5LDE0LjY2MiBDMjkuNDQ5LDIyLjcyMiAyMi44NjgsMjkuMjU2IDE0Ljc1LDI5LjI1NiBDNi42MzIsMjkuMjU2IDAuMDUxLDIyLjcyMiAwLjA1MSwxNC42NjIgQzAuMDUxLDYuNjAxIDYuNjMyLDAuMDY3IDE0Ljc1LDAuMDY3IEMyMi44NjgsMC4wNjcgMjkuNDQ5LDYuNjAxIDI5LjQ0OSwxNC42NjIiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxIj48L3BhdGg+PHBhdGggZD0iTTE0LjczMywxLjY4NiBDNy41MTYsMS42ODYgMS42NjUsNy40OTUgMS42NjUsMTQuNjYyIEMxLjY2NSwyMC4xNTkgNS4xMDksMjQuODU0IDkuOTcsMjYuNzQ0IEM5Ljg1NiwyNS43MTggOS43NTMsMjQuMTQzIDEwLjAxNiwyMy4wMjIgQzEwLjI1MywyMi4wMSAxMS41NDgsMTYuNTcyIDExLjU0OCwxNi41NzIgQzExLjU0OCwxNi41NzIgMTEuMTU3LDE1Ljc5NSAxMS4xNTcsMTQuNjQ2IEMxMS4xNTcsMTIuODQyIDEyLjIxMSwxMS40OTUgMTMuNTIyLDExLjQ5NSBDMTQuNjM3LDExLjQ5NSAxNS4xNzUsMTIuMzI2IDE1LjE3NSwxMy4zMjMgQzE1LjE3NSwxNC40MzYgMTQuNDYyLDE2LjEgMTQuMDkzLDE3LjY0MyBDMTMuNzg1LDE4LjkzNSAxNC43NDUsMTkuOTg4IDE2LjAyOCwxOS45ODggQzE4LjM1MSwxOS45ODggMjAuMTM2LDE3LjU1NiAyMC4xMzYsMTQuMDQ2IEMyMC4xMzYsMTAuOTM5IDE3Ljg4OCw4Ljc2NyAxNC42NzgsOC43NjcgQzEwLjk1OSw4Ljc2NyA4Ljc3NywxMS41MzYgOC43NzcsMTQuMzk4IEM4Ljc3NywxNS41MTMgOS4yMSwxNi43MDkgOS43NDksMTcuMzU5IEM5Ljg1NiwxNy40ODggOS44NzIsMTcuNiA5Ljg0LDE3LjczMSBDOS43NDEsMTguMTQxIDkuNTIsMTkuMDIzIDkuNDc3LDE5LjIwMyBDOS40MiwxOS40NCA5LjI4OCwxOS40OTEgOS4wNCwxOS4zNzYgQzcuNDA4LDE4LjYyMiA2LjM4NywxNi4yNTIgNi4zODcsMTQuMzQ5IEM2LjM4NywxMC4yNTYgOS4zODMsNi40OTcgMTUuMDIyLDYuNDk3IEMxOS41NTUsNi40OTcgMjMuMDc4LDkuNzA1IDIzLjA3OCwxMy45OTEgQzIzLjA3OCwxOC40NjMgMjAuMjM5LDIyLjA2MiAxNi4yOTcsMjIuMDYyIEMxNC45NzMsMjIuMDYyIDEzLjcyOCwyMS4zNzkgMTMuMzAyLDIwLjU3MiBDMTMuMzAyLDIwLjU3MiAxMi42NDcsMjMuMDUgMTIuNDg4LDIzLjY1NyBDMTIuMTkzLDI0Ljc4NCAxMS4zOTYsMjYuMTk2IDEwLjg2MywyNy4wNTggQzEyLjA4NiwyNy40MzQgMTMuMzg2LDI3LjYzNyAxNC43MzMsMjcuNjM3IEMyMS45NSwyNy42MzcgMjcuODAxLDIxLjgyOCAyNy44MDEsMTQuNjYyIEMyNy44MDEsNy40OTUgMjEuOTUsMS42ODYgMTQuNzMzLDEuNjg2IiBmaWxsPSIjZTYwMDIzIj48L3BhdGg+PC9nPjwvc3ZnPg==) 3px 50% no-repeat',
        'background-size: 14px 14px',
        // extra rules for extensions only
        'position: absolute',
        'opacity: 1',
        'z-index: 8675309',
        'display: none',
        'cursor: pointer',
        'border: none',
        'font-weight: bold',
        '-webkit-font-smoothing: antialiased',
        '-moz-osx-font-smoothing: grayscale',
      ],
      lego: [
        'border-radius: 10px',
        'text-indent: 12px',
        'width: auto',
        'height: 20px',
        'line-height: 24px',
        'padding: 0 8px',
        'text-align: center',
        'vertical-align: middle',
        'font: 11px/20px "Helvetica Neue", Helvetica, sans-serif',
        'font-weight: bolder',
        'color: #fff',
        'background: #e60023 url(data:image/svg+xml;base64,PHN2ZyBpZD0ic291cmNlIiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxMiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNiIgY3k9IjYiIHI9IjYiIGZpbGw9IiNFNjAwMjMiPjwvY2lyY2xlPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTAgNkMwIDguNTYxNSAxLjYwNTUgMTAuNzQ4NSAzLjg2NSAxMS42MDlDMy44MSAxMS4xNDA1IDMuNzUxNSAxMC4zNjggMy44Nzc1IDkuODI2QzMuOTg2IDkuMzYgNC41NzggNi44NTcgNC41NzggNi44NTdDNC41NzggNi44NTcgNC4zOTk1IDYuNDk5NSA0LjM5OTUgNS45N0M0LjM5OTUgNS4xNCA0Ljg4MDUgNC41MiA1LjQ4IDQuNTJDNS45OSA0LjUyIDYuMjM2IDQuOTAyNSA2LjIzNiA1LjM2MUM2LjIzNiA1Ljg3MzUgNS45MDk1IDYuNjM5NSA1Ljc0MSA3LjM1QzUuNjAwNSA3Ljk0NDUgNi4wMzk1IDguNDI5NSA2LjYyNTUgOC40Mjk1QzcuNjg3IDguNDI5NSA4LjUwMzUgNy4zMSA4LjUwMzUgNS42OTRDOC41MDM1IDQuMjYzNSA3LjQ3NTUgMy4yNjQgNi4wMDggMy4yNjRDNC4zMDkgMy4yNjQgMy4zMTE1IDQuNTM4NSAzLjMxMTUgNS44NTZDMy4zMTE1IDYuMzY5NSAzLjUwOSA2LjkxOTUgMy43NTYgNy4yMTlDMy44MDQ1IDcuMjc4NSAzLjgxMiA3LjMzIDMuNzk3NSA3LjM5MDVDMy43NTIgNy41Nzk1IDMuNjUxIDcuOTg1IDMuNjMxNSA4LjA2OEMzLjYwNSA4LjE3NyAzLjU0NSA4LjIwMDUgMy40MzE1IDguMTQ3NUMyLjY4NTUgNy44MDA1IDIuMjE5NSA2LjcxIDIuMjE5NSA1LjgzNEMyLjIxOTUgMy45NDk1IDMuNTg4IDIuMjE5NSA2LjE2NTUgMi4yMTk1QzguMjM3NSAyLjIxOTUgOS44NDggMy42OTYgOS44NDggNS42NjlDOS44NDggNy43Mjc1IDguNTUwNSA5LjM4NDUgNi43NDg1IDkuMzg0NUM2LjE0MyA5LjM4NDUgNS41NzQ1IDkuMDY5NSA1LjM3OTUgOC42OThDNS4zNzk1IDguNjk4IDUuMDggOS44MzkgNS4wMDc1IDEwLjExOEM0Ljg2NjUgMTAuNjYgNC40NzU1IDExLjM0NiA0LjIzMyAxMS43MzU1QzQuNzkyIDExLjkwNzUgNS4zODUgMTIgNiAxMkM5LjMxMzUgMTIgMTIgOS4zMTM1IDEyIDZDMTIgMi42ODY1IDkuMzEzNSAwIDYgMEMyLjY4NjUgMCAwIDIuNjg2NSAwIDZaIiBmaWxsPSJ3aGl0ZSI+PC9wYXRoPgo8L3N2Zz4=) 4px 50% no-repeat',
        'background-size: 12px 12px',
        // extra rules for extensions only
        'position: absolute',
        'opacity: 1',
        'z-index: 8675309',
        'display: none',
        'cursor: pointer',
        'border: none',
        'font-weight: bold',
        '-webkit-font-smoothing: antialiased',
        '-moz-osx-font-smoothing: grayscale',
      ],
      legoWhite: [
        'border-radius: 10px',
        'text-indent: 12px',
        'width: auto',
        'height: 20px',
        'line-height: 24px',
        'padding: 0 8px',
        'text-align: center',
        'vertical-align: middle',
        'font: 11px/20px "Helvetica Neue", Helvetica, sans-serif',
        'font-weight: bolder',
        'color: #000',
        'background: #fff url(data:image/svg+xml;base64,PHN2ZyBpZD0ic291cmNlIiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxMiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNiIgY3k9IjYiIHI9IjYiIGZpbGw9IndoaXRlIj48L2NpcmNsZT4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0wIDZDMCA4LjU2MTUgMS42MDU1IDEwLjc0ODUgMy44NjUgMTEuNjA5QzMuODEgMTEuMTQwNSAzLjc1MTUgMTAuMzY4IDMuODc3NSA5LjgyNkMzLjk4NiA5LjM2IDQuNTc4IDYuODU3IDQuNTc4IDYuODU3QzQuNTc4IDYuODU3IDQuMzk5NSA2LjQ5OTUgNC4zOTk1IDUuOTdDNC4zOTk1IDUuMTQgNC44ODA1IDQuNTIgNS40OCA0LjUyQzUuOTkgNC41MiA2LjIzNiA0LjkwMjUgNi4yMzYgNS4zNjFDNi4yMzYgNS44NzM1IDUuOTA5NSA2LjYzOTUgNS43NDEgNy4zNUM1LjYwMDUgNy45NDQ1IDYuMDM5NSA4LjQyOTUgNi42MjU1IDguNDI5NUM3LjY4NyA4LjQyOTUgOC41MDM1IDcuMzEgOC41MDM1IDUuNjk0QzguNTAzNSA0LjI2MzUgNy40NzU1IDMuMjY0IDYuMDA4IDMuMjY0QzQuMzA5IDMuMjY0IDMuMzExNSA0LjUzODUgMy4zMTE1IDUuODU2QzMuMzExNSA2LjM2OTUgMy41MDkgNi45MTk1IDMuNzU2IDcuMjE5QzMuODA0NSA3LjI3ODUgMy44MTIgNy4zMyAzLjc5NzUgNy4zOTA1QzMuNzUyIDcuNTc5NSAzLjY1MSA3Ljk4NSAzLjYzMTUgOC4wNjhDMy42MDUgOC4xNzcgMy41NDUgOC4yMDA1IDMuNDMxNSA4LjE0NzVDMi42ODU1IDcuODAwNSAyLjIxOTUgNi43MSAyLjIxOTUgNS44MzRDMi4yMTk1IDMuOTQ5NSAzLjU4OCAyLjIxOTUgNi4xNjU1IDIuMjE5NUM4LjIzNzUgMi4yMTk1IDkuODQ4IDMuNjk2IDkuODQ4IDUuNjY5QzkuODQ4IDcuNzI3NSA4LjU1MDUgOS4zODQ1IDYuNzQ4NSA5LjM4NDVDNi4xNDMgOS4zODQ1IDUuNTc0NSA5LjA2OTUgNS4zNzk1IDguNjk4QzUuMzc5NSA4LjY5OCA1LjA4IDkuODM5IDUuMDA3NSAxMC4xMThDNC44NjY1IDEwLjY2IDQuNDc1NSAxMS4zNDYgNC4yMzMgMTEuNzM1NUM0Ljc5MiAxMS45MDc1IDUuMzg1IDEyIDYgMTJDOS4zMTM1IDEyIDEyIDkuMzEzNSAxMiA2QzEyIDIuNjg2NSA5LjMxMzUgMCA2IDBDMi42ODY1IDAgMCAyLjY4NjUgMCA2WiIgZmlsbD0iI0U2MDAyMyI+PC9wYXRoPgo8L3N2Zz4=) 4px 50% no-repeat',
        'background-size: 12px 12px',
        // extra rules for extensions only
        'position: absolute',
        'opacity: 1',
        'z-index: 8675309',
        'display: none',
        'cursor: pointer',
        'border: none',
        'font-weight: bold',
        '-webkit-font-smoothing: antialiased',
        '-moz-osx-font-smoothing: grayscale',
      ],
      noLabel: [
        'width: 22px',
        'height: 22px',
        'color: #fff',
        'background: url(data:image/svg+xml;base64,PHN2ZyBpZD0ic291cmNlIiB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHZpZXdCb3g9IjAgMCAyMiAyMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yMS4yMjQ0IDE1LjA2NTNDMjEuNzI0OCAxMy44MDc3IDIyIDEyLjQzNiAyMiAxMUMyMiA0LjkyNDg3IDE3LjA3NTEgMCAxMSAwQzQuOTI0ODcgMCAwIDQuOTI0ODcgMCAxMUMwIDE3LjA3NTEgNC45MjQ4NyAyMiAxMSAyMkMxMi40MzU5IDIyIDEzLjgwNzUgMjEuNzI0OSAxNS4wNjUgMjEuMjI0NUMxNS4wNTY4IDIxLjA5ODIgMTUuMDUyNiAyMC45NzA3IDE1LjA1MjYgMjAuODQyM0MxNS4wNTI2IDE3LjY0NDkgMTcuNjQ0NyAxNS4wNTI5IDIwLjg0MjEgMTUuMDUyOUMyMC45NzA1IDE1LjA1MjkgMjEuMDk4IDE1LjA1NzEgMjEuMjI0NCAxNS4wNjUzWiIgZmlsbD0id2hpdGUiPjwvcGF0aD4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0wIDExQzAgMTUuNjk2MSAyLjk0MzQyIDE5LjcwNTYgNy4wODU4MyAyMS4yODMyQzYuOTg1IDIwLjQyNDMgNi44Nzc3NSAxOS4wMDggNy4xMDg3NSAxOC4wMTQzQzcuMzA3NjcgMTcuMTYgOC4zOTMgMTIuNTcxMiA4LjM5MyAxMi41NzEyQzguMzkzIDEyLjU3MTIgOC4wNjU3NSAxMS45MTU4IDguMDY1NzUgMTAuOTQ1QzguMDY1NzUgOS40MjMzMyA4Ljk0NzU4IDguMjg2NjcgMTAuMDQ2NyA4LjI4NjY3QzEwLjk4MTcgOC4yODY2NyAxMS40MzI3IDguOTg3OTIgMTEuNDMyNyA5LjgyODVDMTEuNDMyNyAxMC43NjgxIDEwLjgzNDEgMTIuMTcyNCAxMC41MjUyIDEzLjQ3NUMxMC4yNjc2IDE0LjU2NDkgMTEuMDcyNCAxNS40NTQxIDEyLjE0NjggMTUuNDU0MUMxNC4wOTI4IDE1LjQ1NDEgMTUuNTg5NyAxMy40MDE3IDE1LjU4OTcgMTAuNDM5QzE1LjU4OTcgNy44MTY0MiAxMy43MDUxIDUuOTg0IDExLjAxNDcgNS45ODRDNy44OTk4MyA1Ljk4NCA2LjA3MTA4IDguMzIwNTggNi4wNzEwOCAxMC43MzZDNi4wNzEwOCAxMS42Nzc0IDYuNDMzMTcgMTIuNjg1NyA2Ljg4NiAxMy4yMzQ4QzYuOTc0OTIgMTMuMzQzOSA2Ljk4ODY3IDEzLjQzODMgNi45NjIwOCAxMy41NDkzQzYuODc4NjcgMTMuODk1OCA2LjY5MzUgMTQuNjM5MiA2LjY1Nzc1IDE0Ljc5MTNDNi42MDkxNyAxNC45OTEyIDYuNDk5MTcgMTUuMDM0MyA2LjI5MTA4IDE0LjkzNzFDNC45MjM0MiAxNC4zMDA5IDQuMDY5MDggMTIuMzAxNyA0LjA2OTA4IDEwLjY5NTdDNC4wNjkwOCA3LjI0MDc1IDYuNTc4IDQuMDY5MDggMTEuMzAzNCA0LjA2OTA4QzE1LjEwMjEgNC4wNjkwOCAxOC4wNTQ3IDYuNzc2IDE4LjA1NDcgMTAuMzkzMkMxOC4wNTQ3IDE0LjE2NzEgMTUuNjc1OSAxNy4yMDQ5IDEyLjM3MjIgMTcuMjA0OUMxMS4yNjIyIDE3LjIwNDkgMTAuMjE5OSAxNi42Mjc0IDkuODYyNDIgMTUuOTQ2M0M5Ljg2MjQyIDE1Ljk0NjMgOS4zMTMzMyAxOC4wMzgyIDkuMTgwNDIgMTguNTQ5N0M4LjkyMTkyIDE5LjU0MzMgOC4yMDUwOCAyMC44MDEgNy43NjA1IDIxLjUxNTFDOC43ODUzMyAyMS44MzA0IDkuODcyNSAyMiAxMSAyMkMxNy4wNzQ3IDIyIDIyIDE3LjA3NDcgMjIgMTFDMjIgNC45MjUyNSAxNy4wNzQ3IDAgMTEgMEM0LjkyNTI1IDAgMCA0LjkyNTI1IDAgMTFaIiBmaWxsPSIjRTYwMDIzIj48L3BhdGg+Cjwvc3ZnPg==) no-repeat',
        'background-size: 22px 22px',
        // extra rules for extensions only
        'position: absolute',
        'opacity: 1',
        'z-index: 8675309',
        'display: none',
        'cursor: pointer',
        'border: none',
        'font-weight: bold',
        '-webkit-font-smoothing: antialiased',
        '-moz-osx-font-smoothing: grayscale',
      ],
      noLabelPlus: [
        'text-indent: 20px',
        'width: 24px',
        'height: 22px',
        'color: #fff',
        'background: url(data:image/svg+xml;base64,PHN2ZyBpZD0ic291cmNlIiB3aWR0aD0iMjUiIGhlaWdodD0iMjMiIHZpZXdCb3g9IjAgMCAyNSAyMyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjBfZCkiPgo8Y2lyY2xlIGN4PSIxMS41IiBjeT0iMTAuNSIgcj0iOS41IiBmaWxsPSJ3aGl0ZSI+PC9jaXJjbGU+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMiAxMC41QzIgMTQuNTU1NyA0LjU0MjA0IDE4LjAxODUgOC4xMTk1OCAxOS4zODA5QzguMDMyNSAxOC42MzkxIDcuOTM5ODggMTcuNDE2IDguMTM5MzggMTYuNTU3OEM4LjMxMTE3IDE1LjgyIDkuMjQ4NSAxMS44NTY5IDkuMjQ4NSAxMS44NTY5QzkuMjQ4NSAxMS44NTY5IDguOTY1ODcgMTEuMjkwOSA4Ljk2NTg3IDEwLjQ1MjVDOC45NjU4NyA5LjEzODMzIDkuNzI3NDYgOC4xNTY2NyAxMC42NzY3IDguMTU2NjdDMTEuNDg0MiA4LjE1NjY3IDExLjg3MzcgOC43NjIyOSAxMS44NzM3IDkuNDg4MjVDMTEuODczNyAxMC4yOTk3IDExLjM1NjcgMTEuNTEyNSAxMS4wODk5IDEyLjYzNzVDMTAuODY3NSAxMy41Nzg4IDExLjU2MjUgMTQuMzQ2NyAxMi40OTA0IDE0LjM0NjdDMTQuMTcxMSAxNC4zNDY3IDE1LjQ2MzkgMTIuNTc0MiAxNS40NjM5IDEwLjAxNTVDMTUuNDYzOSA3Ljc1MDU0IDEzLjgzNjIgNi4xNjggMTEuNTEyNyA2LjE2OEM4LjgyMjU4IDYuMTY4IDcuMjQzMjEgOC4xODU5NiA3LjI0MzIxIDEwLjI3MkM3LjI0MzIxIDExLjA4NSA3LjU1NTkyIDExLjk1NTkgNy45NDcgMTIuNDMwMUM4LjAyMzc5IDEyLjUyNDMgOC4wMzU2NyAxMi42MDU4IDguMDEyNzEgMTIuNzAxNkM3Ljk0MDY3IDEzLjAwMDkgNy43ODA3NSAxMy42NDI5IDcuNzQ5ODcgMTMuNzc0M0M3LjcwNzkyIDEzLjk0NjkgNy42MTI5MiAxMy45ODQxIDcuNDMzMjEgMTMuOTAwMkM2LjI1MjA0IDEzLjM1MDggNS41MTQyMSAxMS42MjQyIDUuNTE0MjEgMTAuMjM3MkM1LjUxNDIxIDcuMjUzMzggNy42ODEgNC41MTQyMSAxMS43NjIgNC41MTQyMUMxNS4wNDI3IDQuNTE0MjEgMTcuNTkyNyA2Ljg1MiAxNy41OTI3IDkuOTc1OTJDMTcuNTkyNyAxMy4yMzUyIDE1LjUzODMgMTUuODU4OCAxMi42ODUxIDE1Ljg1ODhDMTEuNzI2NCAxNS44NTg4IDEwLjgyNjMgMTUuMzYgMTAuNTE3NSAxNC43NzE4QzEwLjUxNzUgMTQuNzcxOCAxMC4wNDMzIDE2LjU3ODQgOS45Mjg1NCAxNy4wMjAyQzkuNzA1MjkgMTcuODc4MyA5LjA4NjIxIDE4Ljk2NDUgOC43MDIyNSAxOS41ODEyQzkuNTg3MzMgMTkuODUzNSAxMC41MjYyIDIwIDExLjUgMjBDMTYuNzQ2NCAyMCAyMSAxNS43NDY0IDIxIDEwLjVDMjEgNS4yNTM2MyAxNi43NDY0IDEgMTEuNSAxQzYuMjUzNjMgMSAyIDUuMjUzNjMgMiAxMC41WiIgZmlsbD0iI0U2MDAyMyI+PC9wYXRoPgo8L2c+CjxnIGZpbHRlcj0idXJsKCNmaWx0ZXIxX2QpIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNyIgcj0iNCIgZmlsbD0iI0U2MDAyMyI+PC9jaXJjbGU+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjEuOTE2NyAxNy40MTY3SDIwLjQxNjdWMTguOTE2N0MyMC40MTY3IDE5LjE0NjcgMjAuMjMgMTkuMzMzMyAyMCAxOS4zMzMzQzE5Ljc3IDE5LjMzMzMgMTkuNTgzMyAxOS4xNDY3IDE5LjU4MzMgMTguOTE2N1YxNy40MTY3SDE4LjA4MzNDMTcuODUzMyAxNy40MTY3IDE3LjY2NjcgMTcuMjMgMTcuNjY2NyAxN0MxNy42NjY3IDE2Ljc3IDE3Ljg1MzMgMTYuNTgzMyAxOC4wODMzIDE2LjU4MzNIMTkuNTgzM1YxNS4wODMzQzE5LjU4MzMgMTQuODUzMyAxOS43NyAxNC42NjY3IDIwIDE0LjY2NjdDMjAuMjMgMTQuNjY2NyAyMC40MTY3IDE0Ljg1MzMgMjAuNDE2NyAxNS4wODMzVjE2LjU4MzNIMjEuOTE2N0MyMi4xNDY3IDE2LjU4MzMgMjIuMzMzMyAxNi43NyAyMi4zMzMzIDE3QzIyLjMzMzMgMTcuMjMgMjIuMTQ2NyAxNy40MTY3IDIxLjkxNjcgMTcuNDE2N1pNMjAgMTNDMTcuNzkxIDEzIDE2IDE0Ljc5MSAxNiAxN0MxNiAxOS4yMDkgMTcuNzkxIDIxIDIwIDIxQzIyLjIwOSAyMSAyNCAxOS4yMDkgMjQgMTdDMjQgMTQuNzkxIDIyLjIwOSAxMyAyMCAxM1oiIGZpbGw9IndoaXRlIj48L3BhdGg+CjwvZz4KPGRlZnM+CjxmaWx0ZXIgaWQ9ImZpbHRlcjBfZCIgeD0iMCIgeT0iMCIgd2lkdGg9IjIzIiBoZWlnaHQ9IjIzIiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+CjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ij48L2ZlRmxvb2Q+CjxmZUNvbG9yTWF0cml4IGluPSJTb3VyY2VBbHBoYSIgdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDEyNyAwIj48L2ZlQ29sb3JNYXRyaXg+CjxmZU9mZnNldCBkeT0iMSI+PC9mZU9mZnNldD4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMSI+PC9mZUdhdXNzaWFuQmx1cj4KPGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAuMTYgMCI+PC9mZUNvbG9yTWF0cml4Pgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9ImVmZmVjdDFfZHJvcFNoYWRvdyI+PC9mZUJsZW5kPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9ImVmZmVjdDFfZHJvcFNoYWRvdyIgcmVzdWx0PSJzaGFwZSI+PC9mZUJsZW5kPgo8L2ZpbHRlcj4KPGZpbHRlciBpZD0iZmlsdGVyMV9kIiB4PSIxNSIgeT0iMTMiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCI+PC9mZUZsb29kPgo8ZmVDb2xvck1hdHJpeCBpbj0iU291cmNlQWxwaGEiIHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAxMjcgMCI+PC9mZUNvbG9yTWF0cml4Pgo8ZmVPZmZzZXQgZHk9IjEiPjwvZmVPZmZzZXQ+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjAuNSI+PC9mZUdhdXNzaWFuQmx1cj4KPGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAuMSAwIj48L2ZlQ29sb3JNYXRyaXg+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIHJlc3VsdD0iZWZmZWN0MV9kcm9wU2hhZG93Ij48L2ZlQmxlbmQ+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iZWZmZWN0MV9kcm9wU2hhZG93IiByZXN1bHQ9InNoYXBlIj48L2ZlQmxlbmQ+CjwvZmlsdGVyPgo8L2RlZnM+Cjwvc3ZnPg==) no-repeat',
        // extra rules for extensions only
        'position: absolute',
        'opacity: 1',
        'z-index: 8675309',
        'display: none',
        'cursor: pointer',
        'border: none',
        'font-weight: bold',
        '-webkit-font-smoothing: antialiased',
        '-moz-osx-font-smoothing: grayscale',
      ],
    },
    offset: {
      top: 10,
      left: 10,
      right: 32,
    },
  },
  pop: {
    height: 650,
    width: 800,
  },
  // metas to observe
  seek: { nopin: 1, nohover: 1, nosearch: 1 },
  // don't do stuff on these domains
  nopeList: [
    /^https?:\/\/(.*?\.|)craigslist\.org\//,
    /^https?:\/\/(.*?\.|)chase\.com\//,
    /^https?:\/\/(.*?\.|)facebook\.com\//,
    /^https?:\/\/mail\.aol\.com\//,
    /^https?:\/\/(.*?\.|)atmail\.com\//,
    /^https?:\/\/(.*?\.|)contactoffice\.com\//,
    /^https?:\/\/(.*?\.|)fastmail\.fm\//,
    /^https?:\/\/(.*?\.|)webmail\.gandi\.net\//,
    /^https?:\/\/accounts\.google\.com\//,
    /^https?:\/\/myaccount\.google\.com\//,
    /^https?:\/\/mail\.google\.com\//,
    /^https?:\/\/docs\.google\.com\//,
    /^https?:\/\/gmx\.com\//,
    /^https?:\/\/(.*?\.|)hushmail\.com\//,
    /^https?:\/\/(.*?\.|)laposte\.fr\//,
    /^https?:\/\/mail\.lycos\.com\//,
    /^https?:\/\/(.*?\.|)mail\.com\//,
    /^https?:\/\/(.*?\.|)mail\.ru\//,
    /^https?:\/\/(.*?\.|)opolis\.eu\//,
    /^https?:\/\/(.*?\.|)outlook\.com\//,
    /^https?:\/\/(.*?\.|)nokiamail\.com\//,
    /^https?:\/\/apps\.rackspace\.com\//,
    /^https?:\/\/mail\.rediff\.com\//,
    /^https?:\/\/(.*?\.|)runbox\.com\//,
    /^https?:\/\/mail\.sify\.com\//,
    /^https?:\/\/webmail\.thexyz\.com\//,
    /^https?:\/\/login\.yahoo\.com\//,
    /^https?:\/\/mail\.yahoo\.com\//,
    /^https?:\/\/mail\.yandex\.com\//,
  ],
  // don't hover on domains matching these
  noHoverList: [
    /^https?:\/\/ramandel\.com\//,
    /^https?:\/\/www\.google\.com\/$/,
    /^https?:\/\/www\.google\.com\/_/,
  ],
});
