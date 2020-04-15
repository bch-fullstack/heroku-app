var express = require('express');
var PORT = process.env.PORT || 5000;
var fetch = require('node-fetch');
var app = express();
var mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin:admin@node-js-test-app-joh4o.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true });

var db = mongoose.connection;

db.on('error', function (err) {
	console.log('An error has occured while establishing connection with DB: ' + err);
});

db.on('open', function () {
	console.log('Connected to DB');
});

var Schema = mongoose.Schema;

var gifSchema = new Schema({
	giphy_id: String,
	keyword: String,
	isSticker: Boolean,
	orig: String,
	orig_mp4: String,
	loop: String
});

var Gif = mongoose.model('Gif', gifSchema);

function handleJSON(json) {
	if (!json.data) {
		return;
	}

	var result = [],
		imgs = json.data;

	imgs.forEach(function(img){
		Gif.findOne({ giphy_id: img.id }, function (err, record) {
			if (err) {
				console.log('An error has occurred: ' + err);
				return;
			}

			if (record) {
				console.log('Duplicated record found. Abort saving.');
				return;
			}

			// if it reaches this point, it means no error or duplication found
			console.log('Saving new record ...');
			var newGif = new Gif();
			newGif.giphy_id = img.id;
			newGif.keyword = img.title;
			newGif.isSticker = img.is_sticker;
			newGif.orig = img.images.original.url;
			newGif.orig_mp4 = img.images.original_mp4.mp4;
			newGif.loop = img.images.looping.mp4;
			newGif.save()
				.then(function () {
					console.log('Saved new record to DB');
				})
				.catch(function (err) {
					console.log('Error while saving to DB: ' + err);
				});
		});

		result.push(img.images.original.url);
	});

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

app.get('/api/everything/:query', function (req, res) {
	if (!req.params.query) {
		res.send('No result found from database');
		return;
	} 
	
	var regex = new RegExp(req.params.query, 'i'),
		query = { keyword: regex };
	
	Gif.find(query, function (err, resp) {
		res.send(resp);
	});
});


app.get('/api/wipe', function (req, res) {
	Gif.deleteMany({}, function (err, resp) {
		res.send('Wiped');
	});
});

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