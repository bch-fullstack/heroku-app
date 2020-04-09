const express = require('express')
const PORT = process.env.PORT || 5000

const app = express();

app
	.use(express.static(__dirname + '/public/'))
	.listen(PORT, () => console.log(`Listening on ${PORT}`));

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/views/pages/search.html');
});

app.post('/api/gif/:searchTerm', function(req, res){
	res.send('POST request successful');
});