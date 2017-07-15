'use latest';

import Twitter from 'twitter';
import fetch from 'node-fetch';
import orderBy from 'lodash.orderby';

const baseUrl = 'https://bikeshare.metro.net'
const getStations = () => fetch(`${baseUrl}/stations/json`)
    .then(response => response.json())
    .then(response => response.features);

const getDirections = (key, from, to) => fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${from.lat},${from.lon}&destination=${to.lat},${to.lon}&mode=bicycling&key=${key}`)
    .then(response => response.json());

const getDirectionsLink = (from, to) => {
    const center = {
        lat: (from.lat + to.lat) / 2,
        lon: (from.lon + to.lon) / 2,
    };
    return `https://www.google.com/maps/dir/'${from.lat},${from.lon}'/'${to.lat},${to.lon}'/@${center.lat},${center.lon},16z/data=!3m1!4b1!4m10!4m9!1m3!2m2!1d${from.lon}!2d${from.lat}!1m3!2m2!1d${to.lon}!2d${to.lat}!3e1`;
}

module.exports = (ctx, cb) => {
    const resolve = cb.bind(null, null);
    const reject = cb;

    const client = new Twitter({
        consumer_key: ctx.secrets.TWITTER_CONSUMER_KEY,
        consumer_secret: ctx.secrets.TWITTER_CONSUMER_SECRET,
        access_token_key: ctx.secrets.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: ctx.secrets.TWITTER_ACCESS_TOKEN_SECRET
    });

    const isDryRun = ctx.data.dryRun === "true";
    const post = (options) => isDryRun || !options.shouldPost
        ? options
        : client.post('statuses/update', options);

    getStations()
        .then(stations => stations
            .filter(station => station.properties.kioskConnectionStatus === "Active")
            .filter(station => station.properties.addressCity === ctx.secrets.CITY)
            .map(station => ({
                name: station.properties.name,
                lon: station.geometry.coordinates[0],
                lat: station.geometry.coordinates[1],
                bikesAvailable: station.properties.bikesAvailable,
                docksAvailable: station.properties.docksAvailable,
            })))
        .then(stations => ({
            fullest: orderBy(stations, ['bikesAvailable', 'docksAvailable'], ['desc', 'desc']).find(x => x),
            emptiest: orderBy(stations, ['bikesAvailable', 'docksAvailable'], ['asc', 'desc']).find(x => x),
        }))
        .then(selectedStations => getDirections(ctx.secrets.GOOGLE_API_KEY, selectedStations.fullest, selectedStations.emptiest)
            .then(directions => ({
                link: getDirectionsLink(selectedStations.fullest, selectedStations.emptiest),
                distance: directions.routes
                    .map(route => route.legs
                        .map(leg => leg.distance.text)
                        .find(x => x))
                    .find(x => x),
                duration: directions.routes
                    .map(route => route.legs
                        .map(leg => leg.duration.text)
                        .find(x => x))
                    .find(x => x),
                fullest: selectedStations.fullest,
                emptiest: selectedStations.emptiest,
            })))
        .then(selectedStations => ({
            link: selectedStations.link,
            distance: selectedStations.distance,
            duration: selectedStations.duration,
            fullest: selectedStations.fullest,
            emptiest: selectedStations.emptiest,
            bikesToMove: Math.min(
                Math.floor((selectedStations.fullest.bikesAvailable - selectedStations.emptiest.bikesAvailable) / 2),
                selectedStations.emptiest.docksAvailable
            )
        }))
        .then(result => ({
            shouldPost: result.bikesToMove > 0,
            status: `${ctx.secrets.PREFIX} ${ctx.secrets.HASHTAG} #BikeShareChallenge: go from ${result.fullest.name} to ${result.emptiest.name} (${result.distance}, ${result.duration}) ${result.link}`,
        }))
        .then(post)
        .then(resolve)
        .catch(reject);
};