'use latest';

import fetch from 'node-fetch';
import orderBy from 'lodash.orderBy';

const baseUrl = 'https://bikeshare.metro.net'
const getStations = () => fetch(`${baseUrl}/stations/json`)
    .then(response => response.json())
    .then(response => response.features);

const getDirections = (key, from, to) => fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${from.lat},${from.lon}&destination=${to.lat},${to.lon}&mode=bicycling&key=${key}`)
    .then(response => response.json());

const getDirectionsLink = (from, to) => `https://www.google.com/maps/dir/'${from.lat},${from.lon}'/'${to.lat},${to.lon}'/@${from.lat},${from.lon},16z/data=!3m1!4b1!4m10!4m9!1m3!2m2!1d${from.lon}!2d${to.lat}a${to.lon}!1d${from.lat}2${from.lon}!3e1`

module.exports = (ctx, cb) => {
    const resolve = cb.bind(null, null);
    const reject = cb;

    console.log('City', ctx.params.city);
    console.log('Twitter account', ctx.params.screenName);
    console.log('Hashtag', ctx.params.hashtag);

    getStations()
        .then(stations => stations
            .filter(station => station.properties.addressCity === ctx.params.city)
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
        .then(result => {
            if (result.bikesToMove === 0) return Promise.reject(result);
            return result;
        })
        .then(result => ({
            status: `${ctx.params.hashtag} #BikeShareChallenge: take ${result.bikesToMove} bikes from ${result.fullest.name} to ${result.emptiest.name} (${result.distance}, ${result.duration}) ${result.link}`,
        }))
        .then(resolve)
        .catch(reject);
};