const fs = require('fs');

const {
    Client
} = require("@notionhq/client");

const {
    env
} = require('process');

require('dotenv').config();

// Initializing a client
const notion = new Client({
    auth: process.env.NOTION_TOKEN,
})

const GEO_FILE = 'docs/data.js'

;
(async () => {

    fs.writeFileSync(GEO_FILE, `const features = {
        type: "FeatureCollection",
        features:[`);

    const myPage = await notion.databases.query({
        database_id: process.env.DATABASE
    });

    const googlemapExpr = /@(\-?[\0-9\.]+),(\-?[?0-9\.]+),([0-9z]+)/

    myPage.results.forEach(i => {
        const title = i.properties['Name'];
        if (title.title.length == 0)
            return;

        const name = title.title[0].plain_text;
        const url = i.properties['GoogleMap'].url;
        const presentation = i.properties['Presentation'].rich_text.map(m => m.plain_text).join(' ');
        const coordinates = googlemapExpr.exec(url);
        const lat = coordinates[1];
        const lng = coordinates[2];

        fs.appendFileSync(GEO_FILE, `{
            type: "Feature",
            geometry: {
                type: "Point", coordinates: [${lng}, ${lat}]
            },
            properties: {
                popupContent: \`${presentation}\`,
                icon: {
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                }
            }            
        },`)

    })

    fs.appendFileSync(GEO_FILE, `]};`)
})()