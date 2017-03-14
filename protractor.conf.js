'use strict';

let browserName = process.env.BROWSER || (process.env.CI ? 'firefox' : 'chrome');

let config = {
  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    browserName: browserName
  },

  framework: 'jasmine2',
  baseUrl: 'http://localhost:3000',

  // Spec patterns are relative to the current working directly when
  // protractor is called.
  specs: ['src/test/e2e/**/*.js'],

  // Options to be passed to Jasmine-node.
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  }
};

if (browserName === 'firefox') {
  config.directConnect = false;
  config.seleniumAddress = 'http://localhost:4444/wd/hub';
} else if (browserName === 'chrome') {
  config.directConnect = true;
}

exports.config = config;
