'use latest';

import fetch from 'node-fetch';

module.exports = (ctx, cb) => {
    const resolve = cb.bind(null, null);
    const reject = cb;

    var responses = Object.keys(ctx.secrets)
        .filter(key => /\d+_(GET)/.test(key))
        .map(key => ctx.secrets[key])
        .map(url => fetch(url).then(response => response.json()));

    Promise.all(responses)
        .then(resolve)
        .catch(reject);
};