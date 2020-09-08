/*
  BUG-110089: fix long board name and save button overlap
  CONG-110: add on-hover board picker for browser extension (D601098)
  BUG-114521: update and maintain most recent board on client side after pin/board creation (D602980)
*/

((w, d, a) => {
  let $ = (w[a.k] = {
    w,
    d,
    a,
    b: chrome || browser,
    v: {
      css: '',
      filterable: [],
      back: [],
      lastFilterValue: 'a',
      msg: {},
    },
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
        let r = null;
        if (typeof o.el[o.att] === 'string') {
          r = o.el[o.tt];
        } else {
          r = o.el.getAttribute($.a.dataAttributePrefix + o.att);
        }
        return r;
      },
      // set a DOM property or text attribute
      set: (o) => {
        if (typeof o.el[o.att] === 'string') {
          o.el[o.att] = o.string;
        } else {
          o.el.setAttribute($.a.dataAttributePrefix + o.att, o.string);
        }
      },
      // create a DOM element
      make: (o) => {
        let el = false,
          t,
          a,
          k;
        for (t in o) {
          el = $.d.createElement(t);
          for (a in o[t]) {
            if (typeof o[t][a] === 'string') {
              $.f.set({
                el: el,
                att: a,
                string: o[t][a],
              });
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
      // send a message
      send: (o) => {
        o.via = $.v.me;
        o.to = 'background';
        if (o.act === 'contextLog') {
          $.f.debug('Logging contextLog');
          $.f.debug(o);
        }
        $.b.runtime.sendMessage(o);
      },
      // send a ping from the background process to log.pinterest.com
      log: (o) => {
        o.lv = $.a.ver;
        $.f.send({
          act: 'log',
          data: o,
        });
      },
      // remove a DOM element
      kill: (o) => {
        if (o.el && o.el.parentNode) {
          o.el.parentNode.removeChild(o.el);
        }
      },
      // return an event's target element
      getEl: (e) => {
        let r = e.target;
        // text node; return parent
        if (r.targetNodeType === 3) {
          r = r.parentNode;
        }
        return r;
      },
      // return moz, webkit, ms, etc
      getVendorPrefix: () => {
        let x = /^(moz|webkit|ms)(?=[A-Z])/i,
          r = '',
          p;
        for (p in $.d.b.style) {
          if (x.test(p)) {
            r = `-${p.match(x)[0].toLowerCase()}-`;
            break;
          }
        }
        return r;
      },
      // build stylesheet
      buildStyleSheet: () => {
        let css, rules, k, re, repl;
        css = $.f.make({ STYLE: { type: 'text/css' } });
        rules = $.v.css;
        // each rule has our randomly-created key at its root to minimize style collisions
        rules = rules.replace(/\._/g, '.' + a.k + '_');
        // strings to replace in CSS rules
        repl = {
          '%prefix%': $.f.getVendorPrefix(),
        };
        // replace everything in repl throughout rules
        for (k in repl) {
          if (repl[k].hasOwnProperty) {
            // re = new RegExp(k, 'g');
            rules = rules.replace(new RegExp(k, 'g'), repl[k]);
          }
        }
        // add rules to stylesheet
        if (css.styleSheet) {
          css.styleSheet.cssText = rules;
        } else {
          css.appendChild($.d.createTextNode(rules));
        }
        // add stylesheet to page
        if ($.d.h) {
          $.d.h.appendChild(css);
        } else {
          $.d.b.appendChild(css);
        }
      },
      // recursive function to make rules out of a Sass-like object
      presentation: (o) => {
        // make CSS rules
        let name,
          i,
          k,
          pad,
          key,
          rules = '',
          selector = o.str || '';
        for (k in o.obj) {
          if (typeof o.obj[k] === 'string') {
            rules = `${rules}\n ${k}: ${o.obj[k]};`;
          }
          if (typeof o.obj[k] === 'object') {
            key = selector + ' ' + k;
            key = key.replace(/ &/g, '');
            key = key.replace(/,/g, `, ${selector}`);
            $.f.presentation({ obj: o.obj[k], str: key });
          }
        }
        // add selector and rules to stylesheet
        if (selector && rules) {
          $.v.css = `${$.v.css}${selector} { ${rules}\n}\n`;
        }
        // if this is our root, remove from current context and make stylesheet
        if (o.obj === $.a.styles) {
          $.w.setTimeout(() => {
            $.f.buildStyleSheet();
          }, 1);
        }
      },
      // build complex structure from a JSON template
      buildOne: (o) => {
        let key, classNames, i, container, child, text, value;
        for (key in o.obj) {
          value = o.obj[key];
          if (typeof value === 'string') {
            // addClass may contain more than one selector
            if (key === 'addClass') {
              classNames = value.split(' ');
              for (i = 0; i < classNames.length; i = i + 1) {
                o.el.className = `${o.el.className} ${$.a.k}_${classNames[i]}`;
              }
            } else {
              if (key !== 'tag') {
                $.f.set({
                  el: o.el,
                  att: key,
                  string: value,
                });
              }
            }
          } else {
            // create a new container
            container = {
              [value.tag || 'SPAN']: {
                className: `${$.a.k}_${key}`,
              },
            };
            child = $.f.make(container);
            o.el.appendChild(child);
            if (!$.s[key]) {
              $.s[key] = child;
              // fill with translated text if needed
              if ($.v.msg[key]) {
                text = $.v.msg[key];
                if (child.tagName === 'INPUT') {
                  // placeholder
                  child.placeholder = text;
                } else {
                  // string in non-input element
                  child.innerText = $.f.clean({ str: text });
                }
              }
            }
            // recurse
            $.f.buildOne({ obj: value, el: child });
          }
        }
      },
      // clean troublesome characters and extra whitespace from strings that may be shown onscreen
      clean: (o) => {
        return new DOMParser()
          .parseFromString(o.str, 'text/html')
          .documentElement.textContent.replace(/(\n|\r)/g, '')
          .replace(/ +(?= )/g, '');
      },
      changeClass: (o) => {
        let i, applyThis;
        if (o.el) {
          if (!o.el.length) {
            o.el = [o.el];
          }
          for (i = 0; i < o.el.length; i = i + 1) {
            // do your adds and removes
            if (o.el[i] && o.el[i].classList) {
              if (o.add) {
                if (typeof o.add !== 'object') {
                  o.add = [o.add];
                }
                // add OURGLOBAL_ to supplied class names
                applyThis = o.add.map((e) => {
                  return `${$.a.k}_${e}`;
                });
                o.el[i].classList.add.apply(o.el[i].classList, applyThis);
              }
              if (o.remove) {
                if (typeof o.remove !== 'object') {
                  o.remove = [o.remove];
                }
                applyThis = o.remove.map((e) => {
                  return `${$.a.k}_${e}`;
                });
                o.el[i].classList.remove.apply(o.el[i].classList, applyThis);
              }
            }
            if (o.el[i].classList && !o.el[i].classList.length) {
              o.el[i].removeAttribute('class');
            }
          }
        }
      },
      // fulfill internal requests from DOM objects
      cmd: {
        closeFollowNag: () => {
          $.s.followNag.style.display = 'none';
          $.f.changeClass({ el: $.s.preview, remove: 'hazFollowNag' });
          $.s.description.style.display = 'block';
        },
        submitFollow: (o) => {
          $.s.followButton.removeAttribute('data-cmd');
          $.f.changeClass({ el: $.s.followButton, add: 'active' });
          $.f.send({
            to: 'background',
            act: 'putFollow',
            data: {
              pinner_id: o.dataset['pinner_id'],
            },
          });
        },
        // close the create form
        close: (str) => {
          if (typeof str === 'string') {
            $.w.alert(str);
          }
          $.f.send({
            to: 'background',
            act: 'closeCreate',
          });
          return;
        },
        // close overlay
        closeOverlayOpenNewPage: (o) => {
          let url;
          if (o.dataset.url) {
            url = o.dataset.url;
          } else {
            url = o;
          }
          $.f.send({
            to: 'background',
            act: 'closeCreate',
            url: url,
          });
        },
        // open the Help article about saving
        getSaveHelp: () => {
          $.w.open($.a.url.helpSaving);
          $.f.cmd.close();
        },
        // get sections for a board
        fetchSections: (el) => {
          $.f.send({
            to: 'background',
            act: 'getSections',
            data: {
              timeCheck: $.v.timeCheck,
              board: el.dataset.board,
            },
          });
        },
        // show sections for a board
        showSections: (el) => {
          let board, data, li, i;
          $.v.sectionParentBoard = el.parentNode;
          $.f.changeClass({ el: $.v.sectionParentBoard, add: 'canHazSave' });
          data = $.v.board[el.dataset.board];
          // hide all list items in the picker
          $.f.hide($.s.items);
          // hide all list items in the picker
          $.f.hide([$.s.topChoices, $.s.allBoards]);
          // show the parent board
          $.f.show($.v.sectionParentBoard);
          // loop through this board's sections and show them
          $.v.filterable = [$.v.sectionParentBoard];
          // add sections
          for (i = 0; i < data.sections.length; i = i + 1) {
            li = $.d.getElementById('section_' + data.sections[i].id);
            $.v.filterable.push(li);
          }
          $.f.changeClass({
            el: $.v.filterable,
            remove: ['hidden', 'filtered'],
          });
          el.dataset.cmd = 'save';
          // set the main nav indicator
          $.f.changeClass({ el: $.s.x, add: 'back', remove: 'close' });
          $.s.x.dataset.cmd = 'hideSections';
          $.s.innerAddFormOpener.dataset.via = 'section';
          $.s.outerAddFormOpener.dataset.via = 'section';
          $.s.innerAddFormOpener.innerText = $.v.msg.addSection;
          $.s.outerAddFormOpener.innerText = $.v.msg.addSection;
          $.s.hd.innerText = $.v.msg.chooseSection;
          $.v.mainFilter = $.s.filter.value;
          $.s.filter.value = '';
          $.s.filter.focus();
          // hide all section arrows
          $.f.hide($.d.getElementsByClassName($.a.k + '_sectionArrow'));
          $.f.itemSelect($.v.sectionParentBoard, true);
          $.v.mode = 'chooseSection';
          // log the view of the section picker
          $.f.send({
            to: 'background',
            act: 'contextLog',
            data: {
              eventType: 'VIEW',
              viewType: 'BOARD_SECTION_PICKER',
              auxData: {
                url: $.v.data[0].funnel_url,
                funnel_uuid: $.v.data[0].funnel_uuid,
              },
            },
          });
        },
        // hide sections for a board
        hideSections: () => {
          // show all boards
          $.f.show($.s.items);
          // hide all sections
          $.f.hide($.d.getElementsByClassName($.a.k + '_section'));
          // hide all list items in the picker
          $.f.show($.s.allBoards);
          if ($.v.boardNames.length > 3) {
            // show top choices and top three picker
            $.f.show([$.s.topChoices, $.s.pickerTop]);
            $.v.sectionParentBoard.scrollIntoView(true);
          }
          // hide save button
          $.f.changeClass({ el: $.v.sectionParentBoard, remove: 'canHazSave' });
          $.f.itemSelect($.v.sectionParentBoard, true);
          // change the current board's command back to show
          $.v.sectionParentBoard.lastChild.dataset.cmd = 'showSections';
          $.v.sectionParentBoard = null;
          // set the main nav indicator
          $.f.changeClass({ el: $.s.x, add: 'close', remove: 'back' });
          $.s.x.dataset.cmd = 'close';
          $.s.innerAddFormOpener.dataset.via = 'board';
          $.s.outerAddFormOpener.dataset.via = 'board';
          $.s.innerAddFormOpener.innerText = $.v.msg.outerAddFormOpener;
          $.s.outerAddFormOpener.innerText = $.v.msg.outerAddFormOpener;
          $.s.hd.innerText = $.v.msg.chooseBoard;
          $.v.filterable = $.s.items;
          $.s.filter.value = $.v.mainFilter;
          $.s.filter.focus();
          // show all section arrows
          $.f.show($.d.getElementsByClassName($.a.k + '_sectionArrow'));
          $.v.mode = 'chooseBoard';
        },
        // save a pin: pass the mask as el
        save: (el) => {
          let q;
          // no pinning without board and don't react to clicks on item list while save is in progress
          if (el.dataset.board && !$.v.hazSelectBlock) {
            // find the button in the element
            $.v.button = el.parentNode.getElementsByClassName(`${$.a.k}_button`)[0];
            // lock button on
            $.v.button.style.display = 'block';
            // spin the button
            $.v.button.className = `${$.v.button.className} ${$.a.k}_active`;
            // disable mouse/keyboard interactions while we're spinning and pinning
            $.v.hazSelectBlock = true;
            // use these later for success messages
            $.v.savedTo = el.dataset.savedTo;
            $.v.data[0].description =
              $.f.clean({ str: $.s.description.value.substr(0, 500) }) || '';
            q = {
              pins: $.v.data,
              board: el.dataset.board,
              boardName: $.v.board[el.dataset.board].name,
            };

            // if we're pinning to a section, specify it
            if (el.dataset.section) {
              q.section = el.dataset.section;
            }
            q.timeCheck = $.v.timeCheck;
            $.f.send({
              to: 'background',
              act: 'save',
              data: q,
            });
            // reset the counter for feedback
            $.v.savedPins = 0;
          }
        },
        // close the add form
        closeAddForm: (el) => {
          // recover opening state
          let v = $.v.back.pop();
          $.f.show($.s.pickerContainer);
          $.f.hide($.s.addForm);
          $.s.hd.innerText = v.hd;
          $.s.x.className = v.className;
          $.s.x.dataset.cmd = v.cmd;
          $.v.mode = v.mode;
          $.s.innerAddFormOpener.innerText = `${$.v.msg.submitAddForm} ${v.opener}`;
          $.s.filter.value = v.opener;
          if ($.s.filter.value) {
            $.f.show($.s.innerAddFormOpener);
          } else {
            $.f.show($.s.outerAddFormOpener);
          }
          $.v.adding = false;
          $.s.filter.placeholder = $.v.msg.filter;
          $.f.changeClass({ el: $.s.filter, add: 'search' });
          $.s.filter.focus();
        },
        // open the add form
        openAddForm: (el) => {
          const via = el.dataset.via;
          const isAddingNewSection = via === 'section';

          // We're about to display the create board form so we should log this
          $.f.send({
            to: 'background',
            act: 'contextLog',
            data: {
              eventType: 'VIEW',
              viewType: isAddingNewSection ? 'BOARD_SECTION_CREATE' : 'CREATE_BOARD',
              auxData: {
                url: $.v.data[0].funnel_url,
                funnel_uuid: $.v.data[0].funnel_uuid,
              },
            },
          });
          // deselect selectedItem or Enter will save there rather than making new section
          $.f.changeClass({ el: $.v.selectedItem, remove: 'selected' });
          $.v.selectedItem = '';
          // save existing go-back command
          $.f.hide($.s.innerAddFormOpener);
          $.f.hide($.s.outerAddFormOpener);
          // save so we can go back
          $.v.back.push({
            className: $.s.x.className,
            cmd: $.s.x.dataset.cmd,
            opener: $.s.filter.value,
            hd: $.s.hd.innerText,
            mode: $.v.mode,
          });
          $.f.changeClass({ el: $.s.filter, remove: 'search' });
          if (isAddingNewSection) {
            // adding a new section
            $.f.hide($.s.addFormSecretContainer);
            $.s.hd.innerText = $.v.msg.addSection;
            $.s.filter.placeholder = $.v.msg.placeholderFilterAddSection;
            $.v.mode = 'newSection';
          } else {
            // adding a new board
            $.f.show($.s.addFormSecretContainer);
            $.s.hd.innerText = $.v.msg.outerAddFormOpener;
            $.s.filter.placeholder = $.v.msg.placeholderFilterAddBoard;
            $.v.mode = 'newBoard';
          }
          $.f.changeClass({ el: $.s.x, add: 'back', remove: 'close' });
          // enable the button if we have something in filter
          if ($.s.filter.value) {
            $.f.changeClass({ el: $.s.submitAddForm, remove: 'disabled' });
            $.s.submitAddForm.dataset.disabled = '';
          }
          $.s.x.dataset.cmd = 'closeAddForm';
          $.f.hide($.s.pickerContainer);
          $.f.show($.s.addForm);
          // so we can disable the Add button when we need to
          $.v.adding = via;
          $.s.filter.focus();
        },
        // submit the add form
        submitAddForm: (el) => {
          let o, v, newName;
          newName = $.s.filter.value.trim();
          if (newName && $.s.submitAddForm.dataset.disabled !== 'disabled') {
            if ($.v.mode === 'newBoard' || $.v.mode === 'newSection') {
              // deselect all items
              $.f.changeClass({ el: $.s.items, remove: 'selected' });
              o = {
                to: 'background',
                act: $.v.mode,
                data: {},
              };
              if ($.v.mode === 'newBoard') {
                o.data.name = newName;
                o.data.secret = $.s.addFormSecret.checked;
              }
              if ($.v.mode === 'newSection') {
                o.data.title = newName;
                o.data.board = $.v.sectionParentBoard.id.split('_')[1];
              }
              o.data.timeCheck = $.v.timeCheck;
              $.f.send(o);
              // close add form after send, not as part of callback
              $.s.filter.value = '';
              $.s.closeAddForm.dataset.clearFilter = true;
              v = $.v.back.pop();
              v.opener = '';
              $.v.back.push(v);
              $.f.runCmd($.s.closeAddForm);
            }
          }
        },
      },
      // unstick the keyboard cursor when the mouse moves
      mousemove: (e) => {
        $.v.hazKeyboardNav = false;
      },
      mouseover: (e) => {
        let el, cmd;
        el = $.f.getEl(e);
        if (el.className === $.a.k + '_mask') {
          if (!$.v.hazKeyboardNav) {
            $.f.itemSelect(el.parentNode);
          }
        } else if (el.classList.contains($.a.k + '_outerAddFormOpener')) {
          $.f.changeClass({ el: $.v.selectedItem, remove: 'selected' });
        }
      },
      // programatically run the command set on an element (such as the Back button)
      runCmd: (el) => {
        let cmd = el.dataset.cmd;
        if (cmd && typeof $.f.cmd[cmd] === 'function') {
          // always pass the element that was clicked to its handler
          $.f.cmd[cmd](el);
          return;
        }
      },
      // return the previous and next visible siblings of an element
      getNav: (el) => {
        let r = {},
          i,
          n,
          allSibs,
          visibleSibs = [];
        // we need all list items including top choices and all boards
        allSibs = $.s.pickerContainer.getElementsByTagName('LI');
        for (i = 0; i < allSibs.length; i = i + 1) {
          if (
            !allSibs[i].classList.contains($.a.k + '_filtered') &&
            !allSibs[i].classList.contains($.a.k + '_hidden')
          ) {
            visibleSibs.push(allSibs[i]);
          }
        }
        for (i = 0, n = visibleSibs.length; i < n; i = i + 1) {
          if (visibleSibs[i] === el) {
            if (i) {
              r.prev = visibleSibs[i - 1];
            }
            if (i < n - 1) {
              r.next = visibleSibs[i + 1];
            }
            break;
          }
        }
        return r;
      },
      keydown: (e) => {
        let i, k, idx;
        k = e.keyCode || null;
        switch (k) {
          // enter
          case 13:
            // are we filtering?
            if ($.d.activeElement === $.s.filter) {
              if ($.v.selectedItem) {
                // save to section or board
                $.f.runCmd($.v.selectedItem.lastChild);
              } else {
                if ($.v.mode === 'newBoard' || $.v.mode === 'newSection') {
                  $.f.runCmd($.s.submitAddForm);
                } else {
                  // open the add form
                  $.f.runCmd($.s.innerAddFormOpener);
                }
              }
            }
            break;

          // escape
          case 27:
            if ($.s.filter.value) {
              // clear filter
              $.s.filter.value = '';
            } else {
              // escape: pretend we tapped $.s.x
              $.f.runCmd($.s.x);
            }
            break;

          // up
          case 38:
            // are we filtering?
            if ($.d.activeElement === $.s.filter) {
              $.v.hazKeyboardNav = true;
              if ($.v.selectedItem) {
                let sibs = $.f.getNav($.v.selectedItem);
                if (sibs.prev) {
                  $.f.itemSelect(sibs.prev, true);
                }
              }
            }
            break;

          // right
          case 39:
            if ($.d.activeElement === $.s.filter) {
              if (
                $.v.selectedItem &&
                ($.v.selectedItem.lastChild.dataset.cmd === 'fetchSections' ||
                  $.v.selectedItem.lastChild.dataset.cmd === 'showSections')
              ) {
                $.f.runCmd($.v.selectedItem.lastChild);
              } else {
                return;
              }
            }
            break;

          // down
          case 40:
            // are we filtering?
            if ($.d.activeElement === $.s.filter) {
              $.v.hazKeyboardNav = true;
              if ($.v.selectedItem) {
                let sibs = $.f.getNav($.v.selectedItem);
                if (sibs.next) {
                  $.f.itemSelect(sibs.next, true);
                }
              }
            }
            break;

          default:
        }
      },

      // watch for click events
      click: (e) => {
        let el, cmd;
        // close the overlay when user clicks outside of it
        if (e.target === document.body) {
          $.f.cmd.close();
        }
        el = $.f.getEl(e);
        cmd = $.f.get({ el: el, att: 'cmd' });
        if (cmd && typeof $.f.cmd[cmd] === 'function') {
          $.f.logClickEvent({ el, cmd });
          // always pass the element that was clicked to its handler
          $.f.cmd[cmd](el);
          return;
        }
      },

      // send a request to background.js to create a context log event
      logClickEvent: ({ el, cmd }) => {
        let dataAttributes = {};
        // Form pairs of eventType, viewType, and element
        switch (cmd) {
          // CONG-103 (6): Select Board without sections
          // CONG-107 (6): Select an existing section
          case 'save':
            let viewType;
            switch ($.v.mode) {
              case 'chooseBoard':
                viewType = 'BOARD_PICKER';
                break;
              case 'chooseSection':
                viewType = 'BOARD_SECTION_PICKER';
                break;
            }
            const isPinningToSection = el.dataset.section;
            if (viewType) {
              dataAttributes.eventType = 'CLICK';
              dataAttributes.viewType = viewType;
              dataAttributes.element = isPinningToSection ? 'SECTION_COVER' : 'BOARD_COVER';
            }
            break;
          // CONG-102: (5) Select board with sections
          case 'fetchSections': // clicking the board with section for the first time
          case 'showSections': // clicking the board with section for the subsequent times
            dataAttributes.eventType = 'CLICK';
            dataAttributes.viewType = 'BOARD_PICKER';
            dataAttributes.element = 'SECTION_COVER';
            break;
          // Create board and create section
          case 'submitAddForm':
            if ($.v.mode === 'newBoard' || $.v.mode === 'newSection') {
              const isAddingNewSection = $.v.mode === 'newSection';
              dataAttributes.eventType = 'CLICK';
              dataAttributes.viewType = isAddingNewSection
                ? 'BOARD_SECTION_PICKER'
                : 'BOARD_PICKER';
              dataAttributes.element = 'CREATE_BUTTON';
            }
            break;
          default:
            break;
        }

        // Trigger contextLog if dataAttributes object is not empty
        if (Object.keys(dataAttributes).length > 0) {
          $.f.send({
            to: 'background',
            act: 'contextLog',
            data: {
              ...dataAttributes,
              auxData: {
                url: $.v.data[0].funnel_url,
                funnel_uuid: $.v.data[0].funnel_uuid,
              },
            },
          });
        }
      },

      renderPreview: (data) => {
        if (data.length > 1) {
          $.s.thumb.textContent = '';
          $.f.changeClass({ el: $.s.thumb, add: 'twoColumns' });

          let first = $.f.make({
            SPAN: { className: `${$.a.k}_previewColumn` },
          });
          $.s.thumb.appendChild(first);
          let second = $.f.make({
            SPAN: { className: `${$.a.k}_previewColumn` },
          });
          $.s.thumb.appendChild(second);

          for (i = 0; i < data.length; i++) {
            let img = $.f.make({
              IMG: {
                className: $.a.k + '_previewImage',
                src: data[i].media,
              },
            });
            (i % 2 == 0 ? first : second).appendChild(img);
          }
        } else {
          $.f.changeClass({ el: $.s.thumb, remove: 'twoColumns' });
          if (data[0].media) {
            // pinning a data: URI
            preview = new Image();
            preview.onload = () => {
              // scale and center the thumbnail
              h = preview.height;
              w = preview.width;
              // scale thumbnail image to fit in pin create form
              scaledHeight = Math.floor((237 * h) / w);
              if (scaledHeight > $.a.values.scaledHeight) {
                scaledHeight = $.a.values.scaledHeight;
              }
              $.s.thumb.style.height = `${scaledHeight}px`;
              $.s.thumb.style.backgroundImage = `url('${preview.src}')`;
            };
            preview.src = data[0].media;
          } else {
            $.f.renderImagelessThumb(data[0]);
            // change the visible description in imageless thumb on change
            $.s.description.onkeyup = () => {
              $.f.renderImagelessThumb(data[0]);
            };
          }
        }
      },
      // render imageless thumbnail
      renderImagelessThumb: (data) => {
        $.s.thumb.className = `${$.a.k}_thumb ${$.a.k}_imageless`;
        $.s.thumb.style.backgroundColor = data.color;
        // kill DOM nodes inside thumb and start over
        $.s.thumb.textContent = '';
        // site name
        $.s.thumb.appendChild(
          $.f.make({
            SPAN: {
              innerText: $.f.clean({ str: data.siteName || '' }),
              className: `${$.a.k}_site`,
            },
          }),
        );
        $.s.thumb.appendChild(
          $.f.make({
            SPAN: {
              innerText: $.f
                .clean({ str: $.s.description.value || data.description || '' })
                .substr(0, 100),
              className: `${$.a.k}_text`,
            },
          }),
        );
      },
      // render a pin or board create error
      fail: (o) => {
        // rig up the Fail message
        $.f.set({
          el: $.s.failButtonHelp,
          att: 'cmd',
          string: o.buttonHelpCmd,
        });
        $.s.failButtonClose.innerText = o.buttonClose;
        $.s.failButtonHelp.innerText = o.buttonHelp;
        $.s.failMsg.innerText = o.failMsg;
        $.s.failBody.innerText = o.failBody;
        $.s.main.className = $.s.main.className + ' ' + $.a.k + '_hazFail';
      },
      // create a list item for pickers
      makePickerItem: (o) => {
        // requires: title, boardId
        // optional: sectionId, hazSections
        let li,
          info,
          cover,
          a,
          i,
          id,
          helpers,
          helpersFound,
          className = undefined;
        // have we just made a new section
        if (o['type'] === 'board_section') {
          // munge the ID
          o.sectionId = o.id;
          o.boardId = o.board.id;
        } else {
          if (!o.boardId) {
            if (o.board && o.board.id) {
              o.boardId = o.board.id;
            } else {
              o.boardId = o.id;
            }
          }
        }
        if (o.sectionId) {
          id = 'section_' + o.sectionId;
          className = $.a.k + '_section';
        } else {
          id = 'board_' + o.boardId;
          className = $.a.k + '_board';
        }
        li = $.f.make({
          LI: {
            id: id,
            pid: id,
            className: className,
          },
        });
        if (o['type'] === 'board') {
          cover = $.f.make({
            SPAN: {
              className: $.a.k + '_cover',
            },
          });
          if (o.image_cover_url) {
            // we have the image cover URL
            cover.style.backgroundImage = 'url(' + o.image_cover_url + ')';
          } else {
            if (o.image_thumbnail_url) {
              cover.style.backgroundImage =
                'url(' + o.image_thumbnail_url.replace(/^http:\/\//, 'https://s-') + ')';
            }
          }
          li.appendChild(cover);
        }
        // the board or section title
        info = $.f.make({
          SPAN: {
            className: $.a.k + '_info',
            innerText: o.name || o.title,
          },
        });
        li.appendChild(info);
        helpersFound = 0;
        helpers = $.f.make({
          SPAN: {
            className: `${$.a.k}_helpers`,
          },
        });
        if (o.privacy === 'secret') {
          helpersFound++;
          helpers.appendChild(
            $.f.make({
              SPAN: {
                className: `${$.a.k}_icon ${$.a.k}_secret`,
              },
            }),
          );
        }
        if (o.is_collaborative === true) {
          helpersFound++;
          helpers.appendChild(
            $.f.make({
              SPAN: {
                className: `${$.a.k}_icon ${$.a.k}_collaborative`,
              },
            }),
          );
        }
        if (o.section_count) {
          helpersFound++;
          helpers.appendChild(
            $.f.make({
              SPAN: {
                className: `${$.a.k}_icon ${$.a.k}_sectionArrow`,
              },
            }),
          );
        }
        if (helpersFound) {
          li.appendChild(helpers);
          info.className = `${info.className} ${$.a.k}_helpers_${helpersFound}`;
        }
        // the visible thing that says save
        i = $.f.make({
          I: {
            innerText: $.v.msg.saveAction,
            className: $.a.k + '_button ' + $.a.k + '_save',
          },
        });
        if (o.section_count) {
          $.f.changeClass({ el: i, add: 'itemHazSections' });
        } else {
          $.f.changeClass({ el: li, add: 'canHazSave' });
        }
        li.appendChild(i);
        // the clickable mask
        a = $.f.make({
          A: {
            className: $.a.k + '_mask',
            board: o.boardId,
          },
        });
        a.dataset.savedTo = o.name || o.title;
        a.dataset.title = a.dataset.savedTo.toLowerCase();
        if (o.section_count) {
          a.dataset.cmd = 'fetchSections';
        } else {
          // this is a section
          if (o.sectionId) {
            a.dataset.section = o.sectionId;
          }
          a.dataset.cmd = 'save';
        }
        if (o.test) {
          // force pin to fail because of bad section
          if (o.test.failSection) {
            a.dataset.section = 'NO_SUCH_SECTION';
          }
          // force pin to fail because of bad board
          if (o.test.failBoard) {
            a.dataset.section = 'NO_SUCH_BOARD';
          }
          // force pin to fail because of no URL
          if (o.test.failPin) {
            delete $.v.data[0].url;
          }
        }
        li.appendChild(a);
        return li;
      },
      // fulfill requests made by the background process
      act: {
        // background sends back a list of sections and the selected board
        renderSectionsWin: (r) => {
          let i, li, parent, mask;
          if (r.data && r.data.sections.length) {
            // sort sections by title
            r.data.sections = r.data.sections.sort((a, b) => {
              if (a.title.toLowerCase() > b.title.toLowerCase()) return -1;
              if (a.title.toLowerCase() < b.title.toLowerCase()) return 1;
              return 0;
            });
            // change mask command to showSections
            parent = $.d.getElementById('board_' + r.data.data.board);
            mask = parent.getElementsByTagName('A')[0];
            mask.dataset.cmd = 'showSections';
            $.v.board[r.data.data.board].sections = r.data.sections;
            // render our sections
            for (i = 0; i < r.data.sections.length; i = i + 1) {
              li = $.f.makePickerItem({
                name: r.data.sections[i].title,
                sectionId: r.data.sections[i].id,
                boardId: r.data.sections[i].board.id,
                // uncomment to fail section pin
                // test: { failSection: true },
                isSection: true,
              });
              $.s.pickerAll.insertBefore(li, parent.nextSibling);
            }
            $.f.runCmd(mask);
            // if the same board is in pickerTop, fix its mask cmd too
            li = $.s.pickerTop.getElementsByTagName('LI');
            for (i = 0; i < li.length; i = i + 1) {
              if (li[i].dataset.pid === 'board_' + r.data.data.board) {
                mask = li[i].getElementsByTagName('A')[0];
                mask.dataset.cmd = 'showSections';
                break;
              }
            }
          }
        },
        // background sends a note saying it couldn't get sections for the selected board
        renderSectionsFail: (o) => {
          $.f.fail({
            buttonClose: $.v.msg.msgClose,
            buttonHelp: $.v.msg.msgHelp,
            buttonHelpCmd: 'getSaveHelp',
            failMsg: o.data.message || $.v.msg.msgOops,
            failBody: o.data.message_detail || $.v.msg.msgBoardFail,
          });
        },
        // show pin create results
        newPinWin: (result) => {
          // We are about to display the pin create success overlay, we should send it to be logged
          $.f.send({
            to: 'background',
            act: 'contextLog',
            data: {
              eventType: 'VIEW',
              viewType: 'PIN_CREATE_SUCCESS',
              auxData: {
                url: $.v.data[0].funnel_url,
                funnel_uuid: $.v.data[0].funnel_uuid,
              },
            },
          });

          let frag, splitMsg;
          // default Close button
          $.s.feedbackButtonClose.innerText = $.v.msg.msgClose;
          $.s.thumb.className = `${$.s.thumb.className}`;

          if (result.total > 1) {
            const numColumns = 3;
            // Add the pin preview to the correct feedback column in round robin fashion
            if (result.pin.media) {
              img = $.f.make({
                IMG: {
                  className: $.a.k + '_feedbackImage',
                  src: result.pin.media,
                },
              });
              $.d.getElementById('col_' + ($.v.savedPins % numColumns)).appendChild(img);
            }
            $.s.feedbackButtonSeeItNow.innerText = $.v.msg.msgSeeOnPinterest;
          } else {
            $.s.feedbackBody.textContent = '';
            frag = $.d.createDocumentFragment();
            frag.appendChild($.s.thumb.cloneNode(true));
            $.s.feedbackBody.appendChild(frag);

            $.s.feedbackButtonSeeItNow.innerText = $.v.msg.msgSeeItNow;
          }

          $.v.savedPins++;
          // to open later
          $.v.newPinId = result.data.id;

          // partners see a Promote Your Pin button instead of Close
          let myPromoButton = result.data.promote_button || {};
          // do we have a link and text?
          if (myPromoButton.show_promote_button && myPromoButton.promote_button_destination) {
            $.s.feedbackButtonClose.innerText = $.v.msg.msgPromoteYourPin;
            $.s.feedbackButtonClose.dataset.cmd = 'closeOverlayOpenNewPage';
            $.s.feedbackButtonClose.dataset.url = myPromoButton.promote_button_destination;
          }
          // we set $.v.boardName when we make the pin OR make the board
          if (result.data.title) {
            $.s.feedbackMsg.innerText = $.f.clean({
              str: $.v.msg.msgPinSavedTo.replace('%', `${result.data.title}`),
            });
          } else {
            $.s.feedbackMsg.innerText = $.f.clean({
              str: $.v.msg.msgPinSavedTo.replace('%', `${$.v.savedTo}`),
            });
          }

          const seeItNowUrl =
            result.total > 1
              ? `https://${$.v.ctrl.server.www}${$.v.ctrl.server.domain}${
                  $.v.board[result.data.board.id].url
                }`
              : `https://${$.v.ctrl.server.www}${$.v.ctrl.server.domain}/pin/${$.v.newPinId}/`;
          $.s.feedbackButtonSeeItNow.dataset.url = seeItNowUrl;

          // only show the feedback window after all pins have been saved
          if ($.v.savedPins === result.total) {
            if ($.v.button) {
              $.v.button.className = `${$.v.button.className} ${$.a.k}_checked`;
            }
            //close feedback after 5 seconds
            $.w.setTimeout(() => {
              $.f.send({
                to: 'background',
                act: 'closeCreate',
              });
            }, $.a.delay.afterPinCreate + $.a.delay.afterPinResults);

            // wait a bit so we see our checked button
            $.w.setTimeout(() => {
              $.s.main.className = `${$.s.main.className} ${$.a.k}_hazFeedback`;
            }, $.a.delay.afterPinResults);
          }
        },
        // save to the new section we just made
        newSectionWin: (o) => {
          $.f.debug('New section results');
          $.f.debug(o);
          let newSection = $.f.makePickerItem(o.data);
          $.v.sectionParentBoard.parentNode.insertBefore(
            newSection,
            $.v.sectionParentBoard.nextElementSibling,
          );
          $.f.itemSelect(newSection);
          $.f.cmd.save(newSection.lastChild);
          // freeze selector
          $.v.hazSelectBlock = true;
        },
        // save to the new section we just made
        newBoardWin: (o) => {
          $.f.debug('New board results');
          $.f.debug(o);
          $.v.board[o.data.id] = o.data;
          let newBoard = $.f.makePickerItem(o.data);
          $.f.hide($.s.pickerTop);
          let li = $.s.pickerAll.getElementsByTagName('LI');
          if (!li[0]) {
            $.s.pickerAll.appendChild(newBoard);
          } else {
            $.s.pickerAll.insertBefore(newBoard, li[0]);
          }
          $.f.itemSelect(newBoard);
          $.f.cmd.save(newBoard.lastChild);
          // freeze selector
          $.v.hazSelectBlock = true;
        },
        // show board error
        newBoardFail: (o) => {
          $.f.fail({
            buttonClose: $.v.msg.msgClose,
            buttonHelp: $.v.msg.msgHelp,
            buttonHelpCmd: 'getSaveHelp',
            failMsg: o.data.message || $.v.msg.msgOops,
            failBody: o.data.message_detail || $.v.msg.msgBoardFail,
          });
        },
        // show pin error
        newPinFail: (o) => {
          $.f.fail({
            buttonClose: $.v.msg.msgClose,
            buttonHelp: $.v.msg.msgHelp,
            buttonHelpCmd: 'getSaveHelp',
            failMsg: o.data.message || $.v.msg.msgOops,
            failBody: o.data.message_detail || $.v.msg.msgPinFail,
          });
          // patch until next background update ships
          let image = $.v.data[0].media;
          if (!image) {
            image = 'unknown';
          }
        },
        // show section error
        newSectionFail: (o) => {
          $.f.fail({
            buttonClose: $.v.msg.msgClose,
            buttonHelp: $.v.msg.msgHelp,
            buttonHelpCmd: 'getSaveHelp',
            failMsg: o.data.message || $.v.msg.msgOops,
            failBody: o.data.message_detail || $.v.msg.msgPinFail,
          });
        },

        // follow has succeeded
        followResults: (o) => {
          //  show the checkmark in the follow button
          $.f.changeClass({
            el: $.s.followButton,
            add: 'checked',
            remove: 'active',
          });
          // log the view
          $.f.send({
            to: 'background',
            act: 'contextLog',
            data: {
              eventType: 'VIEW',
              viewType: 'FOLLOW_FROM_SAVE_SUCCESS',
            },
          });
          // close after 1 second
          $.w.setTimeout(() => {
            $.f.cmd.closeFollowNag();
          }, 1000);
        },
        // render the follow nag if we have enough data
        renderFollowNag: (input) => {
          // do we have all the data we need?
          if ((((input.data || {}).output || {}).response || {}).data) {
            // pinner = an alias to a complex object
            let pinner = input.data.output.response.data;
            // no need to build or log if we are already following or blocking this creator
            if (!pinner.followed_by_me && !pinner.blocked_by_me) {
              // log the view of the follow nag
              $.f.send({
                to: 'background',
                act: 'contextLog',
                data: {
                  eventType: 'VIEW',
                  viewType: 'FOLLOW_FROM_SAVE',
                },
              });
              // add pinner avatar
              $.s.followAvatar.style.backgroundImage = 'url("' + pinner.image_medium_url + '")';
              // add pinner name
              $.s.followName.innerText = pinner.full_name;
              // add pinner description
              $.s.followAbout.innerText = pinner.about;
              // add the pinner ID to the follow button
              $.f.set({
                el: $.s.followButton,
                att: 'pinner_id',
                string: pinner.id,
              });
              // hide the description block
              $.s.description.style.display = 'none';
              // show the updated UI element
              $.s.followNag.style.display = 'block';
              // alter layout to preview to provide room for follow nag
              $.f.changeClass({ el: $.s.preview, add: 'hazFollowNag' });
            } else {
              $.f.debug('Following  or blocking ' + pinner.full_name + '; ignoring.');
            }
          } else {
            $.f.debug('Did not get pinner details; ignoring.');
          }
        },

        renderBoards: (o) => {
          if (typeof o.data.boards === 'undefined') {
            // we need to close due to new login without page refresh; next time we open we'll have boards
            $.f.cmd.close();
          } else {
            $.f.hide([$.s.topChoices, $.s.pickerTop, $.s.allBoards, $.s.pickerAll]);
            $.f.changeClass({ el: $.s.main, remove: 'loading' });
            $.f.show($.s.where);

            $.v.boardNames = [];
            $.v.board = {};
            $.s.items = [];

            // uncomment to test: less than three boards, no boards
            // o.data.boards = [o.data.boards[0]];
            // o.data.boards = null;
            $.s.hd.innerText = $.v.msg.chooseBoard;
            if (o.data.boards && o.data.boards.length) {
              // dump boards to a central source of knowledge
              for (i = 0; i < o.data.boards.length; i = i + 1) {
                $.v.board[o.data.boards[i].id] = o.data.boards[i];
              }
              // sort boards by timestamp
              o.data.boards.sort((a, b) => {
                if (a.ts > b.ts) return -1;
                if (a.ts < b.ts) return 1;
                return 0;
              });
              if (o.data.boards.length > 3) {
                // show top choices (recently pinned) and all boards
                $.f.show([$.s.topChoices, $.s.pickerTop, $.s.allBoards, $.s.pickerAll]);
                // show most recent boards
                for (i = 0; i < 3; i = i + 1) {
                  li = $.f.makePickerItem(o.data.boards[i]);
                  li.id = '';
                  $.s.pickerTop.appendChild(li);
                  if (!i) {
                    $.f.itemSelect(li);
                  }
                  $.s.items.push(li);
                }
                // sort by name
                o.data.boards.sort((a, b) => {
                  if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                  if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                  return 0;
                });
                for (i = 0; i < o.data.boards.length; i = i + 1) {
                  $.v.boardNames.push(o.data.boards[i].name.toLowerCase());
                  li = $.f.makePickerItem(o.data.boards[i]);
                  $.s.pickerAll.appendChild(li);
                  $.s.items.push(li);
                }
              } else {
                // since there are less than 4, just show all boards
                $.f.show([$.s.allBoards, $.s.pickerAll]);
                for (i = 0; i < o.data.boards.length; i = i + 1) {
                  $.v.boardNames.push(o.data.boards[i].name.toLowerCase());
                  // uncomment to test board fail message
                  // o.data.boards[i].test = { failBoard: true };
                  li = $.f.makePickerItem(o.data.boards[i]);
                  $.s.pickerAll.appendChild(li);
                  if (!i) {
                    $.f.itemSelect(li);
                  }
                  $.s.items.push(li);
                }
              }
              $.v.filterable = $.s.items;
            } else {
              // we have no boards, so jump straight to the board create form, and don't let them out
              $.s.allBoards.textContent = '';
              $.f.hide($.s.closeAddForm);
              $.f.runCmd($.s.outerAddFormOpener);
            }

            $.s.filter.focus();
            $.f.filter();
          }
        },
        // populate the pin create form
        populateCreateForm: (o) => {
          const renderCreateForm = () => {
            $.v.timeCheck = o.timeCheck;
            $.v.data = o.data;
            // by default create.js always displays a "chooseBoard" / board picker section
            $.v.mode = 'chooseBoard';
            $.f.renderPreview($.v.data);
            $.s.main.style.display = 'block';

            $.f.send({
              // see if this domain belongs to someone we could follow -- results will call $.f.act.renderFollowNag
              act: 'getDomainOwner',
              data: {
                domain: $.v.data[0].url.split('/')[2],
              },
            });

            // render pin create
            $.s.description.value =
              $.f.clean({ str: $.v.data[0].description.substr(0, 500) }) || '';
            $.f.changeClass({ el: $.s.description, add: 'visible' });

            // log the view of the board picker
            $.f.send({
              to: 'background',
              act: 'contextLog',
              data: {
                eventType: 'VIEW',
                viewType: 'BOARD_PICKER',
                auxData: {
                  url: $.v.data[0].funnel_url,
                  funnel_uuid: $.v.data[0].funnel_uuid,
                },
              },
            });
          };

          // we have data but we might not have structure ready to show yet
          const waitForCreateForm = function () {
            if ($.s.main) {
              renderCreateForm();
            } else {
              $.f.debug('Data arrived before structure was ready, trying again in a bit.');
              $.w.setTimeout(waitForCreateForm, 10);
            }
          };

          waitForCreateForm();
        },
      },
      // show an element or elements
      show: (el) => {
        $.f.changeClass({ el: el, remove: 'hidden' });
      },
      // hide an element or elements
      hide: (el) => {
        $.f.changeClass({ el: el, add: 'hidden' });
      },
      // highlight selected item and scroll to it
      itemSelect: (el, shouldScroll) => {
        if (!$.v.hazSelectBlock) {
          $.f.changeClass({ el: $.v.selectedItem, remove: 'selected' });
          $.f.changeClass({ el: el, add: 'selected' });
          $.v.selectedItem = el;
          if (shouldScroll) {
            $.v.selectedItem.scrollIntoView(false);
          }
        }
      },
      // watch the input box and do the right thing
      filter: () => {
        let fv, re, i, title, select, firstVisibleItem, dupeCheck;
        if (!$.v.hazSelectBlock) {
          // don't run any of this if we are in the process of saving a new board, section, or pin
          $.s.filter.disabled = false;
          fv = $.s.filter.value.trim();
          re = new RegExp(fv, 'i');
          dupeCheck = () => {
            let data,
              mustNotMatch = [],
              hazDupe = false;
            if ($.v.sectionParentBoard) {
              // we're adding a section
              data = $.v.board[$.v.sectionParentBoard.dataset.pid.split('_')[1]];
              mustNotMatch.push(data.name.toLowerCase());
              for (i = 0; i < data.sections.length; i = i + 1) {
                mustNotMatch.push(data.sections[i].title.toLowerCase());
              }
            } else {
              // we're adding a board
              for (i = 0; i < $.v.boardNames.length; i = i + 1) {
                mustNotMatch.push($.v.boardNames[i]);
              }
            }
            if (mustNotMatch.filter((item) => item === fv.toLowerCase()).length) {
              hazDupe = true;
            }
            return hazDupe;
          };
          if (fv !== $.v.lastFilterValue) {
            if (fv) {
              // filter has value
              if ($.v.adding) {
                // if the value we enter here matches the value of any
                // board name or section name, disable the add button
                if (dupeCheck()) {
                  $.f.changeClass({ el: $.s.submitAddForm, add: 'disabled' });
                  $.s.submitAddForm.dataset.disabled = 'disabled';
                } else {
                  $.f.changeClass({
                    el: $.s.submitAddForm,
                    remove: 'disabled',
                  });
                  $.s.submitAddForm.dataset.disabled = '';
                }
              } else {
                $.f.hide([$.s.topChoices, $.s.pickerTop, $.s.allBoards]);
                // show inner form opener
                if (dupeCheck()) {
                  $.f.hide($.s.innerAddFormOpener);
                } else {
                  $.f.show($.s.innerAddFormOpener);
                }
                $.s.innerAddFormOpener.innerText = `${$.v.msg.submitAddForm} ${$.s.filter.value}`;
                $.f.hide($.s.outerAddFormOpener);
                // show filtered items
                for (i = 0; i < $.v.filterable.length; i = i + 1) {
                  title = $.v.filterable[i].lastChild.dataset.title;
                  if (title.match(re)) {
                    $.f.changeClass({
                      el: $.v.filterable[i],
                      remove: 'filtered',
                    });
                    if (!firstVisibleItem) {
                      firstVisibleItem = $.v.filterable[i];
                    }
                    if (fv === title) {
                      // that's a duplicate; don't show form opener
                      $.f.hide($.s.innerAddFormOpener);
                    }
                  } else {
                    $.f.changeClass({ el: $.v.filterable[i], add: 'filtered' });
                  }
                }
                if (firstVisibleItem) {
                  $.f.itemSelect(firstVisibleItem, true);
                } else {
                  $.v.selectedItem = null;
                }
              }
            } else {
              // no filter value; disable the button in the add form
              $.f.changeClass({ el: $.s.submitAddForm, add: 'disabled' });
              $.s.submitAddForm.dataset.disabled = 'disabled';
              $.f.hide($.s.innerAddFormOpener);
              $.f.show([$.s.outerAddFormOpener]);
              if (!$.v.sectionParentBoard) {
                // exiting board search
                $.f.show($.s.allBoards);
                if ($.v.boardNames.length > 3) {
                  $.f.show([$.s.topChoices, $.s.pickerTop]);
                }
              } else {
                // exiting section search
                $.f.show($.v.sectionParentBoard);
              }
              $.f.changeClass({ el: $.v.filterable, remove: 'filtered' });
            }
            $.v.lastFilterValue = fv;
          }
        } else {
          $.s.filter.disabled = true;
        }
        $.w.setTimeout($.f.filter, 100);
      },
      // start here
      init: () => {
        $.d.b = $.d.getElementsByTagName('BODY')[0];
        // don't do anything if you can't find document.body
        if ($.d.b) {
          // don't allow right-click menus unless we are in debug mode
          if (!$.v.debug) {
            $.d.addEventListener('contextmenu', (event) => event.preventDefault());
          }
          // we'll add CSS to document.head
          $.d.h = $.d.getElementsByTagName('HEAD')[0];
          // build stylesheets
          $.f.presentation({ obj: $.a.styles });
          // listen for clicks, keystrokes, and mouseover
          $.d.b.addEventListener('click', $.f.click);
          $.d.addEventListener('keydown', $.f.keydown);
          $.d.addEventListener('mouseover', $.f.mouseover);
          $.d.addEventListener('mousemove', $.f.mousemove);
          $.w.setTimeout(() => {
            // build structure
            $.f.buildOne({ obj: $.a.structure, el: $.d.b });
          }, 10);
        }
      },
    },
  });
  $.w.addEventListener('load', () => {
    // if an incoming message from script is for us and triggers a valid function, run it
    $.b.runtime.onMessage.addListener((r) => {
      if (r.to && r.to === $.a.me) {
        $.f.debug(r);
        if (r.act && typeof $.f.act[r.act] === 'function') {
          $.f.act[r.act](r);
        }
      }
    });
    // load messages and debug flag, then init
    $.b.storage.local.get(['ctrl', 'debug', 'msg'], ({ ctrl, debug, msg }) => {
      $.v.ctrl = ctrl;
      $.v.debug = debug;
      $.v.msg = msg.create;
      $.f.init();
    });
  });
})(window, document, {
  k: 'CREATE',
  me: 'create',
  delay: {
    afterPinResults: 1000,
    afterPinCreate: 5000,
  },
  url: {
    helpSaving: 'https://help.pinterest.com/articles/trouble-pinterest-browser-button',
  },
  values: {
    scaledHeight: 300,
  },
  dataAttributePrefix: 'data-',
  // our structure
  structure: {
    main: {
      addClass: 'loading',
      preview: {
        followNag: {
          followAvatar: {},
          followName: {},
          followAbout: {},
          followButton: {
            addClass: 'button follow',
            cmd: 'submitFollow',
          },
        },
        thumb: {
          imagelessSite: {},
          imagelessText: {},
        },
        description: {
          tag: 'textarea',
        },
      },
      where: {
        x: {
          cmd: 'close',
        },
        hd: {},
        filter: {
          tag: 'input',
          addClass: 'search',
        },
        pickerContainer: {
          topChoices: {
            addClass: 'divider',
          },
          pickerTop: {
            tag: 'ul',
          },
          allBoards: {
            addClass: 'divider',
          },
          pickerAll: {
            tag: 'ul',
          },
          innerAddFormOpener: {
            addClass: 'addFormOpener hidden',
            cmd: 'openAddForm',
            via: 'board',
          },
        },
        outerAddFormOpener: {
          addClass: 'addFormOpener',
          cmd: 'openAddForm',
          via: 'board',
        },
        addForm: {
          addClass: 'hidden',
          addFormSecretContainer: {
            addFormSecretLabel: {
              tag: 'label',
              addFormSecret: {
                tag: 'input',
                type: 'checkbox',
              },
              toggle: {
                knob: {},
                optNo: {},
                optYes: {},
              },
            },
          },
          addFormFt: {
            closeAddForm: {
              addClass: 'button cancel',
              cmd: 'closeAddForm',
            },
            submitAddForm: {
              addClass: 'button create',
              cmd: 'submitAddForm',
            },
          },
        },
      },
      fail: {
        failHeader: {
          failMsg: {},
          x: {
            cmd: 'close',
          },
        },
        failBody: {},
        failFooter: {
          failButtonHelp: {
            addClass: 'button cancel',
            cmd: 'getSaveHelp',
          },
          failButtonClose: {
            addClass: 'button create',
            cmd: 'close',
          },
        },
      },
      feedback: {
        feedbackHeader: {
          feedbackMsg: {
            // API message (hopefully "pin created successfully")
          },
          feedbackClose: {
            addClass: 'x',
            cmd: 'close',
          },
        },
        feedbackBody: {
          // column based layout similar to grid
          first: {
            addClass: 'feedbackColumn',
            id: 'col_0',
          },
          second: {
            addClass: 'feedbackColumn',
            id: 'col_1',
          },
          third: {
            addClass: 'feedbackColumn',
            id: 'col_2',
          },
        },
        feedbackFooter: {
          // buttons (see it now, close)
          feedbackButtonClose: {
            addClass: 'button cancel',
            cmd: 'close',
          },
          feedbackButtonSeeItNow: {
            addClass: 'button seeItNow',
            cmd: 'closeOverlayOpenNewPage',
          },
        },
      },
    },
  },
  // a SASS-like object to be turned into stylesheets
  styles: {
    body: {
      height: '100%',
      width: '100%',
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(0, 0, 0, .7)',
      color: '#555',
      'font-family':
        '"Helvetica Neue", Helvetica, "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", メイリオ, Meiryo, "ＭＳ Ｐゴシック", arial, sans-serif',
      '%prefix%font-smoothing': 'antialiased',
      '-moz-osx-font-smoothing': 'grayscale',
    },
    '*': {
      '%prefix%box-sizing': 'border-box',
    },
    '._main': {
      position: 'absolute',
      top: '50%',
      left: '50%',
      'margin-left': '-412px',
      'margin-top': '-270px',
      width: '825px',
      height: '540px',
      'border-radius': '26px',
      background: '#fff',
      overflow: 'hidden',
      display: 'none',
      '&._loading': {
        background:
          // why yes, this is an animated SVG image
          "#fff url('data:image/svg+xml;base64,PHN2ZwogICAgICAgIHZlcnNpb249IjEuMSIKICAgICAgICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgICAgICAgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiCiAgICAgICAgaGVpZ2h0PSI0MCIKICAgICAgICB3aWR0aD0iNDAiCiAgICAgICAgdmlld0JveD0iMCAwIDI0IDI0IgogICAgICA+CiAgICAgICAgPGc+CiAgICAgICAgICA8cGF0aAogICAgICAgICAgICBmaWxsPSIjYWFhIgogICAgICAgICAgICBkPSJNMTUgMTAuNWMtLjgzIDAtMS41LS42Ny0xLjUtMS41cy42Ny0xLjUgMS41LTEuNSAxLjUuNjcgMS41IDEuNS0uNjcgMS41LTEuNSAxLjVtMCA2Yy0uODMgMC0xLjUtLjY3LTEuNS0xLjVzLjY3LTEuNSAxLjUtMS41IDEuNS42NyAxLjUgMS41LS42NyAxLjUtMS41IDEuNW0tNi02Yy0uODMgMC0xLjUtLjY3LTEuNS0xLjVTOC4xNyA3LjUgOSA3LjVzMS41LjY3IDEuNSAxLjUtLjY3IDEuNS0xLjUgMS41bTAgNmMtLjgzIDAtMS41LS42Ny0xLjUtMS41cy42Ny0xLjUgMS41LTEuNSAxLjUuNjcgMS41IDEuNS0uNjcgMS41LTEuNSAxLjVNMTIgMEM1LjM3IDAgMCA1LjM3IDAgMTJzNS4zNyAxMiAxMiAxMiAxMi01LjM3IDEyLTEyUzE4LjYzIDAgMTIgMCIKICAgICAgICAgID48L3BhdGg+CiAgICAgICAgICA8YW5pbWF0ZVRyYW5zZm9ybQogICAgICAgICAgICBhdHRyaWJ1dGVUeXBlPSJ4bWwiCiAgICAgICAgICAgIGF0dHJpYnV0ZU5hbWU9InRyYW5zZm9ybSIKICAgICAgICAgICAgdHlwZT0icm90YXRlIgogICAgICAgICAgICBmcm9tPSIwIDEyIDEyIgogICAgICAgICAgICB0bz0iMzYwIDEyIDEyIgogICAgICAgICAgICBkdXI9IjEuMnMiCiAgICAgICAgICAgIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIgogICAgICAgICAgLz4KICAgICAgICA8L2c+CiAgICAgIDwvc3ZnPgoK') 75% 50% no-repeat",
      },
      '._preview': {
        height: '540px',
        'border-right': '1px solid #eaeaea',
        width: '330px',
        background: '#fff',
        display: 'grid',
        'flex-direction': 'column',
        'align-content': 'center',
        'align-items': 'center',
        '._description': {
          'font-family':
            '"Helvetica Neue", Helvetica, "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", メイリオ, Meiryo, "ＭＳ Ｐゴシック", arial, sans-serif',
          'border-radius': '5px',
          padding: '10px',
          height: '100px',
          width: '237px',
          overflow: 'auto',
          border: 'none',
          outline: 'none',
          resize: 'none',
          'font-size': '13px',
          color: '#333',
          cursor: 'pointer',
          background: '#fff',
          display: 'none',
          margin: '0px auto',
          '&._visible': {
            background:
              '#fff url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pjxzdmcgd2lkdGg9IjE0cHgiIGhlaWdodD0iMTRweCIgdmlld0JveD0iMCAwIDI4IDI4IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxnIGZpbGw9IiNBQUEiPjxwYXRoIGQ9Ik0xOCw2TDIzLDExTDksMjVMMSwyOEw0LDIwWiIvPjxwYXRoIGQ9Ik0yMCw0TDI1LDlMMjcsN0ExLDEgMCAwIDAgMjIsMloiLz48L2c+PC9zdmc+) 217px 90% no-repeat',
          },
          '&:focus': {
            'background-image': 'none',
            cursor: 'text',
          },
          '&:hover': {
            'background-color': '#e7e7e7',
          },
        },
        '&._hazFollowNag': {
          'grid-template-rows': '200px 340px',
          '._thumb': {
            'margin-top': '0px',
            'padding-top': '0px',
            'max-height': '340px',
            'align-self': 'flex-start',
          },
        },
        '._followNag': {
          display: 'none',
          width: '237px',
          position: 'relative',
          'margin-top': '0px',
          'margin-left': 'auto',
          'margin-right': 'auto',
          '._followAvatar': {
            height: '75px',
            width: '75px',
            'border-radius': '50%',
            float: 'left',
            'box-shadow': '0 0 3px rgba(0, 0, 0, .33)',
            margin: '0 10px 10px 0',
            'background-size': 'cover',
          },
          '._followName': {
            display: 'block',
            'font-size': '16px',
            'font-weight': 'bold',
            'white-space': 'nowrap',
            'text-overflow': 'ellipsis',
            margin: '0 5px',
            overflow: 'hidden',
          },
          '._followAbout': {
            display: 'block',
            'font-size': '12px',
            'line-height': '1.2em',
            height: '4.8em',
            overflow: 'auto',
          },
          '._followButton': {
            clear: 'both',
          },
        },
        '._twoColumns': {
          'max-height': '540px',
          height: 'auto',
          width: '329px',
          display: 'flex',
          padding: '40px 30px 0 30px',
          'align-items': 'flex-start',
          'justify-content': 'space-between',
          'flex-direction': 'row',
          'overflow-y': 'auto',
          'overflow-x': 'hidden',
          background: '#fff',
          'border-radius': '0px',
          '._previewColumn': {
            width: '130px',
            '._previewImage': {
              'border-radius': '15px',
              'margin-bottom': '5px',
              width: '130px',
            },
          },
        },
      },
      '._feedback': {
        display: 'none',
        width: '825px',
        '._feedbackMsg': {
          display: 'block',
          'font-weight': 'bold',
          'font-size': '20px',
          height: '105px',
          margin: '0',
          padding: '40px',
          'border-bottom': 'none',
        },
        '._feedbackBody': {
          height: '320px',
          width: '825px',
          background: '#fff',
          display: 'flex',
          'align-items': 'flex-start',
          'justify-content': 'space-evenly',
          'flex-direction': 'row',
          padding: '0 50px',
          'overflow-y': 'auto',
          '._feedbackColumn': {
            display: 'inline-block',
            width: '225px',
            'vertical-align': 'top',
            'text-align': 'left',
            margin: '0 5px',
            '._feedbackImage': {
              'margin-bottom': '5px',
              'border-radius': '15px',
              display: 'block',
              width: '225px',
              background: '#eee',
              'vertical-align': 'top',
              overflow: 'hidden',
              background: '#fff',
              img: {
                'border-radius': '8px',
                width: '165px',
              },
            },
          },
          '._thumb': {
            top: '0',
            'align-self': 'center',
            '._imageless': {
              width: '225px',
              '._site': {
                'font-size': '10px',
              },
              '._text': {
                width: '185px',
                'line-height': '22px',
                'padding-right': '0px',
                'font-size': '16px',
              },
            },
          },
        },
        '._feedbackFooter': {
          display: 'flex',
          'justify-content': 'flex-end',
          'align-items': 'center',
          height: '115px',
          'border-top': 'none',
          position: 'absolute',
          width: '100%',
          bottom: '0',
          overflow: 'hidden',
          'background-color': 'white',
          '&_button': {
            cursor: 'pointer',
          },
        },
      },
      '._thumb': {
        transition: 'all .02s ease',
        'border-radius': '15px',
        display: 'block',
        width: '237px',
        height: '237px',
        background: '#555 url() 50% 50% no-repeat',
        'background-size': 'cover',
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
        '&._imageless': {
          '._site, ._text': {
            position: 'absolute',
            color: '#fff',
            'font-size': '22px',
            left: '20px',
          },
          '._site': {
            top: '20px',
            left: '20px',
            'font-size': '12px',
          },
          '._text': {
            width: '200px',
            'word-wrap': 'break-word',
            top: '38px',
            'line-height': '28px',
            'padding-right': '22px',
            'font-weight': 'bold',
            'letter-spacing': '-1px',
          },
        },
      },
      '._fail': {
        display: 'none',
        '._failHeader': {
          display: 'block',
          'font-weight': 'bold',
          'font-size': '20px',
          height: '65px',
          padding: '20px 20px 20px 20px',
          margin: '0',
          'border-bottom': '1px solid #e7e7e7',
        },
        '._failBody': {
          'font-size': '14px',
          'line-height': '20px',
          height: '95px',
          padding: '20px',
          display: 'block',
        },
        '._failFooter': {
          display: 'block',
          height: '55px',
          'border-top': '1px solid #e7e7e7',
          position: 'absolute',
          width: '100%',
          bottom: '0',
          overflow: 'hidden',
          '&_button': {
            display: 'block',
            cursor: 'pointer',
          },
        },
      },
      // show feedback
      '&._hazFeedback': {
        top: '50%',
        left: '50%',
        'margin-left': '-412px',
        'margin-top': '-270px',
        width: '825px',
        height: '540px',
        'border-radius': '26px',
        background: '#fff',
        overflow: 'hidden',
        '._preview, ._where': {
          display: 'none',
        },
        '._feedback': {
          display: 'block',
        },
      },
      // show error message
      '&._hazFail': {
        top: '50%',
        left: '50%',
        'margin-left': '-220px',
        'margin-top': '-90px',
        width: '380px',
        height: '210px',
        'border-radius': '26px',
        background: '#fff',
        overflow: 'hidden',
        '._button._create': {
          top: '10px',
          right: '20px',
        },
        '._button._cancel': {
          top: '10px',
          left: '20px',
        },
        '._preview, ._where, ._feedback': {
          display: 'none',
        },
        '._fail': {
          display: 'block',
        },
        '._failHeader': {
          height: '55px',
          padding: '20px 0 0 20px',
        },
        '._failFooter': {
          height: '65px',
          '._button._create, ._button._cancel': {
            top: '10px',
          },
        },
        '._x': {
          top: '20px',
          right: '20px',
        },
      },
      '._x': {
        position: 'absolute',
        top: '32px',
        right: '32px',
        cursor: 'pointer',
        height: '25px',
        width: '25px',
        opacity: '.5',
        // background defaults to X for 'cancel'
        background:
          'transparent url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgdmVyc2lvbj0iMS4xIiBoZWlnaHQ9IjE2IiB3aWR0aD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PHBhdGggZmlsbD0iIzg4OCIgZD0iTTggNS41MDZMMy4wMTUuNTJBMS43NjUgMS43NjUgMCAxIDAgLjUyMSAzLjAxNUw1LjUwNiA4IC41MiAxMi45ODVBMS43NjUgMS43NjUgMCAwIDAgMS43NjYgMTZhMS43NiAxLjc2IDAgMCAwIDEuMjQ4LS41Mkw4IDEwLjQ5M2w0Ljk4NSA0Ljk4NWExLjc2NyAxLjc2NyAwIDAgMCAyLjQ5OC4wMDQgMS43NjIgMS43NjIgMCAwIDAtLjAwNC0yLjQ5OEwxMC40OTQgOGw0Ljk4NS00Ljk4NWExLjc2NyAxLjc2NyAwIDAgMCAuMDA0LTIuNDk4IDEuNzYyIDEuNzYyIDAgMCAwLTIuNDk4LjAwNEw4IDUuNTA2eiI+PC9wYXRoPjwvc3ZnPgo=) 0 0 no-repeat',
        // change background to < for 'back'
        '&._back': {
          'background-image':
            'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgdmVyc2lvbj0iMS4xIiBoZWlnaHQ9IjE2IiB3aWR0aD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PHBhdGggZmlsbD0iIzg4OCIgZD0iTTIuNSA4LjAwMWw3Ljg0IDcuNDgxYTEuOTE0IDEuOTE0IDAgMCAwIDIuNjE4LjAwMyAxLjcwNSAxLjcwNSAwIDAgMC0uMDA0LTIuNDk3TDcuNzMgOC4wMDFsNS4yMjUtNC45ODZjLjcyNC0uNjkuNzI2LTEuODA5LjAwNC0yLjQ5N2ExLjkxIDEuOTEgMCAwIDAtMi42MTkuMDAzTDIuNSA4LjAwMXoiPjwvcGF0aD48L3N2Zz4K)',
        },
      },
      '._where': {
        position: 'absolute',
        top: '0',
        right: '0',
        width: '495px',
        height: '540px',
        color: '#444',
        'text-align': 'left',
        '%prefix%scrollbar': 'none',
        '._hd': {
          display: 'block',
          'font-weight': 'bold',
          'font-size': '18px',
          height: '65px',
          padding: '30px 20px 20px 40px',
          margin: '0',
        },
        '._filter': {
          'font-family':
            '"Helvetica Neue", Helvetica, "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", メイリオ, Meiryo, "ＭＳ Ｐゴシック", arial, sans-serif',
          width: '449px',
          'border-radius': '30px',
          padding: '13px',
          'background-color': '#f6f6f6',
          '-webkit-appearance': 'none',
          border: '1px solid #eaeaea',
          margin: '0 0 15px 20px',
          'font-size': '14px',
          'font-weight': 'bold',
          outline: 'none',
          display: 'block',
          '&._search': {
            'text-indent': '30px',
            'border-radius': '30px',
            background:
              '#f6f6f6 url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgdmVyc2lvbj0iMS4xIiBoZWlnaHQ9IjE2IiB3aWR0aD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PHBhdGggZmlsbD0iIzg4OCIgZD0iTTYuMTYyIDEwLjAzNWEzLjg3NyAzLjg3NyAwIDAgMS0zLjg3My0zLjg3M0EzLjg3NyAzLjg3NyAwIDAgMSA2LjE2MiAyLjI5YTMuODc3IDMuODc3IDAgMCAxIDMuODczIDMuODcyIDMuODc3IDMuODc3IDAgMCAxLTMuODczIDMuODczbTkuMzYzIDMuMTk2bC0zLjA4MS0zLjA4YTEuNjE0IDEuNjE0IDAgMCAwLTEuMjMtLjQ2OCA2LjEyNyA2LjEyNyAwIDAgMCAxLjExLTMuNTIxIDYuMTYyIDYuMTYyIDAgMSAwLTYuMTYyIDYuMTYyIDYuMTMgNi4xMyAwIDAgMCAzLjUyMS0xLjEwOWMtLjAyMi40NDIuMTMuODkxLjQ2NyAxLjIyOWwzLjA4MSAzLjA4MWMuMzE3LjMxNy43MzIuNDc1IDEuMTQ3LjQ3NWExLjYyMiAxLjYyMiAwIDAgMCAxLjE0Ny0yLjc2OSIgZmlsbC1ydWxlPSJldmVub2RkIj48L3BhdGg+PC9zdmc+) 12px 50% no-repeat',
          },
        },
        '._pickerContainer': {
          'border-top': '1px solid #eee',
          height: '340px',
          width: '495px',
          position: 'absolute',
          top: '125px',
          left: '0',
          overflow: 'auto',
          margin: '0',
          padding: '0',
          border: 'none',
          '._divider': {
            display: 'block',
            color: '#555',
            height: '30px',
            padding: '8px 0 8px 40px',
            'font-size': '14px',
          },
          '._allBoards': {
            height: '34px',
            padding: '16px 0 6px 40px',
          },
          ul: {
            margin: '0',
            padding: '0',
            li: {
              outline: 'none',
              'text-align': 'left',
              'list-style': 'none',
              margin: '0',
              height: '60px',
              padding: '6px 0 6px 40px',
              color: '#aaa',
              'background-color': 'transparent',
              position: 'relative',
              '&._board': {
                '._cover': {
                  background: '#555 url() 50% 50% no-repeat',
                  'background-size': 'cover',
                  display: 'inline-block',
                  height: '48px',
                  width: '48px',
                  'border-radius': '8px',
                  'box-shadow': '0 0 1px #eee inset',
                  'vertical-align': 'top',
                  'margin-right': '10px',
                },
              },
              '&._selected': {
                'background-color': '#eee',
                '._button': {
                  display: 'block',
                  '&._itemHazSections': {
                    display: 'none',
                  },
                },
                '&._canHazSave': {
                  '._button': {
                    display: 'block',
                  },
                },
              },
              '&._canHazSave': {
                '._helpers': {
                  '._icon': {
                    '&._sectionArrow': {
                      display: 'none',
                    },
                  },
                },
              },
              // contains text
              '._info': {
                display: 'inline-block',
                height: '46px',
                'line-height': '46px',
                'text-indent': '5px',
                'font-size': '16px',
                'font-weight': 'bold',
                width: '230px',
                color: '#555',
                overflow: 'hidden',
                'white-space': 'pre',
                'text-overflow': 'ellipsis',
                '&._helpers_1': {
                  width: '220px',
                },
                '&._helpers_2': {
                  width: '200px',
                },
                '&._helpers_3': {
                  width: '180px',
                },
              },
              // helpful icons: lock, collaborators, section
              '._helpers': {
                position: 'absolute',
                height: '46px',
                'line-height': '36px',
                right: '20px',
                '._icon': {
                  display: 'inline-block',
                  height: 'inherit',
                  background: 'transparent url() 50% 50% no-repeat',
                  'background-size': 'contain',
                  'margin-left': '8px',
                  '&._secret': {
                    width: '14px',
                    'background-image':
                      'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgdmVyc2lvbj0iMS4xIiBoZWlnaHQ9IjE0IiB3aWR0aD0iMTQiIHZpZXdCb3g9IjAgMCAxNiAxNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PHBhdGggZmlsbD0iIzg4OCIgZD0iTTEyLjggNi43OTFoLS4wNFY0LjU2NkMxMi43NiAyLjA0OCAxMC42MjUgMCA4IDBTMy4yNCAyLjA0OCAzLjI0IDQuNTY2djIuMjI1SDMuMmMtLjc3Ny45ODQtMS4yIDIuMi0xLjIgMy40NTRDMiAxMy40MjMgNC42ODYgMTYgOCAxNnM2LTIuNTc3IDYtNS43NTVjMC0xLjI1My0uNDIzLTIuNDctMS4yLTMuNDU0em0tMi4zNiAwSDUuNTZWNC41NjZjMC0xLjI5IDEuMDk1LTIuMzQgMi40NC0yLjM0czIuNDQgMS4wNSAyLjQ0IDIuMzR2Mi4yMjV6Ij48L3BhdGg+PC9zdmc+)',
                  },
                  '&._collaborative': {
                    width: '14px',
                    'background-image':
                      'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgdmVyc2lvbj0iMS4xIiBoZWlnaHQ9IjE0IiB3aWR0aD0iMTQiIHZpZXdCb3g9IjAgMCAxNiAxNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PHBhdGggZmlsbD0iIzg4OCIgZD0iTTkuMTQzIDEwLjJBNCA0IDAgMCAxIDE2IDEzdjFIMHYtMWE1IDUgMCAwIDEgOS4xNDMtMi44ek0xMiA4YTIgMiAwIDEgMCAuMDktMy45OTlBMiAyIDAgMCAwIDEyIDh6TTUgN2EyLjUgMi41IDAgMSAwIDAtNSAyLjUgMi41IDAgMCAwIDAgNXoiPjwvcGF0aD48L3N2Zz4=)',
                  },
                  '&._sectionArrow': {
                    width: '14px',
                    'background-image':
                      'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgdmVyc2lvbj0iMS4xIiBoZWlnaHQ9IjE2IiB3aWR0aD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PHBhdGggZmlsbD0iIzg4OCIgZD0iTTEzLjUgOGwtNy44NCA3LjQ4MWExLjkxNCAxLjkxNCAwIDAgMS0yLjYxOC4wMDMgMS43MDUgMS43MDUgMCAwIDEgLjAwNC0yLjQ5N0w4LjI3IDggMy4wNDYgMy4wMTVBMS43MDkgMS43MDkgMCAwIDEgMy4wNDIuNTE4IDEuOTEgMS45MSAwIDAgMSA1LjY2LjUyTDEzLjUgOHoiLz48L3N2Zz4=)',
                  },
                },
              },
              // click collector over entire line item
              '._mask': {
                position: 'absolute',
                top: '0',
                left: '0',
                bottom: '0',
                right: '0',
                height: '100%',
                width: '100%',
                cursor: 'pointer',
              },
            },
          },
        },
        // there are two add form openers, one inside the picker container and one outside, so this needs to live outside ._pickerContainer
        '._addFormOpener': {
          'font-size': '16px',
          'font-weight': 'bold',
          'text-indent': '85px',
          display: 'block',
          cursor: 'pointer',
          color: '#555',
          left: '0',
          width: '495px',
          height: '60px',
          'line-height': '60px',
          background:
            '#fff url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pjxzdmcgd2lkdGg9IjM2cHgiIGhlaWdodD0iMzZweCIgdmlld0JveD0iMCAwIDcyIDcyIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxnPjxjaXJjbGUgY3g9IjM2IiBjeT0iMzYiIHI9IjM2IiBmaWxsPSIjZTYwMDIzIi8+PHBhdGggZmlsbD0iI2ZmZmZmZiIgZD0iTTMyLDMyTDMyLDIwQTEsMSwwIDAgMSA0MCwyMEw0MCwzMkw1MywzMkExLDEsMCAwIDEgNTIsNDBMNDAsNDBMNDAsNTJBMSwxLDAgMCAxIDMyLDUyTDMyLDQwTDIwLDQwQTEsMSwwIDAgMSAyMCwzMloiLz48L2c+PC9zdmc+Cg==) 20px 50% no-repeat',
          '&._outerAddFormOpener': {
            position: 'absolute',
            bottom: '0',
            height: '75px',
            'line-height': '75px',
            'border-top': '1px solid #eee',
            'box-shadow': '0px -2px 10px -8px #000000',
            '&:hover': {
              'background-color': '#e7e7e7',
            },
          },
        },
        '._addForm': {
          height: '415px',
          width: '495px',
          position: 'absolute',
          top: '125px',
          left: '0',
          'z-index': '10',
          background: '#fff',
          '._addFormSecretLabel': {
            display: 'block',
            color: '#c2c2c2',
            'font-size': '11px',
            padding: '10px 0 10px 40px',
            'font-weight': 'normal',
            'text-transform': 'uppercase',
            'border-top': '1px solid #eee',
            width: '100%',
            cursor: 'pointer',
            'input[type=checkbox]': {
              display: 'block',
              height: '1px',
              margin: '7px 0 0 0',
              padding: '0',
              opacity: '.01',
              '&:checked': {
                '~ ._toggle': {
                  background: '#e60023',
                  '._knob': {
                    float: 'right',
                  },
                  '._optYes': {
                    display: 'block',
                  },
                  '._optNo': {
                    display: 'none',
                  },
                },
              },
            },
            // yes/no toggle with sliding knob
            '._toggle': {
              display: 'inline-block',
              position: 'relative',
              background: '#f8f8f8',
              'border-radius': '16px',
              border: '1px solid #eee',
              height: '32px',
              '._knob': {
                display: 'inline-block',
                margin: '0',
                padding: '0',
                background: '#fff',
                'border-radius': '16px',
                'box-shadow': '0 0 1px #eee',
                width: '30px',
                height: '30px',
              },
              '._optNo, ._optYes': {
                display: 'inline-block',
                'line-height': '30px',
                padding: '0 10px',
                'font-weight': 'bold',
              },
              '._optNo': {
                color: '#000',
                float: 'right',
              },
              '._optYes': {
                color: '#fff',
                float: 'left',
                display: 'none',
              },
            },
          },
          '._addFormFt': {
            position: 'absolute',
            bottom: '0',
            left: '0',
            height: '115px',
            width: '495px',
            'line-height': '115px',
          },
        },
      },
      '._button': {
        height: '44px',
        'line-height': '44px',
        'border-radius': '20px',
        'min-width': '80px',
        display: 'inline-block',
        'font-size': '16px',
        'font-weight': 'bold',
        'text-align': 'center',
        padding: '0 10px',
        cursor: 'pointer',
        'font-style': 'normal',
        '&._save': {
          'vertical-align': 'top',
          color: '#fff',
          background: '#e60023',
          padding: '0 10px',
          'margin-left': '20px',
          position: 'absolute',
          right: '40px',
          top: '10px',
          display: 'none',
          height: '40px',
          'line-height': '40px',
        },
        '&._create': {
          position: 'absolute',
          top: '36px',
          right: '40px',
          color: '#fff',
          'background-color': '#e60023',
          '&._disabled': {
            color: '#eee',
            'background-color': '#aaa',
            cursor: 'default',
          },
        },
        '&._seeItNow': {
          'margin-right': '40px',
          color: '#fff',
          'background-color': '#e60023',
          '&._disabled': {
            color: '#eee',
            'background-color': '#aaa',
            cursor: 'default',
          },
        },
        '&._follow': {
          display: 'block',
          color: '#fff',
          'background-color': '#e60023',
        },
        '&._cancel': {
          position: 'absolute',
          top: '36px',
          left: '40px',
          color: '#555',
          'background-color': '#f6f6f6',
          border: '1px solid #eaeaea',
        },
        '&._active': {
          color: 'transparent',
          background:
            '#e60023 url(data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIAoJeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiAKCXhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiAKCWhlaWdodD0iMzIiCgl3aWR0aD0iMzIiCgl2aWV3Qm94PSIwIDAgMTYgMTYiIAoJeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+Cgk8cGF0aCBmaWxsPSIjZmZmIiBkPSIKICAJTSA4LCAwCiAgICBBIC41LCAuNSwgMCwgMCwgMCwgOCwgMQogICAgQSA2LCA3LCAwLCAwLCAxLCAxNCwgOAogICAgQSA2LCA2LCAwLCAwLCAxLCA4LCAxNAogICAgQSA1LCA2LCAwLCAwLCAxLCAzLCA4CiAgICBBIDEsIDEsIDAsIDAsIDAsIDAsIDgKICAgIEEgOCwgOCwgMCwgMCwgMCwgOCwgMTYKICAgIEEgOCwgOCwgMCwgMCwgMCwgMTYsIDgKICAgIEEgOCwgOCwgMCwgMCwgMCwgOCwgMAogICAgWiIgPgogICAgPGFuaW1hdGVUcmFuc2Zvcm0KCQkJYXR0cmlidXRlVHlwZT0ieG1sIgoJCQlhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iCgkJCXR5cGU9InJvdGF0ZSIKCQkJZnJvbT0iMCA4IDgiCgkJCXRvPSIzNjAgOCA4IgoJCQlkdXI9IjAuNnMiCgkJCXJlcGVhdENvdW50PSJpbmRlZmluaXRlIgoJCS8+Cgk8L3BhdGg+Cjwvc3ZnPgo=) 50% 50% no-repeat',
          'background-size': '20px 20px',
        },
        '&._checked': {
          color: 'transparent',
          background:
            '#e60023 url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHdpZHRoPSIxN3B4IiBoZWlnaHQ9IjEzcHgiIHZpZXdCb3g9IjAgMCAxNyAxMyIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48Zz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMyw0TDcsOEwxNCwxQTEsMSAwIDAgMSAxNiwzTDcsMTJMMSw2QTEsMSAwIDAgMSAzLDRaIi8+PC9nPjwvc3ZnPg==) 50% 50% no-repeat',
        },
      },
      '._filtered, ._hidden': {
        display: 'none!important',
      },
    },
  },
});
