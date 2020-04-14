const express = require('express');
const PORT = process.env.PORT || 5000;
const fetch = require('node-fetch');
const app = express();



var mongoose = require('mongoose');

mongoose.connect('mongodb+srv://admin:admin@node-js-test-app-joh4o.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true });

var Schema = mongoose.Schema;

var gifSchema = new Schema({
	giphy_id: String,
	keyword: String,
	isSticker: Boolean,
	trending_time: Date,
	orig: String,
	orig_mp4: String,
	loop: String
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Database connection error: '));
db.on('open', console.log.bind(console, 'Database connection established'));

function handleJSON(json) {
	if (!json.data) {
		return;
	}

	var result = [],
		counter = json.data.length;

	while (counter--) {
		try {
			var referenceItem = json.data[counter];

			var Gif = mongoose.model('Gif', gifSchema);

			Gif.findOne({ giphy_id: referenceItem.id }, function (err, newGif) {
				if (err) {
					console.log('Error while trying to check for duplicates: ' + err);
				}

				if (newGif) {
					console.log('Duplicate found. Abort overwrite. ');
					return;
				}

				var newGif = new Gif();
				newGif.giphy_id = referenceItem.id;
				newGif.keyword = referenceItem.title;
				newGif.isSticker = referenceItem.is_sticker;
				newGif.orig = referenceItem.images.original.url;
				newGif.orig_mp4 = referenceItem.images.original_mp4.mp4;
				newGif.loop = referenceItem.images.looping.mp4;
				newGif.save()
					.catch(function (err) {
						console.log('Error with DB saving: ' + err);
					});

			});

			result.push(referenceItem.images.original.url);
		} catch (err) {
			console.log('An error has occurred while processing GIHPY response: ' + err);
		}
	}

	return result;
}

function buildUrl(endpoint, params) {
	return endpoint + '?api_key=' + params.apiKey + '&q=' + params.searchTerm;
}

function fetchGif(apiUrl) {
	return fetch(apiUrl)
		.then(function (resp) {
			return resp.json();
		})
		.then(function (json) {
			var formattedData = handleJSON(json);
			return formattedData;
		})
		.catch(function (err) {
			res.send('An error has occurred: ' + err);
		});
}

app
	.use(express.static(__dirname + '/public/'))
	.listen(PORT, () => console.log(`Listening on ${PORT}`));

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/views/pages/search.html');
});

app.get('/api/getDB', function (req, res) {
	var Gif = mongoose.model('Gif', gifSchema);
	Gif.find({}, function (err, newGif) {
		if (err) {
			console.log('Error while trying to check for duplicates: ' + err);
		}

		if (newGif) {
			res.send(newGif);
		}
	});	
});

app.get('/api/cleanDB', function (req, res) {
	var Gif = mongoose.model('Gif', gifSchema);
	Gif.deleteMany({}, function (err, newGif) {
		if (err) {
			console.log('Error while trying to check for duplicates: ' + err);
		}

		if (newGif) {
			res.send('DB is now wiped clean');
		}
	});	
})

app.post('/api/gif/:searchTerm', function (req, res) {
	var gifEndPoint = 'http://api.giphy.com/v1/gifs/search',
		stickerEndPoint = 'http://api.giphy.com/v1/stickers/search',
		params = {
			apiKey: 'fIHqnkqtM7ST2n3JkRogMqokprhiWs7h',
			searchTerm: req.params.searchTerm
		},
		gifEndPointUrl = buildUrl(gifEndPoint, params),
		stickerEndPointUrl = buildUrl(stickerEndPoint, params),
		promises = [fetchGif(gifEndPointUrl), fetchGif(stickerEndPointUrl)];

	Promise.all(promises)
		.then(function (resp) {
			res.send({
				gifs: resp[0],
				stickers: resp[1]
			});
		})
		.catch(function (err) {
			res.send('An Error has occured: ' + err);
		});
});