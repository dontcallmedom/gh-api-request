`gh-api-request` is a wrapper around the Github API v3 with the following features:
* each request is added to a queue of requests that takes care of the API rate limitations
* whenever the result of a request is paged, it fetches all the pages

# Install
npm install gh-api-request

# Usage
```js
const ghrequest = require('gh-api-request');

ghrequest.ghToken = 'foobar'; // Set to your Github API token

// Optional
ghrequest.userAgent = 'My User Agent https://example.com'; // defaults to Node Github API Request queue https://github.com/dontcallmedom/gh-api-request/

request('https://api.github.com/user/issues')
       .then(issues =>
          /* all issues of the user, even if paged */
          console.log(JSON.stringify(issues, null, 2)
        );
```