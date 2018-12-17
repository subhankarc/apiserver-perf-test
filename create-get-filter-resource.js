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
const MAX_COUNT = 100;
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

const createGetFilterAll = function (count) {
  return Promise.try(() => client.loadSpec()
    .then(() => {
      let startPost = Date.now();
      dataObjects.push({
        count: count,
        startPost: startPost
      });
      return client.apis['deployment.servicefabrik.io'].v1alpha1.namespaces('default')['director'].post({
        body: massageData(sampleDeployment, count)
      })
    })
    .then(() => {
      let obj = _.find(dataObjects, ['count', count])
      let timeForPost = Date.now() - obj.startPost;
      let startGet = Date.now();
      obj.post = timeForPost;
      obj.startGet = startGet;

      return client.apis['deployment.servicefabrik.io'].v1alpha1.namespaces('default').directors.get({
        qs: {
          fieldSelector: `metadata.name=dddd-${count}`
        }
      })
    })
    .then(() => {
      let obj = _.find(dataObjects, ['count', count])
      let timeForGet = Date.now() - obj.startGet;
      let startFilter = Date.now();
      obj.get = timeForGet;
      obj.startFilter = startFilter;
      return client.apis['deployment.servicefabrik.io'].v1alpha1.namespaces('default').directors.get({
        qs: {
          labelSelector: 'sample_label=hundreds'
        }
      })
    })
    .then(() => {
      let obj = _.find(dataObjects, ['count', count])
      let timeForFilter = Date.now() - obj.startFilter;
      obj.filter = timeForFilter;
      actualDataObjects.push(_.pick(obj, ['count', 'get', 'post', 'filter', 'delete']));
      return obj;
    }));
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
    batch.map(d => createGetFilterAll(d))
  ));

const promiseChain = chunkedData.reduce(
  reducer,
  Promise.resolve()
);

return promiseChain
  .then(() => console.log('create done'))
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
    fs.writeFile("datafile/dataCreateGetFilter.csv", actualCsvFromArrayOfObjects, function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("The file was saved!");
    });

    fs.writeFile("datafile/completeDataCreateGetFilter.csv", completeCsvFromArrayOfObjects, function (err) {
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