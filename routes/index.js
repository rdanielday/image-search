var express = require('express');
var request = require('request');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var mLab = 'mongodb://' + process.env.MONGO_USER + ':' + process.env.MONGO_PASS + '@ds163698.mlab.com:63698/image-search';
var searchUrl = 'https://www.googleapis.com/customsearch/v1?key=' + process.env.API_KEY + '&cx=' + process.env.API_ENGINE + '&searchType=image&start='

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Image Search Abstraction', host: req.get('host') });
});

router.get('/new/imagesearch', function(req, res) {
  var query = '&q=' + req.query.q;
  var start = parseInt(req.query.start) * 10 + 1 || 1;
  var newQuery = { query: req.query.q, date: (new Date()).toDateString() };
  
  request(searchUrl + start.toString() + query, function(err, result, body) {
    if (err) throw err;
    var JSONresults = JSON.parse(body);
    var results = [];
    JSONresults.items.forEach(function(item) {
      results.push({
        url: item.link,
        snippet: item.snippet,
        thumbnail: item.image.thumbnailLink,
        context: item.image.contextLink
      });
    });
    res.json(results);
  });
  
  MongoClient.connect(mLab, function(err, db) {
    if (err) throw err;
    console.log('Connected to database');
    var collection = db.collection('queries');
    var newSearch = function(db, callback) {
      collection.insertOne(newQuery, function(err) {
        if (err) throw err;
      });
    };
    
    newSearch(db, function() {
      db.close();
    });
    
  });
});

router.get('/imagesearch', function(req, res) {
  MongoClient.connect(mLab, function(err, db) {
    if (err) throw err;
    var collection = db.collection('queries');
    var findQueries = function(db, callback) {
      var results = collection.find({}, {
        query: 1, 
        date: 1, 
        _id: 0
      }).toArray().then(function(data) {
        var lastTen = data.reverse().slice(0,10);
        res.json(lastTen);
      });
    };
    
    findQueries(db, function() {
      db.close();
    });
  });
});

module.exports = router;
