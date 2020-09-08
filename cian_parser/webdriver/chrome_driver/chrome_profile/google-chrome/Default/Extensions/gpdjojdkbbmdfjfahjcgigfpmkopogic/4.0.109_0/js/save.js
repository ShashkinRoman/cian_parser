/*
  CONG-183: fix persistent Save overlay
  CONG-183: improve save iframe performance (D606240)
  CONG-186: Hoverboard picker should not trigger while viewport is in motion
*/

((config) => {
  const $ = {
    // globals load from localStorage before we init
    global: {},

    // pass in all the stuff in the big object at the bottom of this file
    config: config,

    // although window.chrome may exist in some non-Chrome browsers, we want to
    // try window.browser first because it has better support for promises
    browser: window.browser || window.chrome,

    // space for our HTML structure, which we will build on the fly
    structure: {},

    // space for constants, which are different from config because they may change during operation
    constant: {
      delayAfterPinResults: 1000,
      delayAfterSave: 3000,
    },

    // space for our business logic
    func: {
      // console.log to background window when DEBUG = true in background.js
      debug: (message) => {
        if ($.global.debug && message) {
          console.log(message);
        }
      },

      // close me
      close: () => {
        $.func.send({
          act: 'closeSave',
        });
        return;
      },
      /*
        get a DOM property or data attribute:
        {
          el: [an element],
          att: [an attribute]
        }
      */
      get: (getMe) => {
        let found = null;
        if (typeof getMe.el[getMe.att] === 'string') {
          // natural DOM attributes like src, height, or width
          found = getMe.el[getMe.att];
        } else {
          // data attribute
          found = getMe.el.dataset[getMe.att];
        }
        return found;
      },

      /*
        set a DOM property or data attribute:
        {
          el: [an element],
          att: [an attribute],
          string: [a string]
        }
      */
      set: (setMe) => {
        if (typeof setMe.el[setMe.att] === 'string') {
          // natural DOM attribute
          setMe.el[setMe.att] = setMe.string;
        } else {
          // data attribute
          setMe.el.dataset[setMe.att] = setMe.string;
        }
      },

      /*
        add and/or remove a class or a list of classes from an element or list of elements:
        {
          el: an element or [collection of elements],
          add: a className or [list of classNames] to be added,
          remove: a className or [list of classNames] to be removd
        }
      */
      changeClass: (changeMe) => {
        let i, applyThis;
        if (changeMe.el) {
          if (!changeMe.el.length) {
            changeMe.el = [changeMe.el];
          }
          // changeMe will take a collection, which is not an array, so this loop is needed
          for (i = 0; i < changeMe.el.length; i = i + 1) {
            // do your adds and removes
            if (changeMe.el[i] && changeMe.el[i].classList) {
              if (changeMe.add) {
                if (typeof changeMe.add !== 'object') {
                  changeMe.add = [changeMe.add];
                }
                // add OURGLOBAL_ to supplied class names
                applyThis = changeMe.add.map((e) => {
                  return `${$.config.me}_${e}`;
                });
                changeMe.el[i].classList.add.apply(changeMe.el[i].classList, applyThis);
              }
              if (changeMe.remove) {
                if (typeof changeMe.remove !== 'object') {
                  changeMe.remove = [changeMe.remove];
                }
                applyThis = changeMe.remove.map((e) => {
                  return `${$.config.me}_${e}`;
                });
                changeMe.el[i].classList.remove.apply(changeMe.el[i].classList, applyThis);
              }
            }
            if (changeMe.el[i].classList && !changeMe.el[i].classList.length) {
              changeMe.el[i].removeAttribute('class');
            }
          }
        }
      },

      /*
        create a DOM element with attributes; apply styles if requested
        {
          [a tag name]: {
            [an attribute name]: [a string],
            style: {
              [a valid rule name]: [a string]
            }
          }
        }
      */
      make: (makeMe) => {
        const tagName = Object.keys(makeMe)[0],
          instructions = makeMe[tagName],
          el = document.createElement(tagName);
        // iterate through keys
        for (key in instructions) {
          const value = instructions[key];
          // shall we build a text attribute?
          if (typeof value === 'string') {
            // set will do the right thing for html and data attributes
            $.func.set({
              el: el,
              att: key,
              string: value,
            });
          }
          // shall we build an inline style object?
          if (typeof value === 'object' && key === 'style') {
            Object.assign(el.style, value);
          }
        }
        return el;
      },

      /*
        find an event's target element
        {
          target: [an HTML element]
        }
      */
      getEl: (getMe) => {
        let found = getMe.target;
        // if our target is a text node return its parent
        if (found.targetNodeType === 3) {
          found = found.parentNode;
        }
        return found;
      },

      /*
        send a message to the background process
        {
          act: [a function in the act object of the background process],
          data: [an object]
        }
      */
      send: (sendMe) => {
        sendMe.to = 'background';
        sendMe.from = $.config.me;
        $.func.debug('Sending message');
        $.func.debug(sendMe);
        $.browser.runtime.sendMessage(sendMe);
      },

      /*
        build a stylesheet from a SASS-like JSON object:
        {
          body: {
            background: "#fff",
            margin: "0",
            padding: "0"
          }
        }
      */
      buildStyleFrom: (inputObj) => {
        // rules will go here
        let css = '';

        // recurse through an object
        let buildRulesFrom = (input) => {
          // start with an empty ruleset
          let ruleset = '';
          // inventory keys in object we are crawling
          for (let key in input.obj) {
            // got an object? seek its children
            if (typeof input.obj[key] === 'object') {
              // append this key to existing selector for the next set of children
              let nextSelector = input.selector + ' ' + key;
              // apply selectors that start with ampersands to their parents
              nextSelector = nextSelector.replace(/ &/g, '');
              // replicate this selector to all elements separated by commas
              nextSelector = nextSelector.replace(/,/g, ', ' + input.selector);
              // recurse the children
              buildRulesFrom({
                obj: input.obj[key],
                selector: nextSelector,
              });
            } else {
              // this is a key-value pair so make a rule
              if (!ruleset) {
                // do we need to start a new ruleset?
                ruleset = ' {\n';
              }
              // add this rule
              ruleset = ruleset + '  ' + key + ': ' + input.obj[key] + ';\n';
            }
          }
          // we are done looking at this object.
          // If we started a ruleset, finish it and add it to our CSS.
          if (ruleset) {
            ruleset = ruleset + '}\n';
            css = css + input.selector + ruleset;
          }
        };

        // usually our main object in config but could be
        // something else from an experiment
        buildRulesFrom({ obj: inputObj, selector: '' });

        // start our styleshseet
        const style = document.createElement('style');

        // set the type
        style.setAttribute('type', 'text/css');

        // find the vendor prefix
        // moz = firefox, webkit = chrome, ms = ie / edge
        // note: we are NOT doing anything special for -o-, which is pre-webkit Opera
        const vendorPrefixPattern = /^(moz|webkit|ms)(?=[A-Z])/i;

        let vendorPrefix = '';
        // loop through all existing style rules on document.body
        for (let rule in document.body.style) {
          // did you find one?
          if (vendorPrefixPattern.test(rule)) {
            // return -ms- or -webkit- or -moz-
            vendorPrefix = '-' + rule.match(vendorPrefixPattern)[0].toLowerCase() + '-';
            // got it, we're done
            break;
          }
        }

        // each rule gets our global key at its root
        css = css.replace(/\._/g, '.' + $.config.me + '_');
        // apply vendor prefix anywhere we have specified it in our input object
        css = css.replace(/%prefix%/g, vendorPrefix);
        // add rules to style node
        style.appendChild(document.createTextNode(css));
        // add style node to page
        document.head.appendChild(style);
      },

      /*
      build HTML structure with from a JSON template and add it to a parent node
      {
        template: {
          hd: {
            hdMsg: {},
            x: {
              cmd: "close"
            }
          },
          grid: {}
        },
        addTo: document.body
      }
      */
      addFromTemplate: (inputObj) => {
        for (const key in inputObj.template) {
          const value = inputObj.template[key];
          if (value) {
            if (typeof value === 'string') {
              // do we need to add some class names?
              if (key === 'addClass') {
                const classNames = value.split(' ');
                // class names will be [$.config.me]_[theClassName]
                classNames.map((name) => {
                  inputObj.addTo.className = `${inputObj.addTo.className} ${$.config.me}_${name}`;
                });
              } else {
                // we needed a way to create non-SPAN tags
                if (key !== 'tag') {
                  $.func.set({
                    el: inputObj.addTo,
                    att: key,
                    string: value,
                  });
                }
              }
            } else {
              // create a new container template
              const container = {
                [value.tag || 'SPAN']: {
                  className: `${$.config.me}_${key}`,
                },
              };
              // build the container
              const child = $.func.make(container);
              // add it to the parent
              inputObj.addTo.appendChild(child);
              // add this to our global structure object if it does not already exist
              if (!$.structure[key]) {
                $.structure[key] = child;
              }
              // recurse until done
              $.func.addFromTemplate({ template: value, addTo: child });
            }
          }
        }
      },

      /*
      ask the background process to send a ping to log.pinterest.com
      {
        act: "log",
        data: {
          key: value
        }
      }
      Will send key=value to log.pinterest.com
      */
      log: (logMe) => {
        $.func.send({
          act: 'log',
          data: logMe,
        });
      },

      /*
      to close the overlay, the background process closes its iframe container
      {
        key: value to be logged
      }
      */
      close: (o = {}) => {
        // only close if we've rendered the picker, otherwise we will close instantly
        if ($.global.hazRendered) {
          if (o.createMe) {
            // send a single-element array because create has have multi-save
            $.func.send({ act: 'openCreate', data: [o.createMe] });
          }
          $.func.send({ act: 'closeSave', data: o });
        }
      },

      // fulfill external requests from the background process
      act: {
        // build our structure
        renderStructure: (r) => {
          // hold off rendering until we're sure our structure is in place
          const checkStructure = () => {
            if ($.structure.me) {
              // persist the image, url, id, and description for later
              $.global.saveMe = {
                ...r.data,
                url: r.data.url,
                media: r.data.media,
                // if there's a data-pin-id this is going to be a repin
                id: r.data.id || 0,
                // descriptions still need to silently pass through in case we change our minds about showing them
                description: r.data.description || '',
              };
              // structure should match button position
              $.structure.me.style.top = r.data.top + 'px';
              $.structure.me.style.left = r.data.left + 'px';
              $.structure.me.style.display = 'block';
              // set our flag so we don't accidentally close if structure takes a while to arrive
              $.global.hazRendered = true;
              // did boards come along with initial data?
              if (r.data.boards) {
                // render them; we don't need to wait
                $.func.act.renderBoards(r);
              }
              $.func.send({ act: 'convertToDataUrl', data: r.data });
            } else {
              window.setTimeout(checkStructure, 10);
            }
          };
          checkStructure();
        },
        updateImageData: (r) => {
          if (r.data.status === 'ok') {
            $.global.saveMe.data = r.data.dataURI;
            $.global.saveMe.height = r.data.height;
            $.global.saveMe.width = r.data.width;
          }
          $.global.saveMe.imageDataReceived = true;
        },
        // this is a separate callback for when background didn't have a fresh board list and had to make a call
        renderBoards: (r) => {
          const boards = r.data.boards || [];
          // did we get some boards?
          if (boards.length) {
            $.func.debug('Boards received by inline save overlay');
            $.func.debug(boards);
            // default board name will be board 0
            $.structure.boardPickerOpenerCurrent.innerText = boards[0].name;
            // this is the board we'll save to if we click the default Save button
            $.global.boardId = boards[0].id;
            $.global.boardName = boards[0].name;
          } else {
            // do something clever to handle no-boards-found problem
            $.func.debug('Empty board array received');
            $.func.debug(boards);
          }
        },
        newPinWin: (o) => {
          $.structure.afterSave.innerText = $.global.msg.visitButton;
          $.func.set({ el: $.structure.afterSave, att: 'pinId', string: o.data.id });

          $.func.changeClass({ el: $.structure.defaultSave, add: 'done', remove: 'working' });
          // wait a bit so we see our checked button
          window.setTimeout(() => {
            $.structure.boardPickerOpenerLabel.innerText = $.global.msg.boardPickerSuccessLabel;
            $.func.changeClass({ el: $.structure.boardPickerOpener, add: 'feedback' });
            // the user can now dismiss the save iframe
            $.global.stayOpen = false;
            // similar to create modal, close feedback after 5 seconds
            window.setTimeout(() => {
              $.func.close();
            }, $.constant.delayAfterSave);
          }, $.constant.delayAfterPinResults);
        },
        newPinFail: (o) => {
          $.func.set({
            el: $.structure.afterSave,
            att: 'cmd',
            string: 'getSaveHelp',
          });

          $.structure.afterSave.innerText = $.global.msg.help;
          $.structure.boardPickerOpenerLabel.innerText =
            (o.data || {}).message || $.global.msg.msgOops;
          $.structure.boardPickerOpenerCurrent.innerText =
            (o.data || {}).message_detail || $.global.msg.msgPinFail;
          $.func.changeClass({ el: $.structure.boardPickerOpener, add: ['feedback', 'fail'] });
          // the user can now dismiss the save iframe
          $.global.stayOpen = false;
          // similar to create modal, close feedback after 5 seconds
          window.setTimeout(() => {
            $.func.close();
          }, $.constant.delayAfterSave);
        },
      },

      // fulfill internal requests from DOM objects on user interaction
      // this is DIFFERENT from other implementations of cmd because
      // it takes an object with element and event, so we can avoid
      // running the wrong command, like showBoardList on mouse over
      cmd: {
        // if we've hovered back over the default board, we can close
        allowClose: (me) => {
          if (me.event === 'over') {
            $.global.stayOpen = false;
          }
        },
        // close our overlay, potentially because we moused out of the picker
        close: (me) => {
          // only the background iframe tries to close on mouse over or move
          if (me.event === 'over' || me.event === 'move') {
            if (!$.global.stayOpen) {
              $.func.close();
            }
          }
        },
        // change the board in the default picker; hide list
        changeBoard: (me) => {
          if (me.event === 'click') {
            $.global.stayOpen = true;
            const boardId = $.func.get({ el: me.element, att: 'boardId' });
            const boardName = $.func.get({ el: me.element, att: 'boardName' });
            $.global.boardId = boardId;
            $.structure.boardPickerOpenerCurrent.innerText = boardName;
            $.structure.boardPickerOpener.style.display = 'block';
          }
        },
        // show board picker when we click the default name
        showBoardPicker: (me) => {
          // we don't want to do this on mouseover
          if (me.event === 'click') {
            // don't do any of this if pinning is already in progress from a click to defaultSave
            if (!$.global.hazPinningNow) {
              // when our close function receives a saveMe object it will open the create overlay
              $.func.close({
                createMe: $.global.saveMe,
              });
            }
          }
        },
        // save to board when we click Save
        save: (me) => {
          // we don't want to do this on mouseover
          if (me.event === 'click') {
            // don't allow repeated clicks to start repeated saves
            if (!$.global.hazPinningNow) {
              // set our flag so other clicks don't break anything
              $.global.hazPinningNow = true;
              // don't close the board picker while saving
              $.global.stayOpen = true;
              // wait for image data from background
              const checkImageData = () => {
                if ($.global.saveMe.imageDataReceived) {
                  // what we're saving and where we're saving it
                  $.func.send({
                    act: 'save',
                    data: {
                      // we really ought to fix this in background so if a singleton shows up it gets converted to an array
                      pins: [$.global.saveMe],
                      board: $.global.boardId,
                      boardName: $.global.boardName,
                      skipTimeCheck: true,
                    },
                  });
                } else {
                  window.setTimeout(checkImageData, 10);
                }
              };
              checkImageData();
              // start spinning
              $.func.changeClass({ el: $.structure.defaultSave, add: 'working' });
            }
          }
        },
        // visit pin after create
        visit: (me) => {
          if (me.event === 'click') {
            $.func.send({
              act: 'seeItNow',
              data: { pinId: $.func.get({ el: me.element, att: 'pinId' }) },
            });
          }
        },
        // open the Help article about saving
        getSaveHelp: (me) => {
          if (me.event === 'click') {
            window.open($.config.url.helpSaving);
            $.func.close();
          }
        },
      },

      // see if we have a command for this element and event name
      getCmd: (e, eventName) => {
        // what did we just click on?
        let el = $.func.getEl(e);
        // does it have an associated command?
        let cmd = $.func.get({ el: el, att: 'cmd' });
        // do we have a command ready to run?
        if (typeof $.func.cmd[cmd] === 'function') {
          // pass the element down to the command
          $.func.cmd[cmd]({ element: el, event: eventName });
        }
      },

      // a click event has been detected
      click: (e) => {
        $.func.getCmd(e, 'click');
      },

      // a mouse-over event has been detected
      over: (e) => {
        $.func.getCmd(e, 'over');
      },

      // a mouse-move event has been detected
      move: (e) => {
        $.func.getCmd(e, 'move');
      },

      // a mouse-wheel event has been detected
      wheel: (e) => {
        // lock it down; we don't want the window to move on mousewheel
        // TODO: allow the wheel to work when / if we start showing full board picker
        e.preventDefault();
      },

      // a scroll event has been detected
      scroll: (e) => {
        // lock it down; we don't want the window to move on scroll
        // TODO: allow scrolling to work when / if we start showing full board picker
        e.preventDefault();
      },

      // a keydown event has been detected
      keydown: (e) => {
        // currently le'ts close on any keypress
        // TODO: handle arrows, escape, etc for full board picker
        $.func.close();
      },

      // start
      init: () => {
        // listen for important events
        document.body.addEventListener('click', $.func.click);
        // we will use mouseOver to close
        document.addEventListener('mouseover', $.func.over);
        // we will use mouseMove to close
        document.addEventListener('mousemove', $.func.move);
        // catch mousewheel
        document.addEventListener('wheel', $.func.wheel, { passive: false });
        // catch scroll
        window.addEventListener('scroll', $.func.scroll, { passive: false });
        // listen for keystrokes
        document.addEventListener('keydown', $.func.keydown);
        // don't allow right-click menus unless we are in debug mode
        if (!$.global.debug) {
          document.addEventListener('contextmenu', (event) => event.preventDefault());
        }
        $.func // document.body is hidden by default in style, so do this AFTER we render structure
          .buildStyleFrom($.config.presentation);

        // build our structure and land it in document.body
        $.func.addFromTemplate({
          template: $.config.structure,
          addTo: document.body,
        });

        $.structure.defaultSave.innerText = $.global.msg.saveAction;
        $.structure.boardPickerOpenerLabel.innerText = $.global.msg.boardPickerOpenerLabel;
      },
    },
  };

  // start listening for messages from the background
  $.browser.runtime.onMessage.addListener((r) => {
    $.func.debug('message received');
    $.func.debug(r);
    // is it for us?
    if (r.to === $.config.me) {
      // do we have a handler?
      if (r.act && typeof $.func.act[r.act] === 'function') {
        // run it
        $.func.act[r.act](r);
      }
    }
  });

  // get everything in local storage and init
  $.browser.storage.local.get(['debug', 'msg'], (r) => {
    // anything returned from local storage is now available in $.global
    for (let i in r) {
      $.global[i] = r[i];
    }
    // Promote the pin create fail from msg.create
    const msgPinFail = $.global.msg.create.msgPinFail;
    // grab the rest
    $.global.msg = $.global.msg.save;
    // save pin create fail message
    $.global.msg.msgPinFail = msgPinFail;
    // fire it off
    $.func.init();
  });
})({
  // everything under here winds up in $.config after load

  // primary identifier for this overlay's scope
  me: 'save',

  url: {
    helpSaving: 'https://help.pinterest.com/articles/trouble-pinterest-browser-button',
  },

  // our structure
  structure: {
    bg: {
      // clicking outside the UI should close
      cmd: 'close',
      me: {
        boardPickerOpener: {
          cmd: 'allowClose',
          boardPickerOpenerContainer: {
            boardPickerOpenerLabel: {},
            boardPickerOpenerCurrent: {},
            boardPickerOpenerMask: {
              addClass: 'mask',
              cmd: 'showBoardPicker',
            },
          },
          defaultSave: {
            cmd: 'save',
          },
          afterSave: {
            cmd: 'visit',
          },
        },
      },
    },
  },

  // our presentation is a SASS-like object to be turned into stylesheets
  presentation: {
    '*': {
      '%prefix%box-sizing': 'border-box',
    },
    body: {
      margin: '0',
      padding: '0',
      'font-family':
        '"Helvetica Neue", Helvetica, "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", メイリオ, Meiryo, "ＭＳ Ｐゴシック", arial, sans-serif',
      // wherever %prefix% appears, something like moz- or webkit- will be substituted by the build
      '%prefix%font-smoothing': 'antialiased',
      '-moz-osx-font-smoothing': 'grayscale',
      '._bg': {
        position: 'fixed',
        top: '0',
        left: '0',
        height: '100vh',
        width: '100vw',
        background: 'transparent',
        '._me': {
          position: 'absolute',
          display: 'none',
          '._boardPickerOpener': {
            display: 'flex',
            height: '40px',
            width: '236px',
            'box-shadow': '0px 0px 10px -8px #000000',
            position: 'absolute',
            '._boardPickerOpenerContainer': {
              display: 'grid',
              position: 'relative',
              // leave room for Pinterest logo to the left
              padding: '7px 0 7px 35px',
              'border-radius': '8px 0 0 8px',
              flex: '1 1 auto',
              background:
                'url(data:image/svg+xml;base64,PHN2ZyBpZD0ic291cmNlIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjgiIGZpbGw9IndoaXRlIj48L2NpcmNsZT4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0wIDhDMCAxMS40MTUzIDIuMTQwNjcgMTQuMzMxMyA1LjE1MzMzIDE1LjQ3ODdDNS4wOCAxNC44NTQgNS4wMDIgMTMuODI0IDUuMTcgMTMuMTAxM0M1LjMxNDY3IDEyLjQ4IDYuMTA0IDkuMTQyNjcgNi4xMDQgOS4xNDI2N0M2LjEwNCA5LjE0MjY3IDUuODY2IDguNjY2IDUuODY2IDcuOTZDNS44NjYgNi44NTMzMyA2LjUwNzMzIDYuMDI2NjcgNy4zMDY2NyA2LjAyNjY3QzcuOTg2NjcgNi4wMjY2NyA4LjMxNDY3IDYuNTM2NjcgOC4zMTQ2NyA3LjE0OEM4LjMxNDY3IDcuODMxMzMgNy44NzkzMyA4Ljg1MjY3IDcuNjU0NjcgOS44QzcuNDY3MzMgMTAuNTkyNyA4LjA1MjY3IDExLjIzOTMgOC44MzQgMTEuMjM5M0MxMC4yNDkzIDExLjIzOTMgMTEuMzM4IDkuNzQ2NjcgMTEuMzM4IDcuNTkyQzExLjMzOCA1LjY4NDY3IDkuOTY3MzMgNC4zNTIgOC4wMTA2NyA0LjM1MkM1Ljc0NTMzIDQuMzUyIDQuNDE1MzMgNi4wNTEzMyA0LjQxNTMzIDcuODA4QzQuNDE1MzMgOC40OTI2NyA0LjY3ODY3IDkuMjI2IDUuMDA4IDkuNjI1MzNDNS4wNzI2NyA5LjcwNDY3IDUuMDgyNjcgOS43NzMzMyA1LjA2MzMzIDkuODU0QzUuMDAyNjcgMTAuMTA2IDQuODY4IDEwLjY0NjcgNC44NDIgMTAuNzU3M0M0LjgwNjY3IDEwLjkwMjcgNC43MjY2NyAxMC45MzQgNC41NzUzMyAxMC44NjMzQzMuNTgwNjcgMTAuNDAwNyAyLjk1OTMzIDguOTQ2NjcgMi45NTkzMyA3Ljc3ODY3QzIuOTU5MzMgNS4yNjYgNC43ODQgMi45NTkzMyA4LjIyMDY3IDIuOTU5MzNDMTAuOTgzMyAyLjk1OTMzIDEzLjEzMDcgNC45MjggMTMuMTMwNyA3LjU1ODY3QzEzLjEzMDcgMTAuMzAzMyAxMS40MDA3IDEyLjUxMjcgOC45OTggMTIuNTEyN0M4LjE5MDY3IDEyLjUxMjcgNy40MzI2NyAxMi4wOTI3IDcuMTcyNjcgMTEuNTk3M0M3LjE3MjY3IDExLjU5NzMgNi43NzMzMyAxMy4xMTg3IDYuNjc2NjcgMTMuNDkwN0M2LjQ4ODY3IDE0LjIxMzMgNS45NjczMyAxNS4xMjggNS42NDQgMTUuNjQ3M0M2LjM4OTMzIDE1Ljg3NjcgNy4xOCAxNiA4IDE2QzEyLjQxOCAxNiAxNiAxMi40MTggMTYgOEMxNiAzLjU4MiAxMi40MTggMCA4IDBDMy41ODIgMCAwIDMuNTgyIDAgOFoiIGZpbGw9IiNFNjAwMjMiPjwvcGF0aD4KPC9zdmc+) 10px 50% no-repeat, url(data:image/svg+xml;base64,PHN2ZyBpZD0ic291cmNlIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04LjM5OTk4IDIuNzcxMjVMNC45OTk5OCA2LjEyOTU4TDEuNjAwODIgMi43NzEyNUMxLjIzNDE1IDIuNDA5NTggMC42NDA4MTUgMi40MDk1OCAwLjI3NDU2NSAyLjc3MTI1Qy0wLjA5MTY4NDYgMy4xMzI1IC0wLjA5MTY4NDYgMy43MiAwLjI3NDU2NSA0LjA4MTY3TDQuOTk5OTggOC43NUw5LjcyNTQgNC4wODE2N0M5LjkwODMxIDMuOTAwNDIgOS45OTk5OCAzLjY2MjkyIDkuOTk5OTggMy40MjYyNUM5Ljk5OTk4IDMuMTg5MTcgOS45MDgzMSAyLjk1MjA4IDkuNzI1NCAyLjc3MTI1QzkuNTQyNDggMi41OTA0MiA5LjMwMjQ4IDIuNSA5LjA2MjQ4IDIuNUM4LjgyMjQ4IDIuNSA4LjU4MjkgMi41OTA0MiA4LjM5OTk4IDIuNzcxMjVaIiBmaWxsPSIjNzY3Njc2Ij48L3BhdGg+Cjwvc3ZnPg==) 95% 50% no-repeat',
              'background-color': '#fff',
              'background-size': '16px 16px, 10px 10px',
              // Save to board
              '._boardPickerOpenerLabel': {
                display: 'block',
                'font-size': '10px',
                'line-height': '12px',
              },
              '._boardPickerOpenerCurrent': {
                display: 'block',
                'white-space': 'nowrap',
                'text-overflow': 'ellipsis',
                overflow: 'hidden',
                'font-weight': 'bold',
                'font-size': '12px',
                'padding-right': '20px',
              },
            },
            '._defaultSave': {
              cursor: 'pointer',
              'min-width': '58px',
              padding: '0px 5px',
              flex: '0 0 auto',
              height: '40px',
              'border-radius': '0 8px 8px 0',
              background: '#e60023',
              color: '#fff',
              font: '12px/40px "Helvetica Neue", Helvetica, sans-serif',
              'font-weight': 'bold',
              'text-align': 'center',
              '&:hover': {
                background: '#e60023 linear-gradient(rgba(0,0,0,0.06), rgba(0,0,0,0.06))',
              },
              '&._working': {
                background:
                  'linear-gradient(rgba(0,0,0,0.06), rgba(0,0,0,0.06)), url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIAoJeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiAKCXhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiAKCWhlaWdodD0iMzIiCgl3aWR0aD0iMzIiCgl2aWV3Qm94PSIwIDAgMTYgMTYiIAoJeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+Cgk8cGF0aCBmaWxsPSIjZmZmIiBkPSIKICAJTSA4LCAwCiAgICBBIC41LCAuNSwgMCwgMCwgMCwgOCwgMQogICAgQSA2LCA3LCAwLCAwLCAxLCAxNCwgOAogICAgQSA2LCA2LCAwLCAwLCAxLCA4LCAxNAogICAgQSA1LCA2LCAwLCAwLCAxLCAzLCA4CiAgICBBIDEsIDEsIDAsIDAsIDAsIDAsIDgKICAgIEEgOCwgOCwgMCwgMCwgMCwgOCwgMTYKICAgIEEgOCwgOCwgMCwgMCwgMCwgMTYsIDgKICAgIEEgOCwgOCwgMCwgMCwgMCwgOCwgMAogICAgWiIgPgogICAgPGFuaW1hdGVUcmFuc2Zvcm0KCQkJYXR0cmlidXRlVHlwZT0ieG1sIgoJCQlhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iCgkJCXR5cGU9InJvdGF0ZSIKCQkJZnJvbT0iMCA4IDgiCgkJCXRvPSIzNjAgOCA4IgoJCQlkdXI9IjAuNnMiCgkJCXJlcGVhdENvdW50PSJpbmRlZmluaXRlIgoJCS8+Cgk8L3BhdGg+Cjwvc3ZnPgo=) 50% 50% no-repeat',
                'background-color': '#e60023',
                'background-size': '18px 18px',
                color: 'transparent',
              },
              '&._done': {
                background:
                  'linear-gradient(rgba(0,0,0,0.06), rgba(0,0,0,0.06)), url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHdpZHRoPSIxN3B4IiBoZWlnaHQ9IjEzcHgiIHZpZXdCb3g9IjAgMCAxNyAxMyIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48Zz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMyw0TDcsOEwxNCwxQTEsMSAwIDAgMSAxNiwzTDcsMTJMMSw2QTEsMSAwIDAgMSAzLDRaIi8+PC9nPjwvc3ZnPg==) 50% 50% no-repeat',
                'background-color': '#e60023',
                'background-size': '18px 18px',
                color: 'transparent',
              },
            },
            '._afterSave': {
              'border-radius': '8px',
              cursor: 'pointer',
              'min-width': '45px',
              padding: '0px 5px',
              height: '28px',
              'border-radius': '14px',
              margin: '6px 6px 6px 0',
              background: '#EFEFEF url() 50% 50% no-repeat',
              color: '#000',
              font: '12px/28px "Helvetica Neue", Helvetica, sans-serif',
              'font-weight': 'bold',
              'text-align': 'center',
              'white-space': 'nowrap',
              flex: '0 0 auto',
              display: 'none',
              '&:hover': {
                background: '#EFEFEF linear-gradient(rgba(0,0,0,0.06),rgba(0,0,0,0.06))',
              },
            },
            '&._feedback': {
              'background-color': '#fff',
              'border-radius': '8px',
              '._boardPickerOpenerContainer': {
                background:
                  '#fff url(data:image/svg+xml;base64,PHN2ZyBpZD0ic291cmNlIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04IDBDMy41ODE3MiAwIDAgMy41ODE3MiAwIDhDMCAxMi40MTgzIDMuNTgxNzIgMTYgOCAxNkMxMi40MTgzIDE2IDE2IDEyLjQxODMgMTYgOEMxNiAzLjU4MTcyIDEyLjQxODMgMCA4IDBaTTQuMjQ0IDguOTE2TDcgMTEuNjY2N0wxMS43NTYgNi45MTk2N0MxMi4wODEzIDYuNTk1IDEyLjA4MTMgNi4wNjgzNCAxMS43NTYgNS43NDM2N0MxMS40MzA3IDUuNDE4NjcgMTAuOTAyNyA1LjQxODY3IDEwLjU3NzMgNS43NDM2N0w3IDkuMzE0TDUuNDIyNjcgNy43Mzk2N0M1LjA5NzMzIDcuNDE1IDQuNTY5MzMgNy40MTUgNC4yNDQgNy43Mzk2N0MzLjkxODY3IDguMDY0NjcgMy45MTg2NyA4LjU5MTM0IDQuMjQ0IDguOTE2WiIgZmlsbD0iI0U2MDAyMyI+PC9wYXRoPgo8L3N2Zz4=) 10px 50% no-repeat',
              },
              '._boardPickerOpenerCurrent': {
                'padding-right': '0px',
              },
              '._defaultSave': {
                display: 'none',
              },
              '._afterSave': {
                display: 'block',
              },
              '._mask': {
                '&:hover': {
                  background: 'transparent',
                },
              },
            },
            '&._fail': {
              background: '#fff linear-gradient(rgba(255,0,0,0.08), rgba(255,0,0,0.08))',
              '._boardPickerOpenerContainer': {
                background:
                  'url(data:image/svg+xml;base64,PHN2ZyBpZD0ic291cmNlIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE1LjQxNDYgNi41ODI0NUw5LjQxNzU1IDAuNTg1MzY2QzguNjM3MDYgLTAuMTk1MTIyIDcuMzYyOTMgLTAuMTk1MTIyIDYuNTgyNDUgMC41ODUzNjZMMC41ODUzNjYgNi41ODI0NUMtMC4xOTUxMjIgNy4zNjI5NCAtMC4xOTUxMjIgOC42MzcwNiAwLjU4NTM2NiA5LjQxNzU1TDYuNTgyNDUgMTUuNDE0NkM3LjM2MjkzIDE2LjE5NTEgOC42MzcwNiAxNi4xOTUxIDkuNDE3NTUgMTUuNDE0NkwxNS40MTQ2IDkuNDE3NTVDMTYuMTk1MSA4LjYzNzA2IDE2LjE5NTEgNy4zNjk2MSAxNS40MTQ2IDYuNTgyNDVaTTcuOTk2NjYgMTIuNjcyOUM3LjQyMjk3IDEyLjY3MjkgNi45NTYwMSAxMi4yMDYgNi45NTYwMSAxMS42MzIzQzYuOTU2MDEgMTEuMDU4NiA3LjQyMjk3IDEwLjU5MTYgNy45OTY2NiAxMC41OTE2QzguNTcwMzUgMTAuNTkxNiA5LjAzNzMxIDExLjA1ODYgOS4wMzczMSAxMS42MzIzQzkuMDM3MzEgMTIuMjA2IDguNTcwMzUgMTIuNjcyOSA3Ljk5NjY2IDEyLjY3MjlaTTkuMDM3MzEgOC41MjM2NkM5LjAzNzMxIDkuMDk3MzUgOC41NzAzNSA5LjU2NDMxIDcuOTk2NjYgOS41NjQzMUM3LjQyMjk3IDkuNTY0MzEgNi45NTYwMSA5LjA5NzM1IDYuOTU2MDEgOC41MjM2NlY0LjM2NzczQzYuOTU2MDEgMy43OTQwNCA3LjQyMjk3IDMuMzI3MDggNy45OTY2NiAzLjMyNzA4QzguNTcwMzUgMy4zMjcwOCA5LjAzNzMxIDMuNzk0MDQgOS4wMzczMSA0LjM2NzczVjguNTIzNjZaIiBmaWxsPSIjRTYwMDIzIj48L3BhdGg+Cjwvc3ZnPg==) 10px 50% no-repeat',
              },
              '._afterSave': {
                background: '#e60023 url() 50% 50% no-repeat',
                color: '#fff',
                '&:hover': {
                  background: '#e60023 linear-gradient(rgba(0,0,0,0.06),rgba(0,0,0,0.06))',
                },
              },
            },
          },
          // click collector
          '._mask': {
            position: 'absolute',
            top: '0',
            left: '0',
            bottom: '0',
            right: '0',
            height: '100%',
            width: 'auto',
            cursor: 'pointer',
            'border-radius': '8px 0px 0px 8px',
            '&:hover': {
              background: 'linear-gradient(rgba(0,0,0,0.03), rgba(0,0,0,0.03))',
            },
          },
        },
      },
    },
  },
});
