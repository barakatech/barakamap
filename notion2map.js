const fs = require('fs');

const {
    Client
} = require("@notionhq/client");

const {
    env
} = require('process');

const axios = require('axios');

const https = require('https');

require('dotenv').config();

// Initializing a client
const notion = new Client({
    auth: process.env.NOTION_TOKEN,
})

const GEO_FILE = 'docs/data.json';

const donwloadFile = async (url, name) => {
    console.log(name)
    const output = fs.createWriteStream(name);
    https.get(url, (res) => {
        res.pipe(output);
    })
}


(async () => {

    const myPage = await notion.databases.query({
        database_id: process.env.DATABASE
    });

    const googlemapExpr = /@(\-?[\0-9\.]+),(\-?[?0-9\.]+),([0-9z]+)/

    const features = {
        type: "FeatureCollection",
        features: []
    };

    await Promise.all(myPage.results.map(async (i) => {
        const title = i.properties['Name'];
        if (title.title.length == 0)
            return;

        const name = title.title[0].plain_text;
        const url = i.properties['GoogleMap'].url;
        let presentation = i.properties['Presentation'].rich_text.map(m => m.plain_text).join(' ');
        const coordinates = googlemapExpr.exec(url);
        if (!coordinates)
            return;
        const lat = coordinates[1];
        const lng = coordinates[2];
        const picture = (i.properties.Picture.files[0] || {}).file;
        if (picture) {
            await donwloadFile(picture.url, `docs/${name}.jpg`)
            presentation += `<br/><image style="width:auto; max-width:150px;max-height:150px;" src="${name}.jpg"/>`
        }

        features.features.push({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [`${lng}`, `${lat}`]
            },
            properties: {
                popupContent: `${presentation}`,
                icon: {
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                }
            }
        })

        return true;
    }))
    const json = JSON.stringify(features, null, 12);
    fs.writeFileSync(GEO_FILE, json)
})()