const express = require('express');
const helmet = require('helmet');

const useragent = require('useragent');
const browserslist = require('browserslist');
const { matchesUA } = require('browserslist-useragent');

const browsers = require('./browsers');
function getBrowserDiv(name, allowedBrowsers) {
  let browser = browsers[name];
  if (!browser) {
    return '';
  }

  return `
    <div class="browser">
      <div class="browser-name"><h3>${browser.name}</h4></div>
      <div class="browser-logo"><img src="images/${browser.image}"></div>
      <strong class="browser-version-label">Minimum Version Required</strong>
      <p class="browser-version">${allowedBrowsers[name]}</p>
      <div class="browser-download"><a href="${browser.downloadLink}" target="_blank">Download</a></div>
    </div>
  `;
}

const app = express();

// add some security-related headers to the response
app.use(helmet());

app.use(express.static('.'));

app.get('/', (req, res) => {
  let userAgent = req.headers['user-agent'];
  let agent = useragent.parse(req.headers['user-agent']);
  let parsedUA = agent.toAgent() || [];

  let defaultBrowsers = encodeURI('last 3 chrome versions, last 3 firefox versions, last 3 safari versions');
  let browsersPassed = req.query.browsers || defaultBrowsers;
  let targetBrowsers = decodeURI(browsersPassed);
  let targetBrowsersArray = targetBrowsers.split(',');
  let isUASupported = matchesUA(userAgent, {
    browsers: targetBrowsersArray,
    allowHigherVersions: true
  });

  let allowedBrowsers = {};
  targetBrowsersArray.forEach((targetBrowser) => {
    let browser = browserslist(targetBrowser);
    let minimumVersion = browser[browser.length - 1] || '';
    let [name, version] = minimumVersion.split(' ');
    allowedBrowsers[name] = version;
  });

  let containerContents = '';
  Object.keys(allowedBrowsers).forEach(browser => {
    containerContents += getBrowserDiv(browser, allowedBrowsers);
  });

  res.set('Content-Type', 'text/html');
  res.send(200, `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Update your browser</title>
        <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,700" rel="stylesheet">
        <link href="css/styles.css" rel="stylesheet">
      </head>
      <body>
        <div class="header">
          <h1>You are currently using ${parsedUA}</h1>
          ${isUASupported ? '' : '<p>Please update to one of the below browser versions.</p>'}
        </div>
        <div class="container">
          ${containerContents}
        </div>
        <div class="footer">
          <div class="footer-element">Contribute on <a target="_blank" href="">GitHub</a></div>
          <div class="footer-element">&middot;</div>
          <div class="footer-element">Uses <a target="_blank" href="https://github.com/browserslist/browserslist">browserslist</a></div>
        </div>
      </body>
    </html>
  `);
});

app.listen(1511)

module.exports = app;
