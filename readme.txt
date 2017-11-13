readme.txt

'''''''''''''''''
overview

'''''''''''''''''

imageCollector

git
https://console.cloud.google.com/functions/details/us-central1/imageCollector?project=project-blue-cat

flow
- inputs 
  - { "category" : "TherapeuticMassage" }
- gets data from GCP Datastore Entity:ProductContent (for the given category)
- if the ProductContent contains images, then we will loop through the images and save them to GCP Storage
	- Entity:  ProductContent
	  - the product page
	  - images:  json contruct for all images on the page
	  - imageStoragePath:  path within GCP Storage where the images will be stored

'''''''''''''''''
dev setup

'''''''''''''''''
Installing Cloud SDK
https://cloud.google.com/sdk/downloads

NodeJS / NPM
https://nodejs.org/en/download/

Quickstart Using the Command-Line
https://cloud.google.com/ml-engine/docs/quickstarts/command-line


'''''''''''''''''
run / test

'''''''''''''''''

locally
install local emmulator
https://cloud.google.com/functions/docs/emulator

cd to function directory /collection/functions/image-collector
start emulator
node "C:\Users\[USER]\AppData\Roaming\npm\node_modules\@google-cloud\functions-emulator\bin\functions" start

deploy function to local emulator
node "C:\Users\[USER]\AppData\Roaming\npm\node_modules\@google-cloud\functions-emulator\bin\functions" deploy imageCollector --trigger-http

call function (deployed to local emulator)
node "C:\Users\[USER]\AppData\Roaming\npm\node_modules\@google-cloud\functions-emulator\bin\functions" call imageCollector --data '{ \"site\":\"backpage.com\", \"category\":\"ComputerServices\" }'

reading the logs (when run locally)
...  console.log('a log message');
https://cloud.google.com/functions/docs/monitoring/logging

call the deployed version via commandline
gcloud beta functions call imageCollector --data '{ \"category\":\"ComputerServices\" }'


call from GCP console
https://console.cloud.google.com/functions/details/us-central1/imageCollector?project=project-blue-cat&tab=testing&duration=PT1H
{ "category" : "ComputerServices" }
{ "category" : "TherapeuticMassage" }
'''''''''''''''''
deploy to GCP

'''''''''''''''''
https://cloud.google.com/functions/docs/deploying/

from local
gcloud beta functions deploy imageCollector --stage-bucket project-blue-cat-functions --trigger-http

from git
gcloud beta functions deploy imageCollector --source-url https://source.developers.google.com/p/project-blue-cat/r/hack --source-path /collection/functions/image-collector --trigger-http
