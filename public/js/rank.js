function renderRank(data) {
    data.forEach(function (rankData) {
        var rankEl = document.createElement('li');
        rankEl.innerText = rankData.user + ': ' + rankData.score;
        document.getElementById('result').appendChild(rankEl);
    });
}


var apiUrl = '/api/rank';

fetch(apiUrl)
    .then(function (resp) {
        return resp.json();
    })
    .then(function (data) {
        renderRank(data);
    })
    .catch(function (err) {
        console.log('An error has occurred: ' + err);
    });