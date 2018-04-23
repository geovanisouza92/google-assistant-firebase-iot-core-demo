"use strict";

const functions = require("firebase-functions");
const google = require("googleapis").google;
const dialogflow = require("dialogflow-fulfillment");

process.env.DEBUG = "dialogflow:debug";

const RESPONSES = [
  "Certo, só um momento",
  "Ok, me dê um segundo",
  "Ok, vou ligar a luz",
  "Beleza, estou ligando as luzes"
];

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
  (request, response) => {
    const agent = new dialogflow.WebhookClient({ request, response });
    console.log(
      "Dialogflow Request headers: " + JSON.stringify(request.headers)
    );
    console.log("Dialogflow Request body: " + JSON.stringify(request.body));

    function ligarLuz() {
      agent.add(getRandomResponse());

      return getIotClient()
        .then(client => {
          return setDeviceConfig(client, {
            luzAcessa: true
          });
        })
        .catch(err => console.error(err));
    }

    function getRandomResponse() {
      return RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
    }

    let intentMap = new Map();
    intentMap.set("Ligar a luz", ligarLuz);
    return agent.handleRequest(intentMap);
  }
);

function getIotClient() {
  const jwtAccess = new google.auth.JWT();
  jwtAccess.fromJSON(functions.config().credentials);
  jwtAccess.scopes = "https://www.googleapis.com/auth/cloud-platform";
  google.options({ auth: jwtAccess });
  return google.discoverAPI(
    "https://cloudiot.googleapis.com/$discovery/rest?version=v1",
    {}
  );
}

function setDeviceConfig(client, data) {
  const cloudRegion = "us-central1";
  const deviceId = "luz-teste";
  const projectId = "goog-assist-firebase-iot-demo";
  const registryId = "luzes";
  const version = 0;
  const parentName = `projects/${projectId}/locations/${cloudRegion}`;
  const registryName = `${parentName}/registries/${registryId}`;

  const binaryData = Buffer.from(JSON.stringify(data)).toString("base64");
  const request = {
    name: `${registryName}/devices/${deviceId}`,
    versionToUpdate: version,
    binaryData: binaryData
  };

  return client.projects.locations.registries.devices.modifyCloudToDeviceConfig(
    request,
    (err, data) => {
      if (err) {
        console.log("Could not update config:", deviceId);
        console.log("Message: ", err);
      } else {
        console.log("Success :", data);
      }
    }
  );
}
