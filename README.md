# BikeXBot - Precursor to BikeShareSystem

This is a precursor to [BikeShareSystem](https://github.com/thzinc/BikeShareSystem). It's a Twitter bot that sends out regular #BikeShareChallenge tweets on a schedule.

## Quickstart

This project runs as an Auth0 Webtask. To get started with the `challenger`, create a copy of [.secrets-template](.secrets-template) and name it `.secrets-dtla`.

### Set up

* Sign up for [Auth0 Webtasks](https://webtask.io/make)
* Grab the Webtask CLI: `npm install wt-cli -g`
* Init the Webtask CLI: `wt init`
* Create a [Twitter app](https://apps.twitter.com)
* Copy `.secrets-template` file to `.secrets` and fill it in with your data from above

### Running

Run the following to create and publish a Webtask:

```bash
cd challenger
npm install
npm run start
```

This starts a process that watches for changes to `index.js` and updates the Webtask.

## Code of Conduct

We are committed to fostering an open and welcoming environment. Please read our [code of conduct](CODE_OF_CONDUCT.md) before participating in or contributing to this project.

## Contributing

We welcome contributions and collaboration on this project. Please read our [contributor's guide](CONTRIBUTING.md) to understand how best to work with us.

## License and Authors

[![Daniel James logo](https://secure.gravatar.com/avatar/eaeac922b9f3cc9fd18cb9629b9e79f6.png?size=16) Daniel James](https://github.com/thzinc)

[![license](https://img.shields.io/github/license/thzinc/bikexbot.svg)](https://github.com/thzinc/bikexbot/blob/master/LICENSE)
[![GitHub contributors](https://img.shields.io/github/contributors/thzinc/bikexbot.svg)](https://github.com/thzinc/bikexbot/graphs/contributors)

This software is made available by Daniel James under the MIT license.