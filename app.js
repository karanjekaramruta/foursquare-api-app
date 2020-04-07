require('dotenv').config();
const express = require('express');
const https = require('https');
const bodyParser = require("body-parser");
const nodeGeocoder = require('node-geocoder');
const ejs = require("ejs");
const env = require('dotenv');

//Client key and secret
const clientId = process.env.FOUR_SQUARE_CLIENT_ID;
const clientSecret = process.env.FOUR_sQUARE_CLIENT_SECRET;
const versionInfo = process.env.FOUR_SQUARE_VERSION_INFO;

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

var venues = [];

let options = {
    provider: 'google',
    apiKey: process.env.GOOGLE_API_KEY
};

app.get("/", function (req, res) {
    res.render("home");
})

app.post("/", function (req, postResponse) {

    //get the postcode entered by user
    var postCode = req.body.postCode;

    //find the lattitude and longitude based on user's postcode using google geocode api
    let geoCoder = nodeGeocoder(options);

    geoCoder.geocode(postCode)
        .then((res) => {
            latitude = res[0].latitude.toFixed(2);
            longitude = res[0].longitude.toFixed(2);

            //get the venue details using FourSquare API based on latitude and longitude
            const apiUrl = "https://api.foursquare.com/v2/venues/explore?ll=" + latitude + "," + longitude +
                "&client_id=" + clientId + "&client_secret=" + clientSecret + "&v=" + versionInfo + "&limit=15";

            var content = "";

            https.get(apiUrl, function (response) {
                response.on("data", function (chunk) {
                    content += chunk;
                });

                response.on('end', function () {
                    var data = JSON.parse(content);
                    var items = data.response.groups[0].items;

                    items.forEach(function (item) {
                        var venueName = item.venue.name;
                        var venueFormattedAddress = item.venue.location.formattedAddress[0];
                        var venueType = item.venue.categories[0].name;
                        var venueIcon = item.venue.categories[0].icon;
                        var iconUrl = venueIcon.prefix + "88" + venueIcon.suffix;
                        var locationParameters = latitude + ", " + longitude;

                        const venue = {
                            name: venueName,
                            address: venueFormattedAddress,
                            type: venueType,
                            iconUrl: iconUrl,
                            locationParams: locationParameters,
                        };

                        venues.push(venue);

                    });

                    postResponse.render("venue", { venues: venues });
                })

                venues = [];

                response.on('error', function (error) {
                    console.log("Error while calling endpoint", error);
                })
            })
        })
        .catch((err) => {
            console.log(err);
        });

})

app.listen(3000, function () {
    console.log("sever is up and running on port 3000");
});