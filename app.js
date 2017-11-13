var express = require('express');
var request = require('request');
var fs = require('fs');

var site = "backpage.com";
var rootURI = "http://seattle.backpage.com/";
var dataStoreEntity_ProductContent = 'ProductContent';
var bucketRoot = 'project-blue-cat-images';
var config = {
  projectId: 'project-blue-cat'
};
var topicName = 'projects/project-blue-cat/topics/posting-scrape-complete-notify'

const Datastore = require('@google-cloud/datastore');
const Storage = require('@google-cloud/storage');
const PubSub = require('@google-cloud/pubsub');
const datastore = Datastore(config);
const storage = Storage(config);
const pubsub = PubSub();
const topic = pubsub.topic(topicName);

function handleGET (req, res) {
  console.log('handleGET');
  res.status(200).send('use post (passing in json construct for arguments)');
}

function handlePUT (req, res) {
  console.log('handlePUT');
  res.status(403).send('Put not supported!');
}

function handlePOST (req, res) {

  console.log('handlePOST');
  var site = req.body.site;
  var category = req.body.category;

  var getProductContentsCallback = function(productContents){
    console.log('getProductContentsCallback callback');
    console.log('collectImages productContents.length=' + productContents.length);

    collectImages(productContents, collectImagesCallback);
  }

  var collectImagesCallback = function(numberOfImagesProcessed){
    console.log('collectImagesCallback callback');
    console.log('numberOfImagesProcessed=' + numberOfImagesProcessed)

    console.log('complete');
    res.status(200).send('complete');
  }

  getProductContents(site, category, getProductContentsCallback);
}

function getProductContents(site, category, callback) {

  console.log('getProductContents site=' + site + ' category=' + category);

  getProductContentsQuery(site, category).then((productContents) => {
    callback(productContents);
  });
}

function generateEvent(productContent) {
  // Insert a message to the queue - message contains the image storage path
  // of the images that were just saved, as well as the ID of the source page (in Datastore)
  var message = {};
  message.event = 'IMAGE_LOAD_COMPLETE';
  message.sourcePageReferenceID = 'http:/' + productContent.imagesStoragePath;
  message.imageLocation = productContent.imagesStoragePath;
  topic.publish(message);
}

function collectImages(productContents, callback) {

  console.log('collectImages productContents.length=' + productContents.length);
  var numberOfImagesProcessed = 0;
  var bucket = storage.bucket(bucketRoot);
  var numberOfProductContentsToProcess = productContents.length;

  console.log('numberOfProductContentsToProcess= ' + numberOfProductContentsToProcess);
  productContents.forEach(function(productContent, productContentIndex) {

    if(productContent.images != null && productContent.images.length > 0){
      console.log('productContent.images.length ' + productContent.images.length);
      var imagesStoragePath = productContent.imagesStoragePath;

      productContent.images.forEach(function(image) {

        var fileName = image.fileName;
        numberOfImagesProcessed++;
        //console.log('save image to storeage path=' + path + ' image.uri=' + image.uri);

        /*
        // from local
        var localReadStream = fs.createReadStream('zebra.jpg');
        var remoteWriteStream = bucket.file(path + fileName).createWriteStream();
        localReadStream.pipe(remoteWriteStream)
          .on('error', function(err) {})
          .on('finish', function() {
            console.log('finished upload to storage uri=' + image.uri);
          });
        */

        // from image url
        request.head(image.uri, {encoding: 'binary'}, function(error, response, body) {

          //console.log('content-type:', response.headers['content-type']);
          //console.log('content-length:', response.headers['content-length']);

          var remoteWriteStream = bucket.file(imagesStoragePath + fileName).createWriteStream();
          request(image.uri).pipe(remoteWriteStream).on('response', function(){
            console.log('file saved to gcp datastore =' + image.uri);
            console.log(response.statusCode) // 200
            console.log(response.headers['content-type'])
          });
        });
      });

      // Generate an event, telling collaborators that this
      // post (ad) has been fully pulled (HTML and images),
      // and that it's ready for additional processing.
      generateEvent(productContent);
    }

    console.log('productContentIndex= ' + productContentIndex + ', numberOfProductContentsToProcess=' + numberOfProductContentsToProcess);
    if(productContentIndex == numberOfProductContentsToProcess){
      callback(numberOfImagesProcessed);
    }


  }

);
}

function getProductContentsQuery(site, category) {
  const query = datastore.createQuery(dataStoreEntity_ProductContent)
    //.select(['key', 'images'])
    .limit(50);

  return datastore.runQuery(query)
    .then((results) => {
      const entities = results[0];
      return entities;
    });
}

/**
 * Responds to a POST request
 *
 * @example
 * gcloud alpha functions call imageCollector
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.imageCollector = function imageCollector (req, res) {
  switch (req.method) {
    case 'GET':
      handleGET(req, res);
      break;
    case 'PUT':
      handlePUT(req, res);
      break;
    case 'POST':
      handlePOST(req, res);
      break;
    default:
      res.status(500).send({ error: 'Something blew up!' });
      break;
  }
};
