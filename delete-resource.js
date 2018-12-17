const kc = require('kubernetes-client')
const fs = require('fs');
yaml = require('js-yaml');
const Promise = require('bluebird');
_ = require('lodash');
const {
  convertArrayToCSV
} = require('convert-array-to-csv');
const converter = require('convert-array-to-csv');
const sampleDeployment = require('./sample-deployment.json');


const kubeConfigExists = true;
const MAX_COUNT = 10;
const BATCH_SIZE = 5;


const configValue = kubeConfigExists ? kc.config.fromKubeconfig('./kubeconfig.yaml') : {
  url: 'https://10.244.14.249:9443',
  cert: fs.readFileSync('kube-client-cert.pem'),
  key: fs.readFileSync('kube-client-key.pem'),
  insecureSkipTlsVerify: true
}
const client = new kc.Client({
  config: configValue,
  version: '1.9'
});

const crdJson = yaml.safeLoad(fs.readFileSync('./deployment-crd.yaml', 'utf8'));
client.addCustomResourceDefinition(crdJson);


let dataObjects = [];

let actualDataObjects = [];

const deleteAll = function (count) {
  return Promise.try(() => client.loadSpec()
    .then(() => {
      let startDelete = Date.now();
      dataObjects.push({
        count: count,
        startDelete: startDelete
      });
      return client.apis['deployment.servicefabrik.io'].v1alpha1.namespaces('default').directors(`dddd-${count}`).delete();
    })
    .then(() => {
      let obj = _.find(dataObjects, ['count', count])
      let timeForDelete = Date.now() - obj.startDelete;
      obj.delete = timeForDelete;
      actualDataObjects.push(_.pick(obj, ['count', 'get', 'post', 'filter', 'delete']));
    }))
};

const chunk = (array, batchSize = BATCH_SIZE) => {
  const chunked = [];
  for (let i = 0; i < array.length; i += batchSize) {
    chunked.push(array.slice(i, i + batchSize))
  }

  return chunked;
}

// Replace with real data
const chunkedData = chunk([...Array(MAX_COUNT + 1).keys()]);

const reducer = (chain, batch) => chain
  .then(() => Promise.all(
    batch.map(d => deleteAll(d))
  ));

const promiseChain = chunkedData.reduce(
  reducer,
  Promise.resolve()
);

return promiseChain
  .then(() => console.log('delete done'))
  .then(() => {
    _.remove(actualDataObjects, function (n) {
      return n.count == 0;
    });
    _.remove(dataObjects, function (n) {
      return n.count == 0;
    });
    console.log(actualDataObjects);
    const actualCsvFromArrayOfObjects = convertArrayToCSV(actualDataObjects);
    const completeCsvFromArrayOfObjects = convertArrayToCSV(dataObjects);
    fs.writeFile("datafile/dataDelete.csv", actualCsvFromArrayOfObjects, function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("The file was saved!");
    });

    fs.writeFile("datafile/completeDataDelete.csv", completeCsvFromArrayOfObjects, function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("The file was saved!");
    });
  })

// function deleteAll() {
//   var promises = [];
//   for (count = 1; count < MAX_COUNT + 1; count++) {
//     var promise = ((count) => {})(count);
//     promises.push(promise);
//   }
//   return promises;
// }

function massageData(sampleDeployment, count) {
  let returnedDeployment = _.cloneDeep(sampleDeployment);
  returnedDeployment.metadata.name = returnedDeployment.metadata.name + `-${count}`;
  if (count % 100 === 0) {
    if (returnedDeployment.metadata.labels) {
      returnedDeployment.metadata.labels['sample_label'] = 'hundreds';
    } else {
      returnedDeployment.metadata.labels = {
        'sample_label': 'hundreds'
      };
    }
  }
  return returnedDeployment;
}