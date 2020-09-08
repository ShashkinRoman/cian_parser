/*
  OE-118: DRY out activating experiments from overlays
*/

((config) => {
  const $ = {
    // globals load from localStorage before we init
    global: {
      // keeps track of images selected by user
      selectedImages: [],
      enabledExperimentGroups: {
        browser_extension_image_deduplication_1: ['enabled', 'employees'],
      },
    },

    // pass in all the stuff in the big object at the bottom of this file
    config: config,

    // although window.chrome may exist in some non-Chrome browsers, we want to
    // try window.browser first because it has better support for promises
    browser: window.browser || window.chrome,

    // space for our HTML structure, which we will build on the fly
    structure: {},

    constant: {
      logging: {
        FUNNEL_UUID_ATTR: 'funnelId',
        FUNNEL_URL_ATTR: 'funnelUrl',
      },
    },

    // space for our business logic
    func: {
      // console.log to background window when DEBUG = true in background.js
      debug: (message) => {
        if ($.global.debug && message) {
          console.log(message);
        }
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
        // via and to are overwritten here; no need to send from outside this function
        sendMe.via = $.config.me;
        sendMe.to = 'background';
        $.func.debug('Sending message');
        $.func.debug(JSON.stringify(sendMe));
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
      open the pop-up pin create or repin create box
      {
        method: [h(default)|r|g],
        id: [pinId],
        description: [string],
        url: [page URL],
        media: [image URL]
      }
      */
      popCreate: (o) => {
        // what to log
        let logMe, dualScreenLeft, dualScreenTop, height, width, left, top, query;

        logMe = { event: 'click', xm: o.method };

        // get available width
        width = window.outerWidth
          ? window.outerWidth
          : window.defaultStatus.documentElement.clientWidth
          ? window.defaultStatus.documentElement.clientWidth
          : screen.width;

        // get available height
        height = window.outerHeight
          ? window.outerHeight
          : window.defaultStatus.documentElement.clientHeight
          ? window.defaultStatus.documentElement.clientHeight
          : screen.height;

        // deal with dual-screen edge case
        dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
        dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

        // position of pop-up window - try for center of screen
        left = (width - $.config.popup.width) / 2 + dualScreenLeft;
        top = (height - $.config.popup.height) / 2 + dualScreenTop;

        // default our method to hoverbutton if not found
        if (!o.method) {
          o.method = 'h';
        }

        // let's get ready to pin it!
        if (o.id) {
          // we are repinning, so insert the existing pin id into /pin/[id]/repin/x/
          query = $.global.endpoint.rePinCreate.replace(/%s/, o.id);
          // log the pin ID
          logMe.repin = o.id;
        } else {
          // we are making a new pin, so add the url, media, and other parameters
          query =
            $.global.endpoint.pinCreate +
            '?url=' +
            encodeURIComponent(o.url) +
            '&media=' +
            encodeURIComponent(o.media) +
            '&xm=' +
            o.method +
            '&xv=' +
            $.global.xv +
            '&xuid=' +
            $.global.xuid +
            '&description=' +
            encodeURIComponent(o.description);
        }

        // open pop-up window
        window.open(
          query,
          'pin' + Date.now(),
          'status=no,resizable=yes,scrollbars=yes,personalbar=no,directories=no,location=no,toolbar=no,menubar=no,height=' +
            $.config.popup.height +
            ',width=' +
            $.config.popup.width +
            ',left=' +
            left +
            ',top=' +
            top,
        );

        // log what we need to log
        $.func.log(logMe);
      },

      /*
      to close the overlay, the background process closes its iframe container
      {
        key: value to be logged
      }
      */
      close: (o) => {
        $.func.send({ act: 'closeGrid', data: o });
      },

      loadingSpinnerUI: {
        display: () => {
          $.structure.loadingMessage.innerText = $.global.msg.loadingMessage;
          $.structure.spinner.innerHTML = `
            <div>
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" 
                height="40" 
                width="40" 
                viewBox="0 0 24 24">
                <g>
                  <path 
                    fill="#767676" 
                    d="
                      M 15.00, 10.50 
                      C 14.17, 10.50 13.50,  9.83 13.50,  9.00 
                      C 13.50,  8.17 14.17,  7.50 15.00,  7.50 
                      C 15.83,  7.50 16.50,  8.17 16.50,  9.00 
                      C 16.50,  9.83 15.83, 10.50 15.00, 10.50 
                      M 15.00, 16.50 
                      C 14.17, 16.50 13.50, 15.83 13.50, 15.00 
                      C 13.50, 14.17 14.17, 13.50 15.00, 13.50 
                      C 15.83, 13.50 16.50, 14.17 16.50, 15.00 
                      C 16.50, 15.83 15.83, 16.50 15.00, 16.50 
                      M  9.00, 10.50 
                      C  8.17, 10.50  7.50,  9.83  7.50,  9.00 
                      C  7.50,  8.17  8.17,  7.50  9.00,  7.50 
                      C  9.83,  7.50 10.50,  8.17 10.50,  9.00 
                      C 10.50,  9.83  9.83, 10.50  9.00, 10.50 
                      M  9.00, 16.50 
                      C  8.17, 16.50  7.50, 15.83  7.50, 15.00 
                      C  7.50, 14.17  8.17, 13.50  9.00, 13.50 
                      C  9.83, 13.50 10.50, 14.17 10.50, 15.00 
                      C 10.50, 15.83  9.83, 16.50  9.00, 16.50 
                      M 12.00,  0.00
                      C  5.37,  0.00  0.00,  5.37  0.00, 12.00 
                      C  0.00, 18.63  5.37, 24.00 12.00, 24.00 
                      C 18.63, 24.00 24.00, 18.63 24.00, 12.00 
                      C 24.00,  5.37 18.63,  0.00 12.00,  0.00
                    ">  
                  </path>
                  <animateTransform
                    attributeType="XML"
                    attributeName="transform"
                    type="rotate"
                    from="0 12 12"
                    to="360 12 12"
                    dur="1.2s"
                    begin="0.3s"
                    repeatCount="indefinite" 
                  />
                </g>
              </svg>
            </div>`;
        },
        hide: () => {
          if ($.structure.loadingSpinnerContainer) {
            $.func.debug('Removing loading spinner');
            $.structure.loadingSpinnerContainer.remove();
            delete $.structure.loadingSpinnerContainer;
          }
        },
      },

      // experiment: browser_extension_image_deduplication_1
      nearDedupCheck: {
        /*
          Generates the perceptual fingerprint for the given image. Percetual hashes can be compared
          by calculating the hamming distance.
          Modified from https://github.com/naptha/phash.js/blob/master/phash.js.
        */
        pHash: (img) => {
          const size = 32,
            smallerSize = 8;

          const canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');

          /* 1. Reduce size.
           * Like Average Hash, pHash starts with a small image.
           * However, the image is larger than 8x8; 32x32 is a good size.
           * This is really done to simplify the DCT computation and not
           * because it is needed to reduce the high frequencies.
           */

          canvas.width = size;
          canvas.height = size;
          ctx.drawImage(img, 0, 0, size, size);
          let im;
          try {
            im = ctx.getImageData(0, 0, size, size);
          } catch (err) {
            // canvas is tainted with cross origin data
            // there is nothing we can do here, so just return null
            $.func.debug(err);
            return null;
          }

          /* 2. Reduce color.
           * The image is reduced to a grayscale just to further simplify
           * the number of computations.
           */

          const vals = new Float64Array(size * size);
          for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
              const base = 4 * (size * i + j);
              vals[size * i + j] =
                0.299 * im.data[base] + 0.587 * im.data[base + 1] + 0.114 * im.data[base + 2];
            }
          }

          /* 3. Compute the DCT.
           * The DCT separates the image into a collection of frequencies
           * and scalars. While JPEG uses an 8x8 DCT, this algorithm uses
           * a 32x32 DCT.
           */

          const applyDCT2 = (N, f) => {
            // initialize coefficients
            const c = new Float64Array(N);
            for (let i = 1; i < N; i++) c[i] = 1;
            c[0] = 1 / Math.sqrt(2);

            // output goes here
            const F = new Float64Array(N * N);

            // construct a lookup table, because it's O(n^4)
            const entries = 2 * N * (N - 1);
            const COS = new Float64Array(entries);
            for (let i = 0; i < entries; i++) COS[i] = Math.cos((i / (2 * N)) * Math.PI);

            // the core loop inside a loop inside a loop...
            for (let u = 0; u < N; u++) {
              for (let v = 0; v < N; v++) {
                let sum = 0;
                for (let i = 0; i < N; i++) {
                  for (let j = 0; j < N; j++) {
                    sum += c[i] * c[j] * COS[(2 * i + 1) * u] * COS[(2 * j + 1) * v] * f[N * i + j];
                  }
                }
                F[N * u + v] = sum * (2 / N);
              }
            }
            return F;
          };

          const dctVals = applyDCT2(size, vals);

          /* 4. Reduce the DCT.
           * While the DCT is 32x32, just keep the top-left 8x8. Those represent
           * the lowest frequencies in the picture.
           */

          const reduced = [];
          for (let x = 0; x < smallerSize; x++) {
            for (let y = 0; y < smallerSize; y++) {
              reduced.push(dctVals[size * x + y]);
            }
          }

          /* 5. Compute the average value.
           * Like the Average Hash, compute the mean DCT value (using only
           * the 8x8 DCT low-frequency values and excluding the first term
           * since the DC coefficient can be significantly different from
           * the other values and will throw off the average).
           */

          const median = reduced.slice(0).sort(function (a, b) {
            return a - b;
          })[Math.floor(reduced.length / 2)];

          /* 6. Further reduce the DCT.
           * This is the magic step. Set the 64 hash bits to 0 or 1
           * depending on whether each of the 64 DCT values is above or
           * below the average value. The result doesn't tell us the
           * actual low frequencies; it just tells us the very-rough
           * relative scale of the frequencies to the mean. The result
           * will not vary as long as the overall structure of the image
           * remains the same; this can survive gamma and color histogram
           * adjustments without a problem.
           */

          return reduced
            .map(function (e) {
              return e >= median ? '1' : '0';
            })
            .join('');
        },

        distance: (first, second) => {
          if (!first || !second) {
            // failed to produce pHash, likely due to cross origin issues.
            // return a large number so that it's never lower than the duplication threshold
            return Number.MAX_SAFE_INTEGER;
          }

          let dist = 0;
          for (let i = 0; i < first.length; i++) if (first[i] != second[i]) dist++;
          return dist;
        },
      },

      // fulfill external requests from the background process
      act: {
        /*
        pinmarklet has run and reported to the background process, which is asking us to render results
        {
          data {
            [everything pinmarklet sent back]
          }
        }
        */
        render: (r) => {
          $.func.debug('rendering the grid');
          $.func.debug(r);
          // some space to stash our endpoints
          $.global.endpoint = {};

          // in case we are not authed we will need to know the right domain for the pop-up windows
          // TODO: remove endpoint.grid from ctrl.json after some versions have pushed
          $.global.endpoint.pinCreate = `https://${$.global.ctrl.server.www}${$.global.ctrl.server.domain}/pin/create/extension/`.replace(
            /www/,
            r.data.config.domain,
          );
          $.global.endpoint.rePinCreate = `https://${$.global.ctrl.server.www}${$.global.ctrl.server.domain}/pin/%s/repin/x/`.replace(
            /www/,
            r.data.config.domain,
          );

          // right here is where we ask the background process to save rich
          if ((r.data.rich || {}).url) {
            $.func.send({
              act: 'saveRichData',
              data: r.data.rich,
            });
            $.func.debug('Rich data: \n' + JSON.stringify(r.data.rich, null, 2));
          } else {
            $.func.debug('No rich data sent from pinmarklet.');
          }

          // Only log IMAGE_PICKER viewType if a user doesn't skip the image grid
          let shouldLogImagePickerViewType = true;

          // are we logged in?
          if (r.data.auth) {
            // we'll use this later to open the right pin create form from the grid
            $.global.hazLogin = true;
            // if we only have one thing, close the grid and go directly to pin create
            if (r.data.thumb.length === 1) {
              $.func.loadingSpinnerUI.hide();
              shouldLogImagePickerViewType = false;
              $.func.send({
                act: 'openCreate',
                data: {
                  ...r.data.thumb[0],
                  funnel_uuid: r.data.funnel_uuid,
                  funnel_url: r.data.funnel_url,
                },
              });
              // close and log this event
              $.func.close({
                event: 'skipGrid',
                url: r.data.thumb[0].url || null,
              });
            }
          }

          if (shouldLogImagePickerViewType) {
            // Log that user have viewed the the grid (IMAGE_PICKER)
            $.func.send({
              act: 'contextLog',
              data: {
                eventType: 'VIEW',
                viewType: 'IMAGE_PICKER',
                auxData: {
                  url: r.data.funnel_url,
                  funnel_uuid: r.data.funnel_uuid,
                },
              },
            });
          }

          // avoid the initial flash of header if we are skipping the grid
          document.body.style.display = 'block';

          // experiment: browser_extension_image_deduplication_1
          const dedupExp = 'browser_extension_image_deduplication_1';
          // only check for duplicated images if user is in the experiment (control/enabled)
          if ((r.experimentGroup[dedupExp] || {}).group) {
            Promise.all(
              r.data.thumb
                .filter((item) => item.src !== undefined)
                .map((item) => {
                  return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.onload = () => {
                      item.pHash = $.func.nearDedupCheck.pHash(img);
                      resolve(item);
                    };
                    img.src = item.media;
                  });
                }),
            ).then((images) => {
              r.data.filteredDataThumbs = images.reduce((unique, item) => {
                for (let added of unique) {
                  // Exclude the current image if the hamming distance between this image and any of the existing
                  // images is less than or equal to 2.
                  // If we want to be more conservative, we can decrease this value and vice versa.
                  if ($.func.nearDedupCheck.distance(added.pHash, item.pHash) <= 2) {
                    $.func.debug(
                      `Excluding ${item.media} because it's very similar to ${added.media}!`,
                    );
                    return unique;
                  }
                }
                return [...unique, item];
              }, []);
              if (r.data.filteredDataThumbs < r.data.thumb) {
                $.func.send({
                  act: 'activate',
                  experimentName: dedupExp,
                  callback: 'renderGrid',
                  data: r.data,
                });
              } else {
                $.func.act.renderGrid(r);
              }
            });
          } else {
            $.func.act.renderGrid(r);
          }
        },

        renderGrid: (r) => {
          $.func.loadingSpinnerUI.hide();
          // experiment: browser_extension_image_deduplication_1
          const dedupExp = 'browser_extension_image_deduplication_1';
          const dataThumbsToRender = $.func.isUserInTreatmentGroup(
            dedupExp,
            (r.experimentGroup[dedupExp] || {}).group,
          )
            ? r.data.filteredDataThumbs
            : r.data.thumb;
          if ($.global.hazLogin) {
            // set our title and header with the right strings in the right language
            document.title = $.global.msg.choosePinMultiSelectHeader;
            $.structure.hdMsg.innerText = $.global.msg.choosePinMultiSelectHeader;
            $.func.changeClass({ el: $.structure.hd, add: 'hdMultiselect' });
            $.func.changeClass({
              el: $.structure.grid,
              add: 'gridMultiselect',
            });
            $.func.changeClass({
              el: $.structure.footer,
              add: 'footerMultiselect',
            });

            $.structure.subheader.innerText = $.global.msg.choosePinMultiSelectSubHeader;
            $.structure.saveButton.innerText = $.global.msg.nextAction;
            // get ready to render some columns, starting with zero
            let cc = 0;

            // experiment: browser_extension_image_deduplication_1
            // run through all thumbs
            dataThumbsToRender.forEach((it) => {
              // only add a thumb if we have a source attribute
              if (it.src) {
                $.func.addFromTemplate({
                  template: {
                    thumb: {
                      image: {
                        tag: 'img',
                        src: it.media,
                      },
                      checkbox: {
                        checkmark: {
                          addClass: 'checkmark',
                        },
                      },
                      mask: {
                        cmd: 'select',
                        url: it.url,
                        media: it.media,
                        description: (it.description || '').substr(0, 500),
                        pinId: it.dataPinId || undefined,
                        [$.constant.logging.FUNNEL_UUID_ATTR]: r.data.funnel_uuid,
                        [$.constant.logging.FUNNEL_URL_ATTR]: r.data.funnel_url,
                      },
                    },
                  },
                  addTo: document.getElementById('c_' + cc),
                });

                // set next column
                cc = (cc + 1) % $.global.columnCount;
              }
            });
          } else {
            // set our title and header with the right strings in the right language
            document.title = $.global.msg.choosePin;
            $.structure.hdMsg.innerText = $.global.msg.choosePin;

            // get ready to render some columns, starting with zero
            let cc = 0;

            // experiment: browser_extension_image_deduplication_1
            // run through all thumbs
            dataThumbsToRender.forEach((it) => {
              // only add a thumb if we have a source attribute
              if (it.src) {
                $.func.addFromTemplate({
                  template: {
                    thumb: {
                      searchButton: {
                        addClass: 'searchButton',
                        cmd: 'search',
                        media: it.media,
                      },
                      image: {
                        tag: 'img',
                        src: it.media,
                      },
                      saveButton: {
                        addClass: 'saveButton',
                        innerText: $.global.msg.saveAction,
                      },
                      ft: {
                        ftDesc: {
                          dimensions: {
                            innerText: it.height + ' x ' + it.width,
                          },
                        },
                      },
                      mask: {
                        cmd: 'save',
                        url: it.url,
                        media: it.media,
                        description: (it.description || '').substr(0, 500),
                        pinId: it.dataPinId || undefined,
                        [$.constant.logging.FUNNEL_UUID_ATTR]: r.data.funnel_uuid,
                        [$.constant.logging.FUNNEL_URL_ATTR]: r.data.funnel_url,
                      },
                    },
                  },
                  addTo: document.getElementById('c_' + cc),
                });

                // set next column
                cc = (cc + 1) % $.global.columnCount;
              }
            });
          }

          // brute-force hide for all Search buttons
          if (r.data.hideSearch) {
            document.body.className = `${$.config.me}_hideSearch`;
          }
        },
      },

      /*
       Checks whether user's experiment group has the correct prefix.
      */
      isUserInTreatmentGroup: (expName, expGroup) => {
        if (expGroup && $.global.enabledExperimentGroups[expName]) {
          for (let i = 0; i < $.global.enabledExperimentGroups[expName].length; i++) {
            if (expGroup.startsWith($.global.enabledExperimentGroups[expName][i])) {
              return true;
            }
          }
        }
        return false;
      },

      // fulfill internal requests from DOM objects on user interaction
      cmd: {
        // close our overlay
        close: (o) => {
          $.func.close({ event: 'click' });
        },
        // open the Search overlay
        search: (el) => {
          // log the click
          $.func.log({
            event: 'click',
            overlay: 'grid',
            action: 'open_search',
          });
          $.func.send({
            act: 'openSearchFromGrid',
            data: {
              searchMe: $.func.get({ el: el, att: 'media' }),
            },
          });
        },
        select: (el) => {
          // TODO: CONG-100 Log Pick Images, Unpick Images
          const pin = {
            url: $.func.get({ el: el, att: 'url' }),
            id: $.func.get({ el: el, att: 'pinId' }) || null,
            media: $.func.get({ el: el, att: 'media' }),
            // sneaking pinmarklet's default description through without showing it to the user
            description: $.func.get({ el: el, att: 'description' }),
            funnel_uuid: $.func.get({
              el: el,
              att: $.constant.logging.FUNNEL_UUID_ATTR,
            }),
          };

          const index = $.global.selectedImages.findIndex(
            (data) => data.media == pin.media && data.id == pin.id,
          );
          if (index != -1) {
            $.global.selectedImages[index].footer.remove();
            // remove image from footer
            $.global.selectedImages.splice(index, 1);
            $.func.changeClass({ el: el.parentNode, remove: 'selected' });
          } else if ($.global.selectedImages.length < $.config.maxSelected) {
            $.global.selectedImages.push(pin);
            // add image to footer
            footerImage = $.func.make({
              img: {
                src: pin.media,
                className: $.config.me + '_footer_image',
              },
            });
            pin.footer = footerImage;
            $.structure.footer.prepend(footerImage);
            $.func.changeClass({ el: el.parentNode, add: 'selected' });
          }

          // toggle the style class for the selected image
          $.structure.footer.style.display = $.global.selectedImages.length == 0 ? 'none' : 'flex';
        },
        saveBatch: (el) => {
          // removing the footer as passing DOM node is problematic in Firefox
          $.global.selectedImages.forEach((image) => delete image.footer);
          // open the inline create form
          $.func.send({
            act: 'openCreate',
            data: $.global.selectedImages,
          });

          // close our overlay, logging that the create overlay was opened
          $.func.close({
            event: 'click',
            overlay: 'grid',
            action: 'open_create',
          });
        },
        // do the right thing when the Save button is clicked
        save: (el) => {
          // The Save button is under the mask, so we watch for clicks to mask and not Save button
          // we will want to change this for pinBetterSave
          const funnel_url = $.func.get({
            el: el,
            att: $.constant.logging.FUNNEL_URL_ATTR,
          });
          const funnel_uuid = $.func.get({
            el: el,
            att: $.constant.logging.FUNNEL_UUID_ATTR,
          });
          const data = {
            url: $.func.get({ el: el, att: 'url' }),
            id: $.func.get({ el: el, att: 'pinId' }) || null,
            media: $.func.get({ el: el, att: 'media' }),
            // sneaking pinmarklet's default description through without showing it to the user
            description: $.func.get({ el: el, att: 'description' }),
            funnel_uuid,
            funnel_url,
            method: 'g',
          };

          // if we're authed, save inline.  Otherwise, open the pop-up form.
          if ($.global.hazLogin) {
            $.func.send({
              act: 'contextLog',
              data: {
                eventType: 'CLICK',
                viewType: 'IMAGE_PICKER',
                element: 'PIN_SAVE_BUTTON',
                auxData: {
                  url: funnel_url,
                  funnel_uuid,
                },
              },
            });
            // open the inline create form
            $.func.send({
              act: 'openCreate',
              data: data,
            });
          } else {
            // open the pop-up form
            $.func.popCreate(data);
            // TODO: check if we are/care about logging unauthed clicks?
          }

          // close our overlay, logging that the create overlay was opened
          $.func.close({
            event: 'click',
            overlay: 'grid',
            action: 'open_create',
          });
        },
      },

      // a click event has been detected
      click: (e) => {
        // what did we just click on?
        let el = $.func.getEl(e);
        // does it have an associated command?
        let cmd = $.func.get({ el: el, att: 'cmd' });
        // do we have a command ready to run?
        if (typeof $.func.cmd[cmd] === 'function') {
          // pass the element down to the command
          $.func.cmd[cmd](el);
        }
      },

      // a keydown event has been detected
      keydown: (e) => {
        const k = e.keyCode || null;
        // escape from main screen = close
        if (k === 27) {
          $.func.close({ event: 'keydown' });
        }
      },

      // start
      init: () => {
        // listen for important events
        document.body.addEventListener('click', $.func.click);
        document.addEventListener('keydown', $.func.keydown);

        // don't allow right-click menus unless we are in debug mode
        if (!$.global.debug) {
          document.addEventListener('contextmenu', (event) => event.preventDefault());
        }

        // build our structure and land it in document.body
        $.func.addFromTemplate({
          template: $.config.structure,
          addTo: document.body,
        });

        $.func.loadingSpinnerUI.display();

        // get ready to render some thumbs
        $.global.columnCount = Math.floor(document.body.offsetWidth / 220);
        // do we have enough room to render columns?
        if ($.global.columnCount) {
          for (let i = 0; i < $.global.columnCount; i = i + 1) {
            $.func.addFromTemplate({
              template: {
                col: {
                  // yes, we are going to use document.getElementById to find this later
                  id: 'c_' + i,
                },
              },
              addTo: $.structure.grid,
            });
          }
        } else {
          // something's up with our screen width; quietly close
          $.func.debug('Not enough room to render grid columns; closing.');
          // this might help us diagnose people who say the button is doing nothing
          $.func.close({
            event: 'grid_render_fail',
          });
        }

        // document.body is hidden by default in style, so do this AFTER we render structure
        $.func.buildStyleFrom($.config.presentation);
      },
    },
  };

  // start listening for messages from the background
  $.browser.runtime.onMessage.addListener((r) => {
    $.func.debug('message received');
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
  $.browser.storage.local.get(null, (r) => {
    // anything in local storage is now available in $.global
    for (let i in r) {
      $.global[i] = r[i];
    }
    // promote only the right subset of messages
    $.global.msg = $.global.msg.grid;
    // fire it off
    $.func.init();
  });
})({
  // everything under here winds up in $.config after load

  // primary identifier for this overlay's scope
  me: 'grid',

  // max number of images the user can select
  maxSelected: 10,

  // size of unauthed pop-up window
  popup: {
    height: 900,
    width: 800,
  },

  // our structure
  structure: {
    loadingSpinnerContainer: {
      loadingMessage: {},
      spinner: {},
    },
    hd: {
      hdMsg: {},
      subheader: {},
      x: {
        cmd: 'close',
      },
    },
    grid: {},
    footer: {
      fade: {
        saveButton: {
          cmd: 'saveBatch',
        },
      },
    },
  },

  // our presentation is a SASS-like object to be turned into stylesheets
  presentation: {
    body: {
      background: '#fff',
      margin: '0',
      padding: '0',
      'font-family':
        '"Helvetica Neue", Helvetica, "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", メイリオ, Meiryo, "ＭＳ Ｐゴシック", arial, sans-serif',
      // wherever %prefix% appears, something like moz- or webkit- will be substituted by the build
      '%prefix%font-smoothing': 'antialiased',
      '-moz-osx-font-smoothing': 'grayscale',
      display: 'block',
      // don't show the Search button if grid_hideSearch is on document.body
      '&._hideSearch ._grid ._col ._thumb ._searchButton': {
        display: 'none',
      },
      'text-align': 'center',
    },
    '*': {
      '%prefix%box-sizing': 'border-box',
    },
    '._hd': {
      background:
        '#fff url(data:image/svg+xml;base64,CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBoZWlnaHQ9IjMycHgiIHdpZHRoPSIzMnB4IiB2aWV3Qm94PSIwIDAgMzAgMzAiPjxnPjxwYXRoIGQ9Ik0yOS40NDksMTQuNjYyIEMyOS40NDksMjIuNzIyIDIyLjg2OCwyOS4yNTYgMTQuNzUsMjkuMjU2IEM2LjYzMiwyOS4yNTYgMC4wNTEsMjIuNzIyIDAuMDUxLDE0LjY2MiBDMC4wNTEsNi42MDEgNi42MzIsMC4wNjcgMTQuNzUsMC4wNjcgQzIyLjg2OCwwLjA2NyAyOS40NDksNi42MDEgMjkuNDQ5LDE0LjY2MiIgZmlsbD0iI2ZmZiI+PC9wYXRoPjxwYXRoIGQ9Ik0xNC43MzMsMS42ODYgQzcuNTE2LDEuNjg2IDEuNjY1LDcuNDk1IDEuNjY1LDE0LjY2MiBDMS42NjUsMjAuMTU5IDUuMTA5LDI0Ljg1NCA5Ljk3LDI2Ljc0NCBDOS44NTYsMjUuNzE4IDkuNzUzLDI0LjE0MyAxMC4wMTYsMjMuMDIyIEMxMC4yNTMsMjIuMDEgMTEuNTQ4LDE2LjU3MiAxMS41NDgsMTYuNTcyIEMxMS41NDgsMTYuNTcyIDExLjE1NywxNS43OTUgMTEuMTU3LDE0LjY0NiBDMTEuMTU3LDEyLjg0MiAxMi4yMTEsMTEuNDk1IDEzLjUyMiwxMS40OTUgQzE0LjYzNywxMS40OTUgMTUuMTc1LDEyLjMyNiAxNS4xNzUsMTMuMzIzIEMxNS4xNzUsMTQuNDM2IDE0LjQ2MiwxNi4xIDE0LjA5MywxNy42NDMgQzEzLjc4NSwxOC45MzUgMTQuNzQ1LDE5Ljk4OCAxNi4wMjgsMTkuOTg4IEMxOC4zNTEsMTkuOTg4IDIwLjEzNiwxNy41NTYgMjAuMTM2LDE0LjA0NiBDMjAuMTM2LDEwLjkzOSAxNy44ODgsOC43NjcgMTQuNjc4LDguNzY3IEMxMC45NTksOC43NjcgOC43NzcsMTEuNTM2IDguNzc3LDE0LjM5OCBDOC43NzcsMTUuNTEzIDkuMjEsMTYuNzA5IDkuNzQ5LDE3LjM1OSBDOS44NTYsMTcuNDg4IDkuODcyLDE3LjYgOS44NCwxNy43MzEgQzkuNzQxLDE4LjE0MSA5LjUyLDE5LjAyMyA5LjQ3NywxOS4yMDMgQzkuNDIsMTkuNDQgOS4yODgsMTkuNDkxIDkuMDQsMTkuMzc2IEM3LjQwOCwxOC42MjIgNi4zODcsMTYuMjUyIDYuMzg3LDE0LjM0OSBDNi4zODcsMTAuMjU2IDkuMzgzLDYuNDk3IDE1LjAyMiw2LjQ5NyBDMTkuNTU1LDYuNDk3IDIzLjA3OCw5LjcwNSAyMy4wNzgsMTMuOTkxIEMyMy4wNzgsMTguNDYzIDIwLjIzOSwyMi4wNjIgMTYuMjk3LDIyLjA2MiBDMTQuOTczLDIyLjA2MiAxMy43MjgsMjEuMzc5IDEzLjMwMiwyMC41NzIgQzEzLjMwMiwyMC41NzIgMTIuNjQ3LDIzLjA1IDEyLjQ4OCwyMy42NTcgQzEyLjE5MywyNC43ODQgMTEuMzk2LDI2LjE5NiAxMC44NjMsMjcuMDU4IEMxMi4wODYsMjcuNDM0IDEzLjM4NiwyNy42MzcgMTQuNzMzLDI3LjYzNyBDMjEuOTUsMjcuNjM3IDI3LjgwMSwyMS44MjggMjcuODAxLDE0LjY2MiBDMjcuODAxLDcuNDk1IDIxLjk1LDEuNjg2IDE0LjczMywxLjY4NiIgZmlsbD0iI2U2MDAyMyI+PC9wYXRoPjwvZz48L3N2Zz4=) 20px 50% no-repeat',
      color: '#333',
      height: '65px',
      'line-height': '65px',
      'font-size': '24px',
      'font-weight': 'bold',
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      'z-index': '3',
      'text-align': 'left',
      'text-indent': '65px',
      '%prefix%transform': 'translateZ(0)',
      '._x': {
        'z-index': '4',
        opacity: '.5',
        position: 'absolute',
        right: '25px',
        top: '0',
        cursor: 'pointer',
        height: '65px',
        width: '15px',
        background:
          'transparent url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMTVweCIgd2lkdGg9IjE1cHgiIHZpZXdCb3g9IjAgMCA4MCA4MCI+PGc+PGxpbmUgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiB4MT0iMTAiIHkxPSIxMCIgeDI9IjcwIiB5Mj0iNzAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyMCIvPjxsaW5lIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgeDE9IjcwIiB5MT0iMTAiIHgyPSIxMCIgeTI9IjcwIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMjAiLz48L2c+PC9zdmc+) 50% 50% no-repeat',
        '&:hover': {
          opacity: '1',
        },
      },
    },
    '._hdMultiselect': {
      background:
        '#fff url(data:image/svg+xml;base64,CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBoZWlnaHQ9IjMycHgiIHdpZHRoPSIzMnB4IiB2aWV3Qm94PSIwIDAgMzAgMzAiPjxnPjxwYXRoIGQ9Ik0yOS40NDksMTQuNjYyIEMyOS40NDksMjIuNzIyIDIyLjg2OCwyOS4yNTYgMTQuNzUsMjkuMjU2IEM2LjYzMiwyOS4yNTYgMC4wNTEsMjIuNzIyIDAuMDUxLDE0LjY2MiBDMC4wNTEsNi42MDEgNi42MzIsMC4wNjcgMTQuNzUsMC4wNjcgQzIyLjg2OCwwLjA2NyAyOS40NDksNi42MDEgMjkuNDQ5LDE0LjY2MiIgZmlsbD0iI2ZmZiI+PC9wYXRoPjxwYXRoIGQ9Ik0xNC43MzMsMS42ODYgQzcuNTE2LDEuNjg2IDEuNjY1LDcuNDk1IDEuNjY1LDE0LjY2MiBDMS42NjUsMjAuMTU5IDUuMTA5LDI0Ljg1NCA5Ljk3LDI2Ljc0NCBDOS44NTYsMjUuNzE4IDkuNzUzLDI0LjE0MyAxMC4wMTYsMjMuMDIyIEMxMC4yNTMsMjIuMDEgMTEuNTQ4LDE2LjU3MiAxMS41NDgsMTYuNTcyIEMxMS41NDgsMTYuNTcyIDExLjE1NywxNS43OTUgMTEuMTU3LDE0LjY0NiBDMTEuMTU3LDEyLjg0MiAxMi4yMTEsMTEuNDk1IDEzLjUyMiwxMS40OTUgQzE0LjYzNywxMS40OTUgMTUuMTc1LDEyLjMyNiAxNS4xNzUsMTMuMzIzIEMxNS4xNzUsMTQuNDM2IDE0LjQ2MiwxNi4xIDE0LjA5MywxNy42NDMgQzEzLjc4NSwxOC45MzUgMTQuNzQ1LDE5Ljk4OCAxNi4wMjgsMTkuOTg4IEMxOC4zNTEsMTkuOTg4IDIwLjEzNiwxNy41NTYgMjAuMTM2LDE0LjA0NiBDMjAuMTM2LDEwLjkzOSAxNy44ODgsOC43NjcgMTQuNjc4LDguNzY3IEMxMC45NTksOC43NjcgOC43NzcsMTEuNTM2IDguNzc3LDE0LjM5OCBDOC43NzcsMTUuNTEzIDkuMjEsMTYuNzA5IDkuNzQ5LDE3LjM1OSBDOS44NTYsMTcuNDg4IDkuODcyLDE3LjYgOS44NCwxNy43MzEgQzkuNzQxLDE4LjE0MSA5LjUyLDE5LjAyMyA5LjQ3NywxOS4yMDMgQzkuNDIsMTkuNDQgOS4yODgsMTkuNDkxIDkuMDQsMTkuMzc2IEM3LjQwOCwxOC42MjIgNi4zODcsMTYuMjUyIDYuMzg3LDE0LjM0OSBDNi4zODcsMTAuMjU2IDkuMzgzLDYuNDk3IDE1LjAyMiw2LjQ5NyBDMTkuNTU1LDYuNDk3IDIzLjA3OCw5LjcwNSAyMy4wNzgsMTMuOTkxIEMyMy4wNzgsMTguNDYzIDIwLjIzOSwyMi4wNjIgMTYuMjk3LDIyLjA2MiBDMTQuOTczLDIyLjA2MiAxMy43MjgsMjEuMzc5IDEzLjMwMiwyMC41NzIgQzEzLjMwMiwyMC41NzIgMTIuNjQ3LDIzLjA1IDEyLjQ4OCwyMy42NTcgQzEyLjE5MywyNC43ODQgMTEuMzk2LDI2LjE5NiAxMC44NjMsMjcuMDU4IEMxMi4wODYsMjcuNDM0IDEzLjM4NiwyNy42MzcgMTQuNzMzLDI3LjYzNyBDMjEuOTUsMjcuNjM3IDI3LjgwMSwyMS44MjggMjcuODAxLDE0LjY2MiBDMjcuODAxLDcuNDk1IDIxLjk1LDEuNjg2IDE0LjczMywxLjY4NiIgZmlsbD0iI2U2MDAyMyI+PC9wYXRoPjwvZz48L3N2Zz4=) 60px 50% no-repeat',
      'background-size': '50px',
      height: '145px',
      padding: '50px 40px 40px 40px',
      'text-indent': '85px',
      '._hdMsg': {
        display: 'block',
        'line-height': '24px',
        'font-size': '24px',
        'font-weight': 'bold',
      },
      '._subheader': {
        display: 'block',
        'line-height': '35px',
        'font-size': '20px',
        'font-weight': 'normal',
      },
      '._x': {
        right: '65px',
        top: '40px',
        width: '30px',
        'background-size': '20px',
        '&:hover': {
          opacity: '1',
        },
      },
    },
    '._grid': {
      display: 'block',
      margin: '72px 0 auto',
      'z-index': '1',
      '._col': {
        display: 'inline-block',
        width: '220px',
        'vertical-align': 'top',
        'text-align': 'left',
        '._thumb': {
          'border-radius': '8px',
          margin: '0',
          display: 'block',
          width: '220px',
          background: '#eee',
          'vertical-align': 'top',
          overflow: 'hidden',
          cursor: 'pointer',
          background: '#fff',
          position: 'relative',
          border: '10px solid #fff',
          '&:hover': {
            background: '#eee',
            'border-color': '#eee',
          },
          '._mask': {
            position: 'absolute',
            top: '0',
            left: '0',
            bottom: '0',
            right: '0',
          },
          '._searchButton': {
            position: 'absolute',
            top: '8px',
            right: '8px',
            height: '40px',
            width: '40px',
            'border-radius': '20px',
            background:
              'rgba(0,0,0,.4) url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pjxzdmcgd2lkdGg9IjI0cHgiIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAwIDI0IDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxkZWZzPjxtYXNrIGlkPSJtIj48cmVjdCBmaWxsPSIjZmZmIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI2IiByeT0iNiIvPjxyZWN0IGZpbGw9IiMwMDAiIHg9IjUiIHk9IjUiIHdpZHRoPSIxNCIgaGVpZ2h0PSIxNCIgcng9IjEiIHJ5PSIxIi8+PHJlY3QgZmlsbD0iIzAwMCIgeD0iMTAiIHk9IjAiIHdpZHRoPSI0IiBoZWlnaHQ9IjI0Ii8+PHJlY3QgZmlsbD0iIzAwMCIgeD0iMCIgeT0iMTAiIHdpZHRoPSIyNCIgaGVpZ2h0PSI0Ii8+PC9tYXNrPjwvZGVmcz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiNmZmYiIG1hc2s9InVybCgjbSkiLz48L3N2Zz4=) 50% 50% no-repeat',
            'background-size': '24px 24px',
            opacity: '0',
            'z-index': '2',
          },
          '._saveButton': {
            position: 'absolute',
            top: '10px',
            left: '10px',
            width: 'auto',
            'border-radius': '4px',
            background:
              '#e60023 url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjEwcHgiIGhlaWdodD0iMjBweCIgdmlld0JveD0iMCAwIDEwIDIwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogIDxnPgogICAgPHBhdGggZD0iTTAuNDgzMDc2OSwwIEMwLjQ4MzA3NjksMC43NzIxNDI5IDEuMzI1Mzg0NiwxLjQzMjg1NzEgMi4xMzc2OTIzLDEuNzg0Mjg1NyBMMi4xMzc2OTIzLDcuMzU3MTQyOSBDMC43NTg0NjE1LDguMTQyODU3MSAwLDkuNzUzNTcxNCAwLDExLjQyODU3MTQgTDQuMjAyMzA3NywxMS40Mjg1NzE0IEw0LjIwMTUzODUsMTcuMjEyMTQyOSBDNC4yMDE1Mzg1LDE3LjIxMjE0MjkgNC4zNDE1Mzg1LDE5LjY1OTI4NTcgNSwyMCBDNS42NTc2OTIzLDE5LjY1OTI4NTcgNS43OTc2OTIzLDE3LjIxMjE0MjkgNS43OTc2OTIzLDE3LjIxMjE0MjkgTDUuNzk2OTIzMSwxMS40Mjg1NzE0IEwxMCwxMS40Mjg1NzE0IEMxMCw5Ljc1MzU3MTQgOS4yNDE1Mzg1LDguMTQyODU3MSA3Ljg2MTUzODUsNy4zNTcxNDI5IEw3Ljg2MTUzODUsMS43ODQyODU3IEM4LjY3NDYxNTQsMS40MzI4NTcxIDkuNTE2MTUzOCwwLjc3MjE0MjkgOS41MTYxNTM4LDAgTDAuNDgzMDc2OSwwIEwwLjQ4MzA3NjksMCBaIiBmaWxsPSIjRkZGRkZGIj48L3BhdGg+CiAgPC9nPgo8L3N2Zz4=) 10px 9px no-repeat',
            'background-size': '10px 20px',
            padding: '0 10px 0 0',
            'text-indent': '26px',
            color: '#fff',
            'font-size': '14px',
            'line-height': '36px',
            'font-family': '"Helvetica Neue", Helvetica, Arial, sans-serif',
            'font-style': 'normal',
            'font-weight': 'bold',
            'text-align': 'left',
            '%prefix%font-smoothing': 'antialiased',
            '-moz-osx-font-smoothing': 'grayscale',
            opacity: '0',
          },
          '&:hover ._saveButton, &:hover ._searchButton, &:hover ._ft ._dimensions': {
            opacity: '1',
          },
          img: {
            display: 'block',
            width: '200px',
            'border-radius': '8px',
          },
          '._ft': {
            display: 'block',
            span: {
              position: 'relative',
              display: 'block',
              color: '#333',
              'font-size': '12px',
            },
            '._dimensions': {
              'border-bottom-left-radius': '8px',
              'border-bottom-right-radius': '8px',
              padding: '0',
              position: 'absolute',
              top: '-24px',
              height: '24px',
              'line-height': '24px',
              left: '0',
              'text-align': 'center',
              width: '100%',
              background: 'rgba(0,0,0,.5)',
              color: '#fff',
              'font-size': '12px',
              'font-style': 'normal',
              '%prefix%font-smoothing': 'antialiased',
              '-moz-osx-font-smoothing': 'grayscale',
              opacity: '0',
            },
          },
        },
      },
    },
    '._gridMultiselect': {
      margin: '152px 0 auto',
      '._col': {
        margin: '0 5px',
        width: '210px',
        '._thumb': {
          'border-radius': '12px',
          'margin-bottom': '10px',
          border: '5px solid #fff',
          width: '210px',
          '._mask': {
            width: '200px',
            'border-radius': '8px',
            'z-index': '1',
            background: '#000000',
            opacity: '0.05',
          },
          '._checkbox': {
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            height: '22px',
            width: '22px',
            'border-radius': '6px',
            background: '#fff',
            'background-size': '10px 10px',
            'z-index': '1',
            opacity: '0.8',
          },
          '._checkmark': {
            content: '',
            position: 'absolute',
            display: 'none',
          },
        },
        '._selected': {
          border: '2px solid #000000 !important',
          padding: '3px',
          '._mask': {
            position: 'absolute',
            top: '3px',
            left: '3px',
            bottom: '3px',
            right: '3px',
          },
          '._checkbox': {
            bottom: '13px',
            right: '13px',
            background: '#000000',
            opacity: '1.0',
          },
          '._checkmark': {
            display: 'block',
            left: '8px',
            top: '5px',
            width: '6px',
            height: '10px',
            border: 'solid white',
            'border-width': '0 2px 2px 0',
            transform: 'rotate(45deg)',
          },
        },
      },
    },
    '._footerMultiselect': {
      background: '#fff',
      height: '90px',
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      display: 'none',
      padding: '10px 10px 10px 32px',
      'box-shadow': '0px -2px 10px -8px #000000',
      'overflow-x': 'auto',
      'text-align': 'left',
      'z-index': '3',
      '._footer_image': {
        height: '70px',
        display: 'inline',
        margin: '0 10px 0 0',
        'border-radius': '8px',
      },
      '._fade': {
        'z-index': '3',
        background: 'linear-gradient(to right, transparent, #ffffff 60%)',
        position: 'fixed',
        right: '0',
        bottom: '0',
        width: '300px',
        height: '90px',
        '._saveButton': {
          'z-index': '4',
          position: 'fixed',
          right: '32px',
          bottom: '20px',
          cursor: 'pointer',
          height: '50px',
          width: '90px',
          'border-radius': '25px',
          background: '#e60023',
          color: '#fff',
          'font-size': '14px',
          'line-height': '50px',
          'font-family': '"Helvetica Neue", Helvetica, Arial, sans-serif',
          'font-style': 'normal',
          'font-weight': 'bold',
          'text-align': 'center',
          'vertical-align': 'center',
          '%prefix%font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
      },
    },
    // experiment: browser_extension_auto_scroll_lazy_load
    '._loadingMessage': {
      'text-align': 'center',
      'font-size': '2em',
      'font-weight': 'bold',
      display: 'block',
      'margin-bottom': '16px',
    },
    '._loadingSpinnerContainer': {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      '-ms-transform': 'translate(-50%, -50%)' /* for IE 9 */,
      '-webkit-transform': 'translate(-50%, -50%)' /* for Safari */,
    },
  },
});
