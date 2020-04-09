document.getElementById('search-btn').addEventListener('click', function(event){
    event.preventDefault();

    var searchTerm = document.getElementById('searchTerm').value,
        apiUrl = '//bch-node-learning.herokuapp.com/api/gif/' + searchTerm,
        opt = {
            method: 'POST'
        };

    fetch(apiUrl, opt)
        .then(function(resp){
            return resp.json();
        })
        .then(function(json){
            console.log(json);
        })
        .catch(function(err){
            console.log('An error has occurred: ' + err);
        });
});