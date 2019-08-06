const Queue = require('promise-queue'),
      parse = require('parse-link-header'),
      request = require('request');

const queue = new Queue(Infinity, 1);
const ghCache = {};

let retryAfter = 0;

exports.ghToken = null;
exports.userAgent = "Node Github API Request queue https://github.com/dontcallmedom/gh-api-request/";

exports.verbose = false;

const queueGhRequest = function(url) {
  if (!exports.ghToken) {
    throw new Error("github API Token not set in ghToken, aborting");
  }
  if (!url.startsWith('https://api.github.com/')) {
    throw new Error("Expected URL starting with https://api.github.com/, got " + url + ", aborting");
  }
  if (!ghCache[url]) {
    ghCache[url] = queue.add(function() {
      return new Promise(function (resolve, reject) {
        setTimeout(function() {
          if (exports.verbose)
            console.log("requesting " + url);
          request({
            method: 'GET',
            url: url,
            headers: {
              'User-Agent': exports.userAgent,
              'Authorization': 'token ' + exports.ghToken
            }
          }, function (error, response, body) {
            const ret = {};
            if (error) return reject(error);
            if (response.headers['retry-after']) {
              retryAfter = response.headers['retry-after'];
            }
            if (response.statusCode == 403 && response.headers['retry-after']) {
              // requeue for later
              return queueGhRequest(url);
            } else if (response.statusCode > 400) reject({status: response.statusCode, body: body});
            let obj = [];
            if (body) {
              try {
                obj = JSON.parse(body);
              } catch (e){
                reject(e);
              }
            }
            ret.responseObject = obj;
            if (response.headers['link']) {
              const parsed = parse(response.headers['link']);
              if (parsed.next) {
                ret.nextPage = parsed.next.url;
              }
            }
            if (ret.nextPage) {
              ghCache[url] = queueGhRequest(ret.nextPage).then(obj => resolve(ret.responseObject.concat(obj))).catch(reject);
            } else {
              resolve(ret.responseObject);
            }
          });
        }, retryAfter*1000);
      });
    });
  }
  return ghCache[url];
};

exports.request = queueGhRequest;
