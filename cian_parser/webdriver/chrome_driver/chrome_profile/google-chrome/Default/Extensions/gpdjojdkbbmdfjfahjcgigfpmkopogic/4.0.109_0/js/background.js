/*
  CONG-183: improve save iframe performance (D606240)
  BUG-115225: revert custom user-agent string
*/

// debug needs to be set here or else we don't know whether we want to load our local ctrl.json
const DEBUG = false;

// Where will we find our control file and hashList.json when we're not debugging?
const REMOTE_ASSET_PATH = 'https://assets.pinterest.com/ext/';

/* when debugging, open up ctrl.json and change:

  "server": {
    "domain": ".pinterest.com",
    "api": "api",
    "www": "www"
  }

... to this:

  "server": {
    "domain": ".pinterdev.com",
    "api": "api-dev-yourname",
    "www": "dev-yourname"
  }

Example: testing the Python 3 API looked like this:

  "server": {
    "domain": ".pinterdev.com",
    "api": "dev-api-python3",
    "www": "python3"
  }

API requests go to $.v.ctrl.server.api + $.v.ctrl.server.domain
When showing a new pin or opening the unauthed pin create / repin form, it's $.v.ctrl.server.www + $.v.ctrl.server.domain

*/

/*
  Run me outside the main IIFE to catch the onInstalled event, which fires quickly
  INSTALL_OBJ will be checked during housekeeping and the appropriate event will be logged if needed
*/

let INSTALL_OBJ = {};
if (chrome && chrome.runtime) {
  // check for Chrome-specific event first
  chrome.runtime.onInstalled.addListener((o) => {
    INSTALL_OBJ = o;
  });
} else {
  // check other WebExtensions-compatible browsers
  if (browser && browser.runtime) {
    browser.runtime.onInstalled.addListener((o) => {
      INSTALL_OBJ = o;
    });
  }
}

((w, a) => {
  let $ = (w[a.k] = {
    w: w,
    a: a,
    b: chrome || browser,
    v: {
      sessionStart: Date.now(),
      endpoint: {},
      puid: '',
      context: {
        eventBatch: [], // an array of objects each containing app, browser, eventType, time, and anything else (like userId) we want to send
        user: {},
        userId: '',
        unauthId: '',
      },
      // just in case we screw up ctrl.json, let's keep a local known-good pattern
      pattern: {
        pinmarklet: '^https?:\\/\\/assets\\.pinterest\\.com\\/js\\/pinmarklet\\.js',
        pinterestDomain:
          '^https?:\\/\\/(([a-z]{1,3}|latest)\\.|)pinterest\\.(at|(c(a|h|l|o(\\.(kr|uk)|m(|\\.(au|mx)))))|d(e|k)|es|fr|i(e|t)|jp|nz|p(h|t)|se|ru)\\/',
      },
      // keeps track of experiments that have been activated
      experimentGroup: {},
      boards: {},
    },
    f: {
      // console.log to background window
      debug: (o) => {
        if (o && $.a.debug) {
          console.log(o);
        }
      },

      // helper to let us know if an API call failed
      didCallFail: (api) => {
        let callResult = true;
        if ((api.response || {}).status === 'success') {
          callResult = false;
        }
        return callResult;
      },

      // async/await XHR loader
      load: async (q) => {
        let out,
          req,
          xhr = () => {
            return new Promise((win, fail) => {
              // win and fail are local names for the promises that will be passed back to whoever called $.f.load
              req = new XMLHttpRequest();
              // response is expected to be JSON unless specified
              req.responseType = q.responseType || 'json';
              // method = get except if specified
              req.open(q.method || 'GET', q.url, true);
              // ask for results in our language
              req.setRequestHeader('Accept-Language', $.w.navigator.language);
              // set charset
              req.setRequestHeader('charset', 'UTF-8');
              // set client ID in header - hopefully used by SRE/API team to distinguish browser extension from
              // web app traffic
              // thank you: Oliver Steele ("Cheap Monads")
              if (($.v.ctrl || {}).clientId) {
                req.setRequestHeader('X-Client-ID', $.v.ctrl.clientId);
              }
              // are we signed in?
              if (q.auth && q.xRequestForgeryToken) {
                $.f.debug('Setting X-Request-Forgery-Token to ' + q.xRequestForgeryToken);
                req.setRequestHeader('X-Request-Forgery-Token', q.xRequestForgeryToken);
              }
              // win
              req.onload = () => {
                if (req.status === 200) {
                  out = { response: req.response };
                  // do we need to send back a key with this response?
                  if (q.k) {
                    out.k = q.k;
                  }
                  win(out);
                } else {
                  win({ response: { status: 'fail', error: 'API Error' } });
                }
              };
              // fail
              req.onerror = () => {
                fail({ status: 'fail', error: 'Network Error' });
              };
              // add formData to request if sent
              if (q.formData) {
                req.send(q.formData);
              } else {
                req.send();
              }
            });
          };
        // run it and return a promise
        try {
          let o = await xhr(q);
          // win
          return o;
        } catch (o) {
          // fail
          return o;
        }
      },

      // Load our control and support files
      bulkLoad: (o) => {
        /*
          Expects o.callback, which will run when all files in $.a.file have loaded
        */
        let filesLoaded = 0;
        $.a.file.forEach((fileName) => {
          // URL is filename + .json? + cache buster
          let url = fileName + '.json?' + Date.now();
          if (DEBUG && fileName === 'ctrl') {
            // we are debugging; load ctrl.json from onboard copy
            $.f.debug('Loading local JSON file ' + url);
          } else {
            // load from remote server
            url = REMOTE_ASSET_PATH + url;
          }
          $.f
            .load({ url: url, k: fileName })
            .then((r) => {
              if (r.k) {
                // r.k will mirror fileName, which we will use as
                // our key in $.v, so $.v.ctrl will contain ctrl.json
                // and $.v.hashList will contain the full hash list
                if (r.response) {
                  if (!r.status) {
                    // only update $.v and localStorage if we have a response that looks reasonable
                    if (r.k === 'hashList') {
                      // future iterations of hashList will not include theOtherList
                      r.response.theOtherList = $.a.theOtherList;
                    }
                    $.v[r.k] = r.response;
                    $.f.setLocal({ [r.k]: r.response });
                  } else {
                    $.f.debug('Ignoring ' + r.k + ' because of status ' + r.status);
                  }
                } else {
                  $.f.debug('No reponse for ' + r.k);
                }
              }
            })
            .then((r) => {
              filesLoaded = filesLoaded + 1;
              if (filesLoaded === $.a.file.length) {
                $.f.debug('All support files have loaded.');
                $.v.timeFilesLoaded = Date.now();
                o.callback();
              }
            });
        });
      },

      // set an object in local storage
      setLocal: (o) => {
        $.b.storage.local.set(o);
      },

      // get local storage, set local lets, run callback if specified
      getLocal: (o) => {
        if (!o.k) {
          o.k = null;
        }
        $.b.storage.local.get(o.k, (data) => {
          // overwrite with localStorage
          for (let i in data) {
            $.v[i] = data[i];
          }
          // o.cb should be the string name of a child function of $.f, so 'init' and not $.f.init
          if (typeof $.f[o.cb] === 'function') {
            $.f[o.cb]();
          }
        });
      },

      // Return a promise containing authentication
      authCheck: () => {
        /*
          Usage:
          $.f.authCheck().then(
            result => {
              doStuffWith(result);
            }
          );
        */

        // save a digest of our xRequestForgeryToken so we can
        // tell if login has changed
        const didUserChange = (token) => {
          $.f
            .hash({
              // remove double-quotes for all non-Chrome browsers
              str: token,
              method: 'SHA-1',
            })
            .then((result) => {
              if ($.v.userTokenHash && result.digest !== $.v.userTokenHash) {
                $.f.debug('User change detected, reloading experiments');
                $.f.experiment.getExperimentsWithoutActivation();
                // zero out boards timestamp
                $.v.boards.timestamp = 0;
                // get fresh boards
                $.f.act.getBoardsForSave();
              }
              $.v.userTokenHash = result.digest;
            });
        };

        // make our X-Request-Forgery-Token if we are authed; otherwise
        // just return what we sent in a promise, so we can resolve with
        // the same callback
        const makeToken = (input, callback) => {
          // do we need to hash _pinterest_sess?
          if (input.auth && input.sess) {
            // hash _pinterest_sess
            $.f.debug('Hashing _pinterest_sess for xRequestForgeryToken');
            $.f
              .hash({
                // remove double-quotes for all non-Chrome browsers
                str: input.sess.replace(/(^")|("$)/g, ''),
                method: 'SHA-512',
              })
              .then((result) => {
                input.xRequestForgeryToken = result.digest;
                $.f.debug('xRequestForgeryToken is:\n' + input.xRequestForgeryToken);
                // don't hand the raw session cookie back
                delete input.sess;
                // check to see if user changed
                didUserChange(result.digest);
                // run our handoff callback
                callback(input);
              });
          } else {
            // because we have no token, meaning the user is unauthed, we should clear the experimentGroup
            $.f.debug('User is unautheticated, erasing experimentGroup');
            $.v.experimentGroup = {};
            // zero out boards timestamp
            $.v.boards.timestamp = 0;
            // run our handoff callback
            callback(input);
          }
        };

        // analyze and return information about cookies
        const processCookies = (cookies) => {
          const result = {
            auth: false,
            pfob: false,
            // init timeCheck to 0 in case we have completely lost our _auth cookie while create.js is up
            timeCheck: 0,
          };

          // check for presence of _auth cookie, not its value
          if (cookies['_auth']) {
            // set timeCheck to help determine if login has changed while create.js is up
            result.timeCheck = cookies['_auth'].expirationDate || 0;

            // are we signed in to Pinterest?
            if (
              // check that _auth cookie (which we know exists already) is "1"
              cookies['_auth'].value === '1' &&
              // check _pinterest_sess exists AND has a value
              (cookies['_pinterest_sess'] || {}).value
            ) {
              // we are signed in
              result.auth = true;

              // we're going to hash this to get X-Request-Forgery-Token
              // and remove it before we return
              result.sess = cookies['_pinterest_sess'].value;

              // has the authed user allowed personalization from offsite browsing?
              // check _pinterest_pfob exists and has value "enabled"
              if ((cookies['_pinterest_pfob'] || {}).value === 'enabled') {
                result.pfob = true;
              }
            }
          }
          return result;
        };

        // return only the cookies we want
        return new Promise((resolve) => {
          $.b.cookies.getAll(
            {
              // this will match api.pinterest.com and www.pinterest.com
              domain: `${$.v.ctrl.server.domain}`,
            },
            (r) => {
              // these are here and not $.a to make ctrl.json the sole source of truth about cookie domains
              const importantCookies = {
                _auth: {
                  domain: `${$.v.ctrl.server.domain}`,
                  value: null,
                },
                _pinterest_sess: {
                  domain: `${$.v.ctrl.server.domain}`,
                  value: null,
                },
                _pinterest_pfob: {
                  domain: `${$.v.ctrl.server.domain}`,
                  value: null,
                },
              };

              // return a copy of importantCookies with values and expiration dates
              const getThese = Object.assign({}, importantCookies);
              for (let item of r) {
                if (getThese[item.name]) {
                  if (item.domain === getThese[item.name].domain) {
                    getThese[item.name].value = item.value;
                    getThese[item.name].expirationDate = item.expirationDate;
                  }
                }
              }

              // This function will allow us to perform other async actions if needed
              const handoff = (data) => {
                resolve(data);
              };

              // process our results and send them to the next step in the promise chain
              makeToken(processCookies(getThese), handoff);
            },
          );
        });
      },

      // handle context logging requests
      context: {
        // flush the $.v.context.eventBatch;
        // an array of objects each containing app, browser, eventType, time, and anything else (like userId) we want to send
        sendBatch: () => {
          // Do nothing if the $.v.context.eventBatch of events is empty
          if (!$.v.context.eventBatch.length) {
            return;
          }

          // Add to form
          const query = {
            url: `${$.v.endpoint.trk}callback/event/`,
            formData: new FormData(),
            method: 'POST',
          };
          query.formData.append('isJSONData', true);
          query.formData.append(
            'event_batch_json',
            JSON.stringify({
              // reportTime must be made in nanoseconds
              reportTime: Date.now() * 1000000,
              // again, not to belabor the point, but: events requires an array!
              events: $.v.context.eventBatch,
            }),
          );
          $.f.debug('Preparing to sending context log $.v.context.eventBatch.');
          $.f.debug(query);

          // Remove events once they are appended to the query object
          // Load is an async function,
          // we can't remove the events there because other functions might be adding events while $.f.load is being executed
          $.v.context.eventBatch = [];
          $.f.load(query);
        },

        // add an event to the batch
        addEvent: (event, forceFlush) => {
          // event: a context logging event object
          // forceFlush: send batch immediately if true
          // Candidate conditions to request a flush of the events
          $.f.debug('Adding event to eventBatch');
          $.v.context.eventBatch.unshift(event);
          // decide whether we need to send the batch right now
          if (forceFlush || $.f.context.shouldFlush()) {
            $.f.debug(
              'Flushing the events. Pushing batch of size: ' + $.v.context.eventBatch.length,
            );
            $.f.context.sendBatch();
          }
        },

        // make a hexadecimal string of an RFC4122 compliant UUID
        makeUUID: () => {
          return [1e7, 1e3, 4e3, 8e3, 1e11]
            .join('')
            .replace(/[018]/g, (c) =>
              (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16),
            );
        },
        // determine if the current batch should be flushed
        shouldFlush: () => {
          let myBatch = $.v.context.eventBatch,
            myBatchLength = myBatch.length,
            flushTypes = $.v.ctrl.ctx.flushTypes;
          // do we have events in the batch?
          if (myBatchLength) {
            // do we have enough events waiting to trigger a flush?
            if (myBatchLength > $.v.ctrl.ctx.flushConstants.numEvents) {
              returnMe = true;
            }
            // is the oldest event old enough to trigger a flush?
            if (
              Date.now() * 1000000 - myBatch[myBatchLength - 1].time >
              $.v.ctrl.ctx.flushConstants.timeoutNanoseconds
            ) {
              returnMe = true;
            }
            // is the event or view type of the most recent evebnt important enough to trigger an immediate flush?
            if (
              flushTypes['' + myBatch[0].eventType] ||
              flushTypes['' + (myBatch[0].context || {}).viewType]
            ) {
              return true;
            }
          }

          // we didn't find a reason to flush
          return false;
        },

        // create a context log event
        create: (input) => {
          $.f.debug('A context log event has been requested.');
          $.f.debug(input);

          // Short-circuit this method if eventType doesn't exist
          if (input.eventType === undefined) {
            $.f.debug('Context logging requires an eventType');
            return false;
          }

          let myEventType, myViewType, myElement;

          // do we have a valid event type?
          if (input.eventType) {
            myEventType = $.v.ctrl.ctx.EventTypes[input.eventType];
            // TODO: expose invalid EventTypes to statsboard
            if (!myEventType) {
              $.f.debug('Context logging requires an eventType listed in ctrl.ctx.EventTypes');
              $.f.debug(input);
              return false;
            }

            myViewType = $.v.ctrl.ctx.ViewTypes[input.viewType];
            myElement = $.v.ctrl.ctx.ElementTypes[input.element];

            // if we're viewing, do we have a valid view type?
            if (input.eventType === 'VIEW') {
              // TODO: expose invalid ViewTypes to statsboard
              if (!myViewType) {
                $.f.debug('A view requires a viewType listed in ctrl.ctx.ViewTypes');
                $.f.debug(input);
                return false;
              }
            }

            // if we're clicking, do we have a valid element?
            if (input.eventType === 'CLICK') {
              // TODO: expose invalid elementTypes to statsboard
              if (!myElement) {
                $.f.debug('A CLICK requires an element listed in ctrl.ctx.ElementTypes');
                $.f.debug(input);
                return false;
              }
            }
          }

          // create an empty object for this event
          const myEvent = {
            eventType: myEventType,
            time: Date.now() * 1000000,
            app: $.v.ctrl.ctx.AppTypes.BROWSER_EXTENSION,
            appVersion: $.v.xv,
            browser: $.v.browserType,
          };

          // wrap myViewType and myElement under a context object
          if (myViewType || myElement) {
            const context = {};
            Object.assign(
              context,
              !!myViewType && { viewType: myViewType },
              !!myElement && { element: myElement },
            );
            myEvent.context = context;
          }

          // If this event creates an object, attach the id string to the event
          if (input.objectIdStr) {
            myEvent.objectIdStr = input.objectIdStr;
          }

          if (
            input.auxData &&
            // The API expects auxData to be an object (not an array)
            // To prevent logging failure we check the constructor is Object not Array
            input.auxData.constructor === Object
          ) {
            myEvent.auxData = input.auxData;
          }
          // Check for auth requirements and add the appropriate user identification
          // myEvent.userId if authed
          // myEvent.unauthId if not
          $.f.authCheck().then((authState) => {
            if (!$.v.context.unauthId) {
              // Regardless of whether or not we are signed in, we should always have an unauthId
              $.v.context.unauthId = $.f.context.makeUUID();
              $.f.debug(`No unauthId found; creating one. ${$.v.context.unauthId}`);
            }
            let forceFlush = false;
            if (!authState.auth) {
              $.f.debug('we are not authed');
              if ($.v.context.user && $.v.context.user.id) {
                // If we were authed and log off we should assume the user has changed and change the unauthId
                $.v.context.user = {};
                $.v.context.unauthId = $.f.context.makeUUID();
                $.f.debug($.v.context.unauthId);
                forceFlush = true;
              }
              myEvent.unauthId = $.v.context.unauthId;
              $.f.debug(
                'Auth cookie not found but old userId existed. Removing old userId, setting a new unauthId, and flushing the event queue.',
              );
              $.f.context.addEvent(myEvent, forceFlush);
            } else {
              // we have an auth cookie but no userid yet; let's get it before we log
              // important: we must always query for the current userID,
              // because people switch logins all the time
              $.f
                .load({
                  url: `${$.v.endpoint.api}users/me/?fields=user.id`,
                })
                .then((result) => {
                  $.f.debug('Reply from /users/me/');
                  $.f.debug(result);
                  if (
                    // test API success
                    // do we have status = success?
                    (((result || {}).response || {}).status || {}) === 'success' &&
                    // do we have a user ID?
                    (((result || {}).response || {}).data || {}).id
                  ) {
                    if (!$.v.context.user || !$.v.context.user.id) {
                      // If there isn't a userId, lets save it
                      $.f.debug("There is a new user (there wasn't one before)");

                      $.v.context.user = result.response.data;
                    }
                    if ($.v.context.user.id !== result.response.data.id) {
                      // If our user has changed, lets change it and set the batch to flush
                      $.v.context.user = result.response.data;
                      $.v.context.unauthId = $.f.context.makeUUID();
                      $.f.debug(
                        'The authorized userId has changed unexpectedly; resetting the unauthId and flushing the queue.',
                      );
                      $.f.debug('Resetting unauthId');
                      forceFlush = true;
                    }

                    // If we are authed, attach both the userId and their current unauthId
                    myEvent.userId = $.v.context.user.id;
                    myEvent.unauthId = $.v.context.unauthId;
                  } else {
                    // we have an API error or some other weirdness
                    $.f.debug('Call to /users/me errored out; sending unauthed context event');
                    if ($.v.context.user.id) {
                      // If we saw an error in the api, assume the user is no longer valid and remove them
                      $.f.debug(
                        'We had a userId but the API returned an error. Forgetting that userId, generating a new unauthId, and flushing events.',
                      );
                      $.v.context.user.id = '';
                      $.v.context.unauthId = $.f.context.makeUUID();
                      forceFlush = true;
                    }
                    // use only the unauthId
                    myEvent.unauthId = $.v.context.unauthId;
                  }
                  // batch it!
                  $.f.context.addEvent(myEvent, forceFlush);
                });
            }
          });
        },
      },

      // experiment logic
      experiment: {
        // check for prior activation before sending a request
        getGroupForExperiment: async (experimentName) => {
          // Check $.v.experimentGroup for our experiment.
          // If we can't find the name at all or we do find it but
          // it has not been activated, attempt to activate it.
          if (
            !(experimentName in $.v.experimentGroup) ||
            !$.v.experimentGroup[experimentName].activated
          ) {
            const activated = await $.f.experiment.activate(experimentName);
            const expGroup = (((activated || {}).response || {}).data || {}).group;
            $.f.debug(`Activated experimental group ${expGroup} for experiment ${experimentName}`);
            // update $.v.experimentGroup with expGroup and
            // set activated to true so we don't send a redundant request in the future
            $.v.experimentGroup[experimentName] = {
              group: expGroup,
              activated: true,
            };
          }
          // have we overridden?
          if (($.v.overriddenExperimentGroup || {})[experimentName]) {
            $.v.experimentGroup[experimentName].group =
              $.v.overriddenExperimentGroup[experimentName];
          }
          return $.v.experimentGroup[experimentName].group;
        },
        // helper function that attempts to activate an experiment name
        activate: async (experimentName) => {
          $.f.debug(`Attempting to activate ${experimentName}`);
          const authState = await $.f.authCheck();
          if (!authState.auth && !authState.xRequestForgeryToken) {
            return false;
          }
          experimentData = {};
          experimentData.key = experimentName;
          const formData = new FormData();
          formData.append('experiment_data', JSON.stringify(experimentData));
          const activateResponse = await $.f.load({
            auth: true,
            formData,
            method: 'PUT',
            url: `${$.v.endpoint.api}gatekeeper/activate/`,
            xRequestForgeryToken: authState.xRequestForgeryToken,
          });
          // did we get a good response?
          if ($.f.didCallFail(activateResponse)) {
            $.f.debug(`Activation check for ${experimentName} failed!`);
            return false;
          } else {
            $.f.debug(`Experiment Activation response for ${experimentName}`);
            $.f.debug(activateResponse);
            return activateResponse;
          }
        },
        // Get experiments for an unauth or auth user. Returns both
        // active and untriggered experiments and saves them in $.v.experimentGroup
        getExperimentsWithoutActivation: async () => {
          const authState = await $.f.authCheck();
          if (!authState.auth && !authState.xRequestForgeryToken) {
            return false;
          }
          const experiments = await $.f.load({
            auth: true,
            method: 'GET',
            url: `${$.v.endpoint.api}gatekeeper/experiments/`,
            xRequestForgeryToken: authState.xRequestForgeryToken,
          });
          // did we get a good response?
          if ($.f.didCallFail(experiments)) {
            $.f.debug(`Experiments check failed!`);
            return false;
          } else {
            // clear the experiment map, in case we just switched accounts
            $.v.experimentGroup = {};
            // fill $.v.experimentGroup
            Object.keys(experiments.response.data)
              .filter((key) => key.startsWith('browser_extension'))
              .forEach((key) => {
                $.v.experimentGroup[key] = {
                  group: experiments.response.data[key].group,
                  activated: false,
                };
              });
            return experiments;
          }
        },
      },

      // logging request
      log: (o) => {
        let url = $.v.ctrl.endpoint.log,
          sep = '?';
        o.type = 'extension';
        o.xuid = $.v.xuid;
        o.xv = $.v.xv;
        // do we need to hide our xuid?
        if (o.anon) {
          delete o.xuid;
          delete o.anon;
        }
        // do we need to compress some error detail for login fails?
        if (o.err) {
          let err = undefined;
          /*
            this bit handles errors from _fail_login instances,
            which should send a data object containing timeCheck
            and an authState object containing auth
          */
          if (o.err.data && o.err.authState) {
            err = '_';
            if (!o.err.authState.auth) {
              // auth not found
              err = err + 'a';
            }
            if (o.err.authState.timeCheck !== o.err.data.timeCheck) {
              // time checks did not match
              err = err + 'q';
            }
          }
          // if we have nothing, o.err will remain undefined and be removed in URL build loop
          o.err = err;
        }

        // don't log vias from chrome or firefox processes
        if (o.via && !o.via.match(/^https?:\/\//)) {
          delete o.via;
        }

        // build our URL
        for (let k in o) {
          if (typeof o[k] !== 'undefined') {
            url = url + sep + k + '=' + encodeURIComponent(o[k]);
            sep = '&';
          }
        }
        $.f.debug('Logging: ' + url);
        $.f.load({
          url: url,
          method: 'HEAD',
          responseType: 'text',
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

      // welcome, new user!
      welcome: () => {
        // create a note
        $.f.debug('Creating welcome note');
        // open education page
        $.b.tabs.create({
          url: `https://${$.v.ctrl.server.www}${$.v.ctrl.server.domain}/_/_/about/browser-button/install/?xv=${$.v.xv}`,
        });
        // save timestamp in beenWelcomed
        $.f.setLocal({ beenWelcomed: $.v.sessionStart });
      },

      // send something to content script
      send: (o) => {
        $.f.debug('Request to send message to content script received.');
        $.f.debug(o);
        o.experimentGroup = $.v.experimentGroup;
        // send to the active tab
        $.f.getTab({
          callback: (tab) => {
            // avoid sending to non-http tabs like about:blank
            if (tab.url.match(/^https?:\/\//)) {
              $.f.debug('Active tab has a valid URL: ' + tab.url);
              $.b.tabs.sendMessage(tab.id, o);
            } else {
              $.f.debug('Could not send message; we need http protocol.');
              $.f.debug(tab.url);
            }
          },
        });
      },

      // for image search: convert base64/URLEncoded data component to raw binary data
      makeBlob: (dataURI) => {
        var bytes, mimeType, blobArray;
        if (dataURI.split(',')[0].indexOf('base64') >= 0) {
          bytes = atob(dataURI.split(',')[1]);
        } else {
          bytes = unescape(dataURI.split(',')[1]);
        }
        // separate out the mime component
        mimeType = dataURI.split(',')[0].split(':')[1].split(';')[0];
        // write the bytes of the string to a typed array
        blobArray = new Uint8Array(bytes.length);
        for (var i = 0; i < bytes.length; i++) {
          blobArray[i] = bytes.charCodeAt(i);
        }
        return new Blob([blobArray], { type: mimeType });
      },

      // return a digest for a string
      hash: (input) => {
        /*
          expects:
            method: something subtle.crypto understands like "SHA-1" or "SHA-512"
            str: the string we are hashing
          returns:
            digest: the hash (in hexadecimal)
            input: the original input string
        */
        // pad each item in a buffer with up to eight leading zeroes
        const hex = (b) => {
          let i,
            d = new DataView(b),
            a = [];
          for (i = 0; i < d.byteLength; i = i + 4) {
            a.push(('00000000' + d.getUint32(i).toString(16)).slice(-8));
          }
          return a.join('');
        };
        // make a new utf-8 string
        let b = new TextEncoder('utf-8').encode(input.str);
        // get the digest as a buffer; return it as hex with input string
        return crypto.subtle.digest(input.method, b).then((buffer) => {
          return { digest: hex(buffer), input: input.str };
        });
      },

      // convert an image URL into a data:URI
      getImageData: (o) => {
        return new Promise((resolve) => {
          // Are we making an imageless pin?
          if (!o.url) {
            $.f.debug('No image URL specified; assuming this is an imageless pin.');
            resolve({
              status: 'no_image_url',
            });
            return;
          }

          // if we are NOT using visual search, some other constraints apply
          if (!o.amSearching) {
            // Only convert to data if our control file says it's okay to do so.
            if (!$.v.ctrl.canHaz.saveAsDataURI) {
              $.f.debug('Saving as data URIs not allowed by ctrl.json');
              resolve({
                status: 'disallowed',
                url: o.url,
              });
              return;
            }

            // Don't try to convert any GIFs, which may be animated and will only show the first frame.
            if (o.url.match(/\.gif/)) {
              $.f.debug(o.url + ' is a GIF; do not convert to data blob for saving.');
              resolve({
                status: 'gif',
                url: o.url,
              });
              return;
            }

            // Don't try to convert data URIs, which are already data
            if (o.url.match(/^data/)) {
              $.f.debug('Original URL is already data; no need to convert for saving.');
              resolve({
                status: 'data',
              });
              return;
            }
          }

          let img = document.createElement('IMG');
          img.onload = function () {
            let canvas = document.createElement('CANVAS');

            /*
              Other things we could do here:
              - Make a set of images in the sizes of our choice.
              - Compute an image signature or dominant color.
              - Make a low-resolution placeholder on the fly.
            */

            // $.a.limit.dataUrlWidth is for downsizing images converted to data before saving as new pins
            // test for o.maxWidth first, which is a much smaller number sent by visual search
            if (this.naturalWidth > (o.maxWidth || $.a.limit.dataUrlWidth)) {
              // set canvas dimensions to a target width by proportional height
              canvas.width = o.maxWidth || $.a.limit.dataUrlWidth;
              canvas.height =
                ((o.maxWidth || $.a.limit.dataUrlWidth) / this.naturalWidth) * this.naturalHeight;
            } else {
              // we're already under minimum width, so set canvas dimensions to the image's real dimensions
              canvas.height = this.naturalHeight;
              canvas.width = this.naturalWidth;
              // since we are making a pixel-to-pixel copy, don't allow the browser to try to smooth the image
              canvas.imageSmoothingEnabled = false;
            }

            let output = {
              status: 'ok',
              url: o.url,
              height: this.naturalHeight,
              width: this.naturalWidth,
            };

            // draw and convert to data
            try {
              canvas.getContext('2d').drawImage(this, 0, 0, canvas.width, canvas.height);
              output.height = canvas.height;
              output.width = canvas.width;
              output.dataURI = canvas.toDataURL('image/png');
              $.f.debug('Image conversion to URL succeeded.');
            } catch (error) {
              $.f.debug('Image conversion to URL failed.');
              $.f.debug(error);
            }

            // resolve whatever we have
            resolve(output);
          };

          // this should never happen, since the image has already rendered to the browser
          img.onerror = function () {
            $.f.debug('Image conversion to URL failed.');
            resolve({ status: 'error', url: o.url });
          };

          // setup is complete; source the image to load
          img.src = o.url;
        });
      },

      // actions we are prepared to take when asked by business logic
      act: {
        // open the inline Save overlay
        openSave: (data) => {
          // if we have at least one board
          if (data.boards && data.boards.length > 0) {
            $.f.send({
              to: 'content',
              act: 'openSave',
              data: data,
            });
          }
        },

        // close the inline Save overlay
        closeSave: (o) => {
          $.f.send({ to: 'content', act: 'closeSave' });
        },

        // inline Save overlay needs boards
        getBoardsForSave: (input = {}) => {
          const timestamp = ($.v.boards || {}).timestamp || 0;
          // do we need to pull boards?
          if (Date.now() - timestamp > $.a.ttl.boards) {
            // auth not needed here because overlay won't show if we're unauthed
            // note: this call could be a lot faster if we were not getting all boards
            // if the decision is made against a full inline board picker, let's figure out
            // how to ask for only the last board we pinned
            // if we're keeping the separate board picker we might want to use the stashed results from this call to populate it
            // instead of asking for new boards for each render, which look slower
            $.f
              .load({
                url: $.v.endpoint.api + 'users/me/pins/?page_size=1&add_fields=pin.board()',
              })
              .then((r) => {
                // get boards and send them on a separate thread, so the rest of the pin create form can render quickly
                if ((r.response || {}).data) {
                  // convert board_order_modified_at to timestamp so we can sort by recency
                  const boards = r.response.data.map((pin) => {
                    return pin.board;
                  });
                  // save for next time
                  $.v.boards = {
                    timestamp: Date.now(),
                    data: boards,
                  };

                  if (input.data) {
                    $.f.act.openSave({ ...input.data, boards: $.v.boards.data });
                  }
                } else {
                  $.v.boards.timestamp = 0;
                }
              });
          } else if (input.data) {
            $.f.act.openSave({ ...input.data, boards: $.v.boards.data });
          }
        },

        // add an event to the context logging stack from an overlay
        contextLog: (input) => {
          $.f.context.create(input.data);
        },

        // inject business logic
        injectLogic: (o) => {
          /*
            since all messages are filtered for tab ID, passing it to
            executeScript will prevent situations where someone starts
            loading a slow page, switches to a different tab, and we
            try to inject logic into the current (wrong) tab.
          */
          $.f.debug('Injecting logic into tab ' + o.tabId);
          $.b.tabs.executeScript(o.tabId, {
            file: 'js/logic.js',
          });
        },

        // inject pinmarklet
        injectPinmarklet: (o) => {
          $.f.debug('Injecting pinmarklet into tab ' + o.tabId);
          $.b.tabs.executeScript(o.tabId, {
            file: 'js/pinmarklet.js',
          });
        },

        // save rich data
        saveRichData: (o) => {
          if ((o.data || {}).url) {
            $.f.authCheck().then((authState) => {
              // only save rich data if we are authed
              if (authState.auth && authState.xRequestForgeryToken) {
                // required: link (sent as url)
                // optional: title, description
                const q = {
                  auth: true,
                  xRequestForgeryToken: authState.xRequestForgeryToken,
                  url: `${$.v.endpoint.api}rich_pins/browser_data/`,
                  formData: new FormData(),
                  method: 'POST',
                };
                q.formData.append('link', o.data.url);
                q.formData.append('status_code', '200');
                if (o.data.title) {
                  q.formData.append('title', o.data.title);
                }
                if (o.data.description) {
                  q.formData.append('description', o.data.description.substr(0, 500));
                }
                $.f.load(q).then((r) => {
                  if (r.response.status === 'success') {
                    $.f.debug('Rich data saved.');
                  } else {
                    $.f.debug('Rich data did NOT save.');
                  }
                });
              }
            });
          } else {
            $.f.debug('Not enough data to save rich front end');
          }
        },

        /*
          activates experiment with name and returns a message to caller, triggering callback with group and data (if sent)
          expects: experiment name, caller, callback
          optional: data
        */
        activate: (me) => {
          // Do we have an experiment to check?
          // Do we know what they want us to do with results when we get them back?
          if (me.experimentName && me.callback) {
            // go get groups, activating if necessary, and then...
            $.f.experiment.getGroupForExperiment(me.experimentName).then((group) => {
              $.f.debug(
                `Found group ${group} for experiment ${me.experimentName}; returning to ${me.callback} in ${me.caller}.`,
              );
              // build a return message
              const msg = {
                // where shall we return our output?
                to: me.via,
                // what function should we call when we get there?
                act: me.callback,
                // which group are we in?
                group,
              };
              // do we have a data object we need to pass back with the group?
              if (me.data) {
                // add it to the return message
                msg.data = me.data;
              }
              // send it back
              $.f.send(msg);
            });
          } else {
            $.f.debug(
              'Could not activate and return experiment groups; need name, caller, and callback',
            );
            $.f.debug(me);
          }
        },

        // experiment: browser_extension_follow_from_save_1
        // who is the right Pinterest account to follow for this domain?
        getDomainOwner: (input) => {
          // have we asked for a domain?
          if (input.data && input.data.domain) {
            $.f.authCheck().then((authState) => {
              if (authState.auth && authState.xRequestForgeryToken) {
                const queryOwner = {
                  auth: true,
                  xRequestForgeryToken: authState.xRequestForgeryToken,
                  url: `${$.v.endpoint.api}domains/${input.data.domain}/?add_fields=domain.official_user()&www_mode=equivalent&owned_only=True`,
                };
                $.f.debug('Asking for official user for ' + input.data.domain);
                $.f.debug(queryOwner);
                $.f.load(queryOwner).then((resultOwner) => {
                  // do we have an official_user?
                  if (((((resultOwner || {}).response || {}).data || {}).official_user || {}).id) {
                    // test whether the signed-in user is the domain owner
                    if (
                      // if we're signed in, our user ID has been stored in $.v.context.user.id for event logging
                      (($.v.context || {}).user || {}.id) &&
                      resultOwner.response.data.official_user.id !== $.v.context.user.id
                    ) {
                      // get following relationship between signed-in Pinterest user and the official user
                      const queryFollow = {
                        auth: true,
                        xRequestForgeryToken: authState.xRequestForgeryToken,
                        url: `${$.v.endpoint.api}users/${resultOwner.response.data.official_user.id}/`,
                        method: 'GET',
                      };
                      $.f.debug(queryFollow);
                      $.f.load(queryFollow).then((resultFollow) => {
                        $.f.debug(
                          'Got follow details for ' +
                            resultOwner.response.data.official_user.full_name,
                        );
                        // send details to create overlay
                        $.f.send({
                          to: 'create',
                          act: 'renderFollowNag',
                          data: {
                            input: input.data,
                            output: resultFollow,
                          },
                        });
                      });
                    } else {
                      $.f.debug(`Signed-in user owns this domain, no need to show follow nag.`);
                    }
                  } else {
                    $.f.debug(`Official user NOT found for ${input.data.domain}`);
                  }
                });
              }
            });
          }
        },

        // follow a Pinterest user
        putFollow: (o) => {
          $.f.authCheck().then((authState) => {
            if (authState.auth && authState.xRequestForgeryToken) {
              if (o.data.pinner_id) {
                const q = {
                  auth: true,
                  xRequestForgeryToken: authState.xRequestForgeryToken,
                  url: `${$.v.endpoint.api}users/follow/`,
                  formData: new FormData(),
                  method: o.method || 'PUT',
                };
                q.formData.append('followee_ids', o.data.pinner_id);
                $.f.debug(q);
                $.f.load(q).then((r) => {
                  $.f.debug(r);
                  $.f.debug(`Follow results: ${r.response.status}`);
                  $.f.send({
                    to: 'create',
                    act: 'followResults',
                  });
                  // add a USER_FOLLOW context event with the ID we just followed
                  if (r.response.status === 'success') {
                    $.f.context.create({
                      objectIdStr: o.data.pinner_id,
                      eventType: 'USER_FOLLOW',
                    });
                  }
                });
              }
            }
          });
        },

        // make a new pin or repin
        save: (o) => {
          $.f.authCheck().then((authState) => {
            if (
              authState.auth &&
              authState.xRequestForgeryToken &&
              // allow save.js to bypass timeCheck
              (authState.timeCheck === o.data.timeCheck || o.data.skipTimeCheck)
            ) {
              // o.data.pins is converted into an array in populateCreate
              // here we make a separate call for each pin/repin
              for (let pin of o.data.pins) {
                // required: board ID, URL, and either a remote or data URL OR color for imageless pin
                // optional: description
                const q = {
                  auth: true,
                  xRequestForgeryToken: authState.xRequestForgeryToken,
                  url: `${$.v.endpoint.api}pins/`,
                  formData: new FormData(),
                  method: 'PUT',
                };
                // be ready to log an image url, height, and width
                let extraLogParams = {};

                q.formData.append('method', 'extension');
                q.formData.append('add_fields', 'user.is_partner');
                q.formData.append(
                  'description',
                  // if the pin description is falsy, substitute an empty string so repins don't fail.
                  (pin.description || '').substr(0, 500),
                );
                q.formData.append('board_id', o.data.board);
                if (o.data.section) {
                  // are we pinning to a section?
                  q.formData.append('section', o.data.section);
                }
                if (pin.meta && typeof pin.meta == 'object') {
                  q.formData.append('found_metadata', JSON.stringify(pin.meta));
                }
                // are we making a repin?
                if (pin.id) {
                  q.url = q.url + `${pin.id}/repin/`;
                  q.method = 'POST';
                } else {
                  // add the page URL
                  q.formData.append('source_url', pin.url);
                  // do we have an image?
                  if (pin.media) {
                    /*
                      This is a separate block because we may find data:URIs
                      in the wild and send them straight through
                      without converting them
                    */
                    if (pin.data) {
                      // we will need to save this in addition to raw data
                      pin.orgMedia = pin.media;
                      // our media is now our raw data
                      pin.media = pin.data;
                    }
                    // are we saving a data:URI?
                    if (pin.media.match(/^data/)) {
                      q.formData.append('image_base64', pin.media);
                      // did we convert it from an URL?
                      if (pin.orgMedia) {
                        extraLogParams = {
                          media: pin.orgMedia,
                          height: pin.height,
                          width: pin.width,
                        };
                        q.formData.append('image_url', pin.orgMedia);
                      }
                    } else {
                      extraLogParams = {
                        media: pin.media,
                      };
                      // we are saving an image URL that needs to be crawled
                      q.formData.append('image_url', pin.media);
                    }
                  } else {
                    // we are saving an imageless pin
                    q.formData.append('isGeneratedTextImage', 'true');
                    // do we have a background color?
                    if (pin.color) {
                      q.formData.append('color', pin.color);
                    }
                  }
                }
                $.f.debug('Save Object');
                $.f.debug(q);
                $.f.load(q).then((r) => {
                  $.f.debug('Save results');
                  $.f.debug(r);
                  if ((r.response || {}).status === 'success') {
                    $.f.debug('Pin saved.');
                    // update the most recent board ourselves as it takes time for
                    // board_order_modified_at key to get updated on the backend
                    $.v.boards = {
                      timestamp: Date.now(),
                      data: [
                        {
                          id: o.data.board,
                          name: o.data.boardName,
                        },
                      ],
                    };
                    r.response.data.title = o.data.sectionName;
                    let logMe = {
                      event: 'pin_create_success',
                      client: 'extension',
                      pin_id: r.response.data.id,
                      xm: pin.method,
                      via: pin.via || pin.url,
                      url: pin.url || pin.id,
                    };
                    if ($.v.guid) {
                      logMe.guid = $.v.guid;
                      $.v.guid = '';
                    }
                    $.f.log(logMe);
                    // report this user as a daily average user
                    $.f.context.create({
                      eventType: 'USER_ACTIVE',
                      viewType: 'BROWSER_EXTENSION_DAU',
                    });
                    // log pin create success event
                    $.f.context.create({
                      objectIdStr: r.response.data.id,
                      eventType: 'PIN_CREATE',
                      auxData: {
                        url: pin.funnel_url,
                        funnel_uuid: pin.funnel_uuid,
                      },
                    });

                    // send word to the Create overlay that it worked
                    $.f.send({
                      to:
                        // experiment: browser_extension_hover_board_picker
                        o.from === 'save' ? 'save' : 'create',
                      act: 'newPinWin',
                      data: r.response.data,
                      pin: pin,
                      total: o.data.pins.length,
                    });
                  } else {
                    $.f.debug('Pin failed.');
                    let logMe = {
                      event: 'pin_create_fail_api',
                      client: 'extension',
                      xm: o.data.method,
                      via: o.data.via,
                      url: o.data.url || o.data.id,
                    };
                    if (extraLogParams.media) {
                      logMe.media = extraLogParams.media;
                      // undefined is fine here; it will be filtered out at log time
                      logMe.height = extraLogParams.height;
                      logMe.width = extraLogParams.width;
                    }
                    if ($.v.guid) {
                      logMe.guid = $.v.guid;
                      $.v.guid = '';
                    }
                    $.f.log(logMe);
                    $.f.context.create({
                      eventType: 'PIN_CREATE_FAILURE',
                    });
                    // we are signed in but the pin failed
                    $.f.send({
                      to:
                        // experiment: browser_extension_hover_board_picker
                        o.from === 'save' ? 'save' : 'create',
                      act: 'newPinFail',
                      data: r.response,
                    });
                  }
                });
              }
            } else {
              // lost auth before pin create attempt
              $.f.send({
                to:
                  // experiment: browser_extension_hover_board_picker
                  o.from === 'save' ? 'save' : 'create',
                act: 'newPinFail',
                data: {
                  message: $.v.message.create.msgOops,
                  message_detail: $.v.message.create.msgLoginFail,
                },
              });
              // log pin create fail with enough data to generate an explanation of the error
              $.f.log({
                event: 'pin_create_fail_login',
                board_id: o.data.board,
                err: {
                  data: o.data,
                  authState: authState,
                },
              });
            }
          });
        },

        // grid talks to background, background talks to content
        openCreate: (o) => {
          $.f.send({ to: 'content', act: 'openCreate', data: o.data });
        },

        closeCreate: (o) => {
          $.f.send({ to: 'content', act: 'closeCreate' });
          // be careful to only open pages on Pinterest domains
          if (o.url && o.url.match($.v.pattern.pinterestDomain)) {
            $.b.tabs.create({ url: o.url });
          }
        },

        seeItNow: (o) => {
          $.f.send({ to: 'content', act: 'closeSave' });
          $.b.tabs.create({
            url: `https://${$.v.ctrl.server.www}${$.v.ctrl.server.domain}/pin/${o.data.pinId}/`,
          });
        },

        // close the pinmarklet grid
        closeGrid: (o) => {
          let k, logMe;
          // do we have some extra data we need to log?
          if (o.data) {
            logMe = { act: 'closeGrid' };
            // event will come from grid.js and should be click or keydown
            for (k in o.data) {
              logMe[k] = o.data[k];
            }
            $.f.log(logMe);
          }
          // actually close the grid
          $.f.send({ to: 'content', act: 'closeGrid' });
        },

        // send data to the create form
        populateCreate: (o) => {
          // always get current pinner
          $.f.authCheck().then((authState) => {
            // clear every time we populate or subsequent attempts might have old data

            // check convert data into an array if it's a single object
            const data = Array.isArray(o.data) ? o.data : [o.data];

            /*
              Attempt to convert the image URL we are about to save to a data:URI, so we don't
              have to perform a blocking crawl from the back end at pin create time.  Any lag
              in getting the image data should be less than the time the Pinner waits for the
              board request call to return.
            */

            Promise.all(
              data.map((image) => {
                return $.f.getImageData({ url: image.media }).then((r) => {
                  /*
                    Status returned by getImageData can have several values.  Only if we get an ok
                    message will we try to save the data:URI we get back from getImageData.  If we've
                    found a naturally-occurring data:URI on a page somewhere, it will sail right through
                    getImageData and come back unchanged either way.
                  */

                  // If successful, add the raw data to the same object and send it over in addition to media paramter.
                  // media parameter (original image URL) will remain unchanged either way.
                  if (r.status === 'ok') {
                    image.data = r.dataURI;
                    image.height = r.height;
                    image.width = r.width;
                  }
                });
              }),
            ).then(() => {
              // send enough data to create.js to populate the form
              $.f.send({
                to: 'create',
                act: 'populateCreateForm',
                data: data,
                // this will help us know if login has changed while image picker is up
                timeCheck: authState.timeCheck,
              });
            });

            /*
              Important change for 4.0.80: gate the call for boards on the return from authCheck,
              otherwise we won't have o.data.timeCheck to send over to renderBoards.
            */
            $.f
              .load({
                url:
                  $.v.endpoint.api +
                  'users/me/boards/?base_scheme=https&filter=all&sort=last_pinned_to&add_fields=user.is_partner,board.image_cover_url,board.privacy,board.owner(),user.id,board.collaborated_by_me,board.section_count',
              })
              .then((r) => {
                const data = {};
                // get boards and send them on a separate thread, so the rest of the pin create form can render quickly
                if ((r.response || {}).data) {
                  // convert board_order_modified_at to timestamp so we can sort by recency
                  r.response.data.forEach((board) => {
                    board.ts = new Date(board.board_order_modified_at).getTime();
                    // TODO: access the user object (needs a new API endpoint) to get this every time
                    // $.v.puid is used in search but we are no longer stashing boards so it won't happen reliably
                    if (!$.v.puid && board.collaborated_by_me === false) {
                      // found the pinner ID
                      $.v.puid = board.owner.id;
                    }
                  });
                  // got boards
                  data.boards = r.response.data;
                } else {
                  data.boards = [];
                  $.f.debug('Did not get any boards; sending an empty array.');
                }
                $.f.send({
                  to: 'create',
                  act: 'renderBoards',
                  data: data,
                });
              });
          });
        },

        // send data to the inline save overlay
        populateSave: (o) => {
          $.f.send({
            to: 'save',
            act: 'renderStructure',
            data: o.data,
          });
        },

        // experiment: browser_extension_hover_board_picker
        convertToDataUrl: (o) => {
          $.f.getImageData({ url: o.data.media }).then((r) => {
            // If successful, add the raw data to the same object and send it over in addition to media paramter.
            // media parameter (original image URL) will remain unchanged either way.
            $.f.send({
              to: 'save',
              act: 'updateImageData',
              data: r,
            });
          });
        },

        // send pinmarklet data to the grid
        populateGrid: (o) => {
          $.f.authCheck().then((authState) => {
            // whether or not we are authed, we're going to open the grid
            o.data.auth = authState.auth;
            // send along the global flag to hide search affordance if the user has turned it off
            o.data.hideSearch = $.v.hideSearch;
            // The funnel_uuid and funnel_url are used to indicate the uniqueness of one funnel,
            // since a user can pin multiple images from one domain
            o.data.funnel_uuid = $.f.context.makeUUID();
            o.data.funnel_url = o.data.url;
            // Log that we have received images from pinmarklet
            $.f.context.create({
              eventType: 'SAVE_BROWSER_PIN_IMAGES_FOUND',
              auxData: {
                url: o.data.funnel_url,
                funnel_uuid: o.data.funnel_uuid,
              },
            });

            // send data to grid
            $.f.send({
              to: 'grid',
              act: 'render',
              data: o.data,
            });
          });
        },

        // send data to the search form
        populateSearch: (o) => {
          $.f.authCheck().then((authState) => {
            // search needs to know if we're authed in order to open the right board picker
            o.data.auth = authState.auth;
            // send data to search
            $.f.send({
              to: 'search',
              act: 'populateSearch',
              data: o.data,
            });
          });
        },

        // open the search form
        openSearch: (o) => {
          $.f.send({
            to: 'content',
            act: 'openSearch',
            data: {
              method: o.method || 'r',
              searchMe: o.data.uri,
            },
          });
        },

        // open the search form from the grid
        openSearchFromGrid: (o) => {
          // set the logged method to "g" for "grid"
          $.f.act.openSearch({
            data: {
              method: 'g',
              uri: o.data.searchMe,
            },
          });
          // close the grid
          $.f.act.closeGrid({});
        },

        // close the search form
        closeSearch: (f) => {
          let o = { event: 'click', action: 'close_search' };
          if (f.data.keydown) {
            o.event = 'keydown';
          }
          $.f.log(o);
          $.f.send({ to: 'content', act: 'closeSearch' });
        },

        // visual search; takes an URL or a raw image object
        runSearch: (r) => {
          const q = {
            url: `${$.v.endpoint.api}visual_search/`,
            method: 'GET',
          };
          $.f.debug('running search');

          // expects raw data, not an image URL
          const searchFor = (r) => {
            $.f.debug('searching by raw data');
            q.method = 'PUT';
            q.url = q.url + 'extension/image/';
            q.formData = new FormData();
            q.formData.append('x', r.data.x || 0);
            q.formData.append('y', r.data.y || 0);
            q.formData.append('h', r.data.h || 1);
            q.formData.append('w', r.data.w || 1);
            q.formData.append('client_id=', $.v.ctrl.clientId);
            q.formData.append('base_scheme', 'https');
            q.formData.append(
              'add_fields',
              'pin.pinner(),pin.rich_summary,pin.dominant_color,pin.board()',
            );
            q.formData.append('image', $.f.makeBlob(r.data.img));
            if ($.v.puid) {
              q.formData.append('viewing_user_id', $.v.puid);
            }
            // run the call
            $.f.load(q).then((r) => {
              if ((r.response || {}).status) {
                $.f.debug('Search results');
                $.f.debug(r);
                if (
                  // do we have response data with more than zero things in it?
                  ((r.response || {}).data || {}).length
                ) {
                  $.f.send({
                    to: 'search',
                    act: 'showResults',
                    data: r.response,
                  });
                } else {
                  $.f.send({
                    to: 'search',
                    act: 'searchFail',
                    data: 'Search API call had no results.',
                  });
                  $.f.debug('Search API call had no results.');
                }
              } else {
                $.f.send({
                  to: 'search',
                  act: 'searchFail',
                  data: 'Search API call failed.',
                });
                $.f.debug('Search API call failed.');
              }
            });
          };
          if (r.data.img || r.data.u) {
            if (r.data.img) {
              // we already have raw data in r.data.img
              searchFor(r);
            } else {
              // we will need to convert a web URL to a data URI
              $.f
                .getImageData({
                  url: r.data.u,
                  amSearching: true,
                  // downsample to this size so we're not clogging the network
                  maxWidth: 256,
                })
                .then((imgData) => {
                  r.data.img = imgData.dataURI;
                  searchFor(r);
                });
            }
          } else {
            $.f.debug('runSearch was called without an image or URL, quietly failing');
          }
        },

        // tell logic.js if it should no-pin or no-hover a specific domain
        checkFeatureBlock: (o) => {
          // hash all varations of the domain to catch cases where
          // we are visiting foo.bar.com but bar.com is on the list
          let i,
            domainToCheck,
            parts,
            status = {
              nosearch: false,
              nohover: false,
              nopin: false,
            };
          parts = o.domain.split('.');
          parts.reverse();
          // start with the tld
          domainToCheck = parts[0];
          for (i = 1; i < parts.length; i = i + 1) {
            // add the next path level
            domainToCheck = parts[i] + '.' + domainToCheck;
            // hash it and then check the digest against items loaded from hashList.json on session start
            $.f.hash({ str: domainToCheck, method: 'SHA-1' }).then((result) => {
              // check if our digest is on theOtherList, which contains domains that should never be saved
              $.v.hashList.theOtherList.filter((item) => {
                if (result.digest.match(item)) {
                  $.f.debug(
                    'No-pin list match on ' + domainToCheck + '; pin, search, and hover disabled',
                  );
                  status.nosearch = status.nopin = status.nohover = true;
                }
              });
              // check if our digest is on theList, which contains domains that should not show hovering Save buttons
              $.v.hashList.theList.filter((item) => {
                if (result.digest.match(item)) {
                  $.f.debug('No-hover list match on ' + domainToCheck + '; hover disabled');
                  status.nohover = true;
                }
              });
            });
          }

          // send back the results
          $.f.send({
            to: 'content',
            act: 'renderFeatureBlock',
            data: status,
          });
        },

        // logic would like to know if we are signed in and (if so)
        // if the Pinner allows personalization from offsite browsing
        login: () => {
          $.f.authCheck().then((authState) => {
            // while debugging we show a badge with the version inside.
            // background color reminds us whether we are signed in or not
            if (authState.auth) {
              $.b.browserAction.setBadgeBackgroundColor({ color: 'red' });
              $.f.experiment.getExperimentsWithoutActivation().then(() => {
                // experiment: browser_extension_hover_board_picker
                const expName = 'browser_extension_hover_board_picker';
                const expGroup = ($.v.experimentGroup[expName] || {}).group;
                if (
                  expGroup &&
                  (expGroup.startsWith('enabled') || expGroup.startsWith('employees'))
                ) {
                  $.f.act.getBoardsForSave();
                }
              });
            } else {
              $.b.browserAction.setBadgeBackgroundColor({ color: 'black' });
            }
            // this call was made from the content script, to be sure we're signed in before showing the inline pin create form
            $.f.send({
              to: 'content',
              act: 'pongLogin',
              data: {
                auth: authState.auth,
                pfob: authState.pfob,
              },
            });
          });
        },

        // get sections
        getSections: (o) => {
          // always check auth before we ask for sections
          $.f.authCheck().then((authState) => {
            if (
              authState.auth &&
              authState.xRequestForgeryToken &&
              authState.timeCheck === o.data.timeCheck
            ) {
              // uncomment to test random section API failure
              /*
              if (Math.floor(Math.random() * 2)) {
                o.data.board = 'FAIL';
              }
              */
              const q = {
                auth: true,
                xRequestForgeryToken: authState.xRequestForgeryToken,
                url: `${$.v.endpoint.api}board/${o.data.board}/sections/all/`,
              };
              $.f.load(q).then((r) => {
                if ((r.response || {}).status) {
                  // API has failed; we're going to ask them to log in again
                  if (r.response.status === 'fail') {
                    $.f.send({
                      to: 'create',
                      act: 'renderSectionsFail',
                      data: {
                        message: $.v.message.create.msgOops,
                        message_detail: $.v.message.create.msgLoginFail,
                      },
                    });
                    $.f.log({
                      event: 'section_fetch_fail_api',
                      board_id: o.data.board,
                    });
                  } else {
                    // we're good
                    o.sections = r.response.data;
                    $.f.send({
                      to: 'create',
                      act: 'renderSectionsWin',
                      data: o,
                    });
                    $.f.log({
                      event: 'sections_fetch_success',
                      board_id: o.data.board,
                    });
                  }
                }
              });
            } else {
              // can't ask for sections because we're not signed in
              $.f.debug("Login problem; can't try for sections.");
              $.f.send({
                to: 'create',
                act: 'renderSectionsFail',
                data: {
                  message: $.v.message.create.msgOops,
                  message_detail: $.v.message.create.msgLoginFail,
                },
              });
              // log section fail with enough data to generate an explanation of the error
              $.f.log({
                event: 'sections_fetch_fail_login',
                board_id: o.data.board,
                err: {
                  data: o.data,
                  authState: authState,
                },
              });
            }
          });
        },

        // make a new section
        newSection: (o) => {
          // required: board id, section title
          $.f.authCheck().then((authState) => {
            if (
              authState.auth &&
              authState.xRequestForgeryToken &&
              authState.timeCheck === o.data.timeCheck
            ) {
              const q = {
                auth: true,
                xRequestForgeryToken: authState.xRequestForgeryToken,
                method: 'PUT',
                url: `${$.v.endpoint.api}board/${o.data.board}/sections/?`,
              };
              if (o.data.title && o.data.board) {
                // new sections are PUTs, so we need all parameters in the URL
                q.url = q.url + 'title=' + encodeURIComponent(o.data.title);
                $.f.load(q).then((r) => {
                  $.f.debug('Section create results');
                  $.f.debug(r);
                  if ((r.response || {}).status === 'success') {
                    $.f.log({
                      event: 'section_create_success',
                      board_id: o.data.board,
                      section_id: r.response.data.id,
                    });
                    $.f.send({
                      to: 'create',
                      act: 'newSectionWin',
                      data: r.response.data,
                    });
                  } else {
                    $.f.log({
                      event: 'section_create_fail_api',
                      board_id: o.data.board,
                    });
                    // create needs to do something with this error
                    $.f.send({
                      to: 'create',
                      act: 'newSectionFail',
                      data: r.response,
                    });
                  }
                });
              }
            } else {
              // lost auth before section create attempt
              $.f.send({
                to: 'create',
                act: 'newSectionFail',
                data: {
                  message: $.v.message.create.msgOops,
                  message_detail: $.v.message.create.msgLoginFail,
                },
              });
              // log section create fail with enough data to generate an explanation of the error
              $.f.log({
                event: 'section_create_fail_login',
                board_id: o.data.board,
                err: {
                  data: o.data,
                  authState: authState,
                },
              });
            }
          });
        },

        // make a new board
        newBoard: (o) => {
          // required: board name
          // optional: secret (true/false)
          $.f.authCheck().then((authState) => {
            if (
              authState.auth &&
              authState.xRequestForgeryToken &&
              authState.timeCheck === o.data.timeCheck
            ) {
              const q = {
                auth: true,
                xRequestForgeryToken: authState.xRequestForgeryToken,
                method: 'PUT',
                url: $.v.endpoint.api + 'boards/?',
              };
              if (o.data.name) {
                // new boards are PUTs, so we need all parameters in the URL
                q.url = q.url + 'name=' + encodeURIComponent(o.data.name);
                if (o.data.secret) {
                  q.url = q.url + '&privacy=secret';
                }
                $.f.load(q).then((r) => {
                  $.f.debug('Board create results');
                  $.f.debug(r);
                  if ((r.response || {}).status === 'success') {
                    $.f.log({
                      event: 'board_create_success',
                      board_id: r.response.data.id,
                    });
                    $.f.send({
                      to: 'create',
                      act: 'newBoardWin',
                      data: r.response.data,
                    });
                    $.f.context.create({
                      objectIdStr: r.response.data.id,
                      eventType: 'BOARD_CREATE',
                    });
                  } else {
                    $.f.log({ event: 'board_create_fail_api' });
                    $.f.send({
                      to: 'create',
                      act: 'newBoardFail',
                      data: r.response,
                    });
                  }
                });
              }
            } else {
              // lost auth before board create attempt
              $.f.send({
                to: 'create',
                act: 'newBoardFail',
                data: {
                  message: $.v.message.create.msgOops,
                  message_detail: $.v.message.create.msgLoginFail,
                },
              });
              // log board create fail with enough data to generate an explanation of the error
              $.f.log({
                event: 'board_create_fail_login',
                err: {
                  data: o.data,
                  authState: authState,
                },
              });
            }
          });
        },

        // show or hide context menus, and other important stuff
        refreshContextMenus: (o) => {
          // check if we should flush context logs
          if ($.f.context.shouldFlush()) {
            $.f.context.sendBatch();
          }
          // check to see when the last support files were loaded
          if (!$.v.timeFilesLoaded || Date.now() - $.v.timeFilesLoaded >= $.a.ttl.files) {
            $.f.debug('Support files are older than ' + $.a.ttl.files + '; reloading.');
            $.f.bulkLoad({ callback: () => {} });
          } else {
            $.f.debug('Support files are fresh; no need to reload.');
          }
          // set the global hideSearch flag
          if (o.data.nosearch === true) {
            $.v.hideSearch = true;
          } else {
            $.v.hideSearch = false;
          }
          // always kill context menus; we will re-enable them if needed
          $.f.disableFeatures({ menus: true });

          // have we found a reason to disable pinning?
          if (o.data.nopin) {
            // set disabled icon for the browser button
            $.f.disableFeatures({ button: true });
            // context menus have already been removed
            $.f.debug('data.nopin encountered; no context menus for you!');
          } else {
            // we did not find a reason to disable pinning, so make your context menus
            $.f.debug('no data.nopin encountered; making context menus');
            // set enabled icon for the browser button
            $.b.browserAction.setIcon({ path: 'img/icon_toolbar.png' });
            // save
            try {
              $.b.contextMenus.create({
                id: 'rightClickToPin',
                title: $.b.i18n.getMessage('saveAction'),
                // only fire for images
                contexts: ['image'],
                onclick: () => {
                  $.f.send({ to: 'content', act: 'contextSave' });
                },
              });
              if (!$.v.hideSearch) {
                $.f.debug('You get the Search context menu.');
                $.b.contextMenus.create({
                  id: 'search',
                  title: $.b.i18n.getMessage('searchAction'),
                  contexts: ['page', 'frame', 'selection', 'editable', 'video', 'audio'],
                  onclick: () => {
                    $.b.tabs.captureVisibleTab((uri) => {
                      $.f.debug('screen captured');
                      $.f.send({
                        to: 'content',
                        act: 'openSearch',
                        data: { method: 'r', searchMe: uri },
                      });
                    });
                  },
                });
              } else {
                $.f.debug('Login NOT found; no Search menu for you.');
              }
              $.f.debug('context menu create success.');
            } catch (err) {
              $.f.debug('context menu create FAIL.');
              $.f.debug(err);
            }
          }
        },

        // log events
        log: (o) => {
          $.f.log(o.data);
        },
      },

      // the uninstall URL opens in a new tab when the extension is removed
      setUninstallURL: () => {
        // build an URL that will log the current version and xuid on uninstall
        const uninstallUrl = `https://${$.v.ctrl.server.www}${$.v.ctrl.server.domain}/_/_/about/browser-button/uninstall/?xv=${$.v.xv}`;
        // set it -- this is NOT in local storage, so should not be cleared by privacy utils
        $.b.runtime.setUninstallURL(uninstallUrl);
        $.f.debug('setting uninstall URL to ' + uninstallUrl);
      },

      // be sure we have an xuid, which is a persistent identifier we can use for funnel analysis
      checkXuid: () => {
        // if we have not found this in local storage, make one
        if (!$.v.xuid) {
          $.v.xuid = $.f.random60();
          $.f.debug('new XUID: ' + $.v.xuid);
          // save for later
          $.f.setLocal({ xuid: $.v.xuid });
        }
        // always set the uninstall URL whether or not we have made a new xuid
        // because we want the current version in the uninstall URL
        $.f.setUninstallURL();
      },

      // see if we have just installed or updated the extension
      checkInstallObj: () => {
        // INSTALL_OBJ has been set previous to main script loading
        // don't do anything unless we have a reason
        if ((INSTALL_OBJ || {}).reason) {
          // checking for xuid will also update the uninstall URL
          $.f.checkXuid();
          // reasons are: install, update, chrome_update, or shared_module_update
          // not sure if chrome_update will be browser_update for other browsers
          const logMe = {
            event: INSTALL_OBJ.reason,
          };
          // if we're updating, add the previous version
          if (INSTALL_OBJ.previousVersion) {
            logMe.previousVersion = INSTALL_OBJ.previousVersion;
          }
          // log it
          $.f.log(logMe);
          // if this is an install, show the welcome page
          if (INSTALL_OBJ.reason === 'install') {
            $.f.context.create({
              eventType: 'INSTALL',
            });
            $.f.welcome();
          }
        }
      },

      // in memoriam: i.o.hook
      houseKeep: () => {
        // overwrite ctx (context logging control values) with settings from $.a.ctx
        $.v.ctrl.ctx = $.a.ctrl.ctx;

        let i;

        // build a string like cr4.0.77
        // for logging and setting data-pinterest-extension-installed
        for (i = 0; i < $.a.browserTest.length; i = i + 1) {
          if ($.w.navigator.userAgent.match($.a.browserTest[i].r)) {
            $.v.xv = $.a.browserTest[i].k + $.b.runtime.getManifest().version;
            switch ($.a.browserTest[i].k) {
              case 'cr':
                $.v.browserType = $.v.ctrl.ctx.BrowserTypes.CHROME;
                break;
              case 'ff':
                $.v.browserType = $.v.ctrl.ctx.BrowserTypes.FIREFOX;
                break;
              case 'ms':
                $.v.browserType = $.v.ctrl.ctx.BrowserTypes.EDGE; // #TODO: When a Microsoft Edge type exists, update this
                break;
              case 'op':
                $.v.browserType = $.v.ctrl.ctx.BrowserTypes.OPERA;
                break;
              default:
                $.v.browserType = $.v.ctrl.ctx.BrowserTypes.OTHER;
            } // #TODO: When/if Safari supports the extension, add it to the cases with keyphrase 'sa'
            break;
          }
        }
        // always overwrite the version on session start
        $.f.setLocal({ xv: $.v.xv });

        // check (create if needed) our extension user identifier
        $.f.checkXuid();

        // create API endpoint
        $.v.endpoint.api = `https://${$.v.ctrl.server.api}${$.v.ctrl.server.domain}/v3/`;

        // create trk endpoint for context logging
        $.v.endpoint.trk = `https://${$.v.ctrl.server.trk}${$.v.ctrl.server.domain}/v3/`;

        // set these in local storage so support files know if we're debugging and business logic file locations
        $.f.setLocal({ debug: $.a.debug });

        // we have an xuid so we can log a session
        $.f.log({ event: 'session' });

        // since we can't store a regex pattern in a pure JSON object, we will need to build from strings
        for (let k in $.v.pattern) {
          try {
            // only attempt to update the pattern if we have it in ctrl.pattern
            if ($.v.ctrl.pattern[k]) {
              $.v.pattern[k] = new RegExp($.v.ctrl.pattern[k]);
            }
          } catch (err) {
            $.f.debug(
              "Can't create a regex from  " +
                $.v.ctrl.pattern[k] +
                ' ... sticking with ' +
                $.v.pattern[k],
            );
          }
        }

        // check if our onInstalled listener caught anything
        $.f.checkInstallObj();
      },

      // disable browser button or context menus
      disableFeatures: (o) => {
        /*
          Optional: { menus: true | false, button: true | false }
        */
        if (o.menus) {
          // kill context menus
          $.b.contextMenus.removeAll();
        }
        if (o.button) {
          // gray out the browser button icon
          $.b.browserAction.setIcon({
            path: 'img/disabled/icon_toolbar.png',
          });
        }
      },

      getTab: (o) => {
        if (o.callback) {
          $.b.tabs.query({ active: true, currentWindow: true }, (tab) => {
            // do we have an array of tabs, is there at least one tab, does it have an URL?
            if (((tab || {})[0] || {}).url) {
              o.callback(tab[0]);
            } else {
              /*
                Something else failed higher up, leaving us without an array of tabs to check.
                Do nothing; next tab refresh will hopefully sort things out.
              */
              $.f.debug(
                "Tab or window switch detected but no tabs came back from query; this tab may contain an URL that won't run our logic.",
              );
            }
          });
        }
      },

      /*
        any time we switch tabs or windows, check to see if we should show browser button or context menus
        triggered by: tabs.onActivated and windows.onFocusChanged, which are set in the callback from $.f.bulkLoad
      */
      tabSwitch: () => {
        $.f.debug('Tab switch detected.');
        // get the active tab
        $.f.getTab({
          callback: (tab) => {
            // can we save from this URL?
            if (tab.url.match(/^https?:\/\//)) {
              // are we on a known Pinterest app domain?
              if (tab.url.match($.v.pattern.pinterestDomain)) {
                /*
                  if we're on a Pinterest domain we may not have had time to run our logic, so:
                  - disable browser button
                  - disable context menus
                */
                $.f.debug(
                  'On a known Pinterest app domain; no need to refresh context; disabling pinning features.',
                );
                $.f.disableFeatures({ menus: true, button: true });
              } else {
                /*
                  We might be able to save from this URL, so:
                  - ask the focused tab to please tell us whether it found any nopins
                  - we'll refresh context menus and browser button when we get the callback to $.f.refreshContextMenus
                */
                $.b.tabs.sendMessage(tab.id, {
                  to: 'content',
                  act: 'refreshContext',
                });
              }
            } else {
              /*
                We can't save from non-browser windows or URLs that start with something funky like chrome:, file:, or about:
                so we're going to pre-emptively disable pinning features
              */
              $.f.debug(
                'Focus changed to a non-http tab or non-browser window; disabling pinning features.',
              );
              $.f.disableFeatures({ menus: true, button: true });
            }
          },
        });
      },

      // start a session
      init: () => {
        const messages = {};
        // overlays are: create, search, save, and grid
        // we also have: logic, which alerts
        // this grabs all possible messages one time and
        // sends them via localStorage instead of using
        // the i18n API every time, which is slow/blockish
        for (let overlay in $.a.translateThese) {
          messages[overlay] = {};
          for (let pair in $.a.translateThese[overlay]) {
            // check for exact match for overlay_pair,
            // then just pair,
            // and use english default if not found
            messages[overlay][pair] =
              $.b.i18n.getMessage(overlay + '_' + pair) ||
              $.b.i18n.getMessage(pair) ||
              $.a.translateThese[overlay][pair];
          }
        }
        $.f.debug('Messages retrieved from i18n:');
        $.f.debug(messages);
        // once messages are in local storage, they will be available to each overlay when it loads
        $.f.setLocal({ msg: messages });
        // background also needs global access to messages to send login fail errors
        $.v.message = messages;

        // load support files
        $.f.bulkLoad({
          callback: () => {
            $.f.houseKeep();

            // if someone clicks our browser action, run pinmarklet.js
            $.b.browserAction.onClicked.addListener((r) => {
              let o = { to: 'content', act: 'openGrid' };
              $.f.send({ to: 'content', act: 'closeCreate' });
              $.f.send(o);
              $.f.log({ event: 'click', action: 'open_grid' });
            });

            // if we're debugging, show our version number on the badge
            if ($.a.debug) {
              $.b.browserAction.setBadgeText({
                text: $.b.runtime.getManifest().version.replace(/\./g, ''),
              });
              // ten-second TTL for experiments while debugging
              $.a.ttl.experiments = 10000;
            }

            // if an incoming message from script is for us and triggers a valid function, run it
            $.b.runtime.onMessage.addListener((request, sender, sendResponse) => {
              $.f.debug('Incoming message received');
              $.f.debug(request);
              if (request.to === $.a.me) {
                if (request.act && typeof $.f.act[request.act] === 'function') {
                  // see if we can tell what tab the message came from
                  if (((sender || {}).tab || {}).id) {
                    // add the tabId to the request so we can specify it if needed
                    request.tabId = sender.tab.id;
                  }
                  $.f.act[request.act](request);
                }
              }
            });

            // listen for tab change so we can refresh context menus
            $.b.tabs.onActivated.addListener(() => {
              $.f.tabSwitch();
            });

            // listen for window focus change
            $.b.windows.onFocusChanged.addListener(() => {
              $.f.tabSwitch();
            });

            /*
            // revert to see if it solves BUG-115225
            // when talking to the API, append our title and version to the user-agent string
            $.b.webRequest.onBeforeSendHeaders.addListener(
              function (e) {
                e.requestHeaders.filter((header) => {
                  if (header.name === 'User-Agent') {
                    header.value += ' Pinterest Save Button/' + $.b.runtime.getManifest().version;
                  }
                });
                return { requestHeaders: e.requestHeaders };
              },
              { urls: [`${$.v.endpoint.api}*`] },
              ['blocking', 'requestHeaders'],
            );
            */

            // block requests to certain Pinterest URLs
            $.b.webRequest.onBeforeRequest.addListener(
              (e) => {
                // can we try to block pinmarklet?
                if ($.v.ctrl.canHaz.localImagePicker) {
                  // are we trying to run pinmarklet?
                  if (e.url.match($.v.pattern.pinmarklet)) {
                    $.v.guid = '';
                    // are we inside another page rather than trying to load pinmarklet itself in a new tab?
                    // e.initiator = Chrome; e.originUrl = Firefox
                    if (e.initiator || e.originUrl) {
                      // close the create form if it's currently open
                      $.f.send({ to: 'content', act: 'closeCreate' });
                      // get ready to log the interception event
                      let logMe = {
                        event: 'interception',
                        action: 'open_grid',
                      };
                      // get params from call to pinmarklet
                      let params = new URLSearchParams(e.url.split('?')[1]);
                      // do we have a guid?
                      if (params.get('guid')) {
                        // add it to logging ping
                        logMe.guid = $.v.guid = params.get('guid');
                      }
                      // log it
                      $.f.log(logMe);
                      // open grid
                      $.f.send({
                        to: 'content',
                        act: 'openGrid',
                      });

                      // cancel the request to pinmarklet.js
                      return {
                        cancel: true,
                      };
                    }
                  }
                }
              },
              {
                urls: ['*://*.pinterest.com/*'],
              },
              ['blocking'],
            );

            // set the initial state of the debug flag on our browser button
            $.f.act.login();
          },
        });
      },
    },
  });
  // get everything in local storage and then init
  $.f.getLocal({ cb: 'init' });
})(window, {
  k: 'BG',
  debug: DEBUG,
  browserTest: [
    {
      k: 'ff',
      r: / Firefox\//,
    },
    {
      k: 'op',
      r: / OPR\//,
    },
    {
      k: 'ms',
      r: / Edg\//,
    },
    {
      k: 'cr',
      r: / Chrome\//,
    },
  ],
  me: 'background',
  // refresh these items if they are older than some number of milliseconds
  ttl: {
    // how often should we check ctrl.json and hashList.json for updates?
    files: 3600000,
    // how often should we check experiments for updates?
    experiments: 3600000,
    // one-minute cache for boards
    boards: 900000,
  },
  ctrl: {
    ctx: {
      flushEventTypes: {
        '1': true,
        '13': false,
        '20': true,
        '7564': false,
        '8219': true,
        '8221': false,
      },
      flushTypes: {
        '1': true,
        '20': true,
        '8219': true,
        '270': true,
        '272': true,
      },
      flushConstants: {
        timeoutNanoseconds: 300000000000,
        numEvents: 20,
      },
      EventTypes: {
        PIN_CREATE: 1,
        VIEW: 13,
        BOARD_CREATE: 20,
        USER_FOLLOW: 45,
        CLICK: 101,
        SAVE_BROWSER_PIN_IMAGES_FOUND: 2900,
        SAVE_BROWSER_PIN_IMAGES_NOT_FOUND: 2901,
        PIN_CREATE_FAILURE: 7564,
        USER_ACTIVE: 7137,
        INSTALL: 8219,
        BROWSER_SESSION: 8221,
      },
      ViewTypes: {
        BOARD_PICKER: 21,
        BROWSER_EXTENSION_DAU: 192,
        IMAGE_PICKER: 268,
        CREATE_BOARD: 269,
        PIN_CREATE_SUCCESS: 270,
        FOLLOW_FROM_SAVE: 271,
        FOLLOW_FROM_SAVE_SUCCESS: 272,
        BOARD_SECTION_CREATE: 274,
        BOARD_SECTION_PICKER: 275,
        BROWSER_EXTENSION_OPTIONS: 276,
      },
      ElementTypes: {
        BOARD_COVER: 36,
        CREATE_BUTTON: 44,
        PIN_SAVE_BUTTON: 48,
        SECTION_COVER: 11854,
      },
      AppTypes: {
        BROWSER_EXTENSION: 8,
      },
      BrowserTypes: {
        OTHER: 0,
        CHROME: 1,
        SAFARI: 2,
        IE: 3,
        FIREFOX: 4,
        OPERA: 5,
        EDGE: 7,
      },
    },
  },
  // a short list of legacy hashes no longer being maintained in managed lists
  theOtherList: [
    '05ae1d0135c1',
    '0c4e6e46540b',
    '129e2089d8b8',
    '15c442d8f57b',
    '1b551d2f2233',
    '3bb3293aa4f9',
    '592bd1529ad2',
    '5cd69c1c51a8',
    '67fa18caa358',
    '6c62158de5d4',
    '7da2f8f258db',
    '9af245e8c2d5',
    '9d5cb16066e3',
    'a20c46b653b0',
    'b7c70898d90f',
    'd095fd7b7ac1',
    'd2944127ec33',
    'e42128ea2bf8',
    'e43ff7b11415',
    'efa3a2deb839',
    'faf820a6e7ba',
    'ff33e73a21b1',
  ],
  limit: {
    dataUrlWidth: 1000,
  },
  file: ['ctrl', 'hashList'],
  digits: '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ_abcdefghijkmnopqrstuvwxyz',
  // each overlay has its own sub-object with keys and values
  // duplication for things like saveAction are needed because each
  // overlay only sees its subset of messages
  translateThese: {
    search: {
      headerMessage: 'More like this from Pinterest',
      saveAction: 'Save',
      msgOops: 'Oops!',
    },
    grid: {
      choosePin: 'Choose a Pin to save',
      saveAction: 'Save',
      choosePinMultiSelectHeader: 'Save an idea to Pinterest',
      choosePinMultiSelectSubHeader: 'Select up to ten images',
      nextAction: 'Next',
      loadingMessage: 'Loading images...',
    },
    logic: {
      saveAction: 'Save',
      noPinDomain:
        'Sorry, pinning is not allowed from this domain. Please contact the site operator if you have any questions.',
    },
    save: {
      saveAction: 'Save',
      boardPickerOpenerLabel: 'Save to board',
      boardPickerSuccessLabel: 'Saved to',
      visitButton: 'Visit',
      help: 'Help',
      // error header
      msgOops: 'Oops!',
      // pin create fail
      msgPinFail: 'Could not save this page',
    },
    create: {
      // follow a user
      followButton: 'Follow',
      // main header in Save form
      chooseBoard: 'Choose board',
      // Creates the pin
      saveAction: 'Save',
      // placeholder text in Search input
      filter: 'Search',
      // interstitial header in board list
      topChoices: 'Top choices',
      // interstitial header in board list
      allBoards: 'All boards',
      // header in Create form
      outerAddFormOpener: 'Create board',
      // placeholder text in Create Board input
      placeholderFilterAddBoard: 'Such as "Places to Go"',
      // placeholder text in Create Section input
      placeholderFilterAddSection: 'Like "Lighting"',
      // placeholder text in Pin description
      placeholderDescription: 'Tell us about this Pin...',
      // label over secret/not-secret switch
      addFormSecretLabel: 'Secret',
      // label for board sections
      chooseSection: 'Choose section',
      // label to add section
      addSection: 'Add Section',
      // switch option yes
      optYes: 'Yes',
      // switch option no
      optNo: 'No',
      // cancel create
      closeAddForm: 'Cancel',
      // create new board
      submitAddForm: 'Create',
      // board identifier
      msgPinSavedTo: 'Saved to %',
      // board create fail
      msgBoardFail: 'Could not create new board',
      // pin create fail
      msgPinFail: 'Could not save this page',
      // pin create success send
      msgSendAfterSave: 'Send',
      // pin / board create success button
      msgSeeItNow: 'See it now',
      // pin / board create success button
      msgSeeOnPinterest: 'See on Pinterest',
      // pin create success close
      msgClose: 'Close',
      // partners: invite to promote pin after create
      msgPromoteYourPin: 'Promote your Pin',
      // error header
      msgOops: 'Oops!',
      // error when we try do something that requires a login and we can't find it
      // most likely this will happen when someone has the image picker up in one tab and
      // signs out, clears cookies, or changes accounts in another tab without reloading
      msgLoginFail:
        "Sorry, something's not quite right here. Please check that you are logged into Pinterest and try again.",
      // get help button
      msgHelp: 'Get Help',
    },
  },
});
