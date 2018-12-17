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

return Promise.all(createGetFilterAll())
  .then(() => Promise.all(deleteAll()))
  .then(() => {
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

function createGetFilterAll() {
  var promises = [];
  for (var count = 1; count < MAX_COUNT + 1; count++) {
    var promiseClosure = ((count) => {
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
          return obj;
        }));
    })(count);
    promises.push(promiseClosure);
  }
  return promises;
}

function deleteAll() {
  var promises = [];
  for (count = 1; count < MAX_COUNT + 1; count++) {
    var promise = ((count) => {
      return Promise.try(() => client.loadSpec()
        .then(() => {
          let obj = _.find(dataObjects, ['count', count])
          let startDelete = Date.now();
          obj.startDelete = startDelete;
          return client.apis['deployment.servicefabrik.io'].v1alpha1.namespaces('default').directors(`dddd-${count}`).delete();
        })
        .then(() => {
          let obj = _.find(dataObjects, ['count', count])
          let timeForDelete = Date.now() - obj.startDelete;
          obj.delete = timeForDelete;
          actualDataObjects.push(_.pick(obj, ['count', 'get', 'post', 'filter', 'delete']));
        }))
    })(count);
    promises.push(promise);
  }
  return promises;
}

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