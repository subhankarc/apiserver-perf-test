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


const kubeConfigExists = false;
const MAX_COUNT = 10;
const BATCH_SIZE = 5;

const configValue = kubeConfigExists ? kc.config.fromKubeconfig('./kubeconfig.yaml') : {
  url: 'https://10.11.252.10:9443',
  cert: fs.readFileSync('/users/i068838/sf-dev-landscape-aws3/deployments/service-fabrik/credentials/service-fabrik-certs/apiserver-certs/client.crt'),
  key: fs.readFileSync('/users/i068838/sf-dev-landscape-aws3/deployments/service-fabrik/credentials/service-fabrik-certs/apiserver-certs/client.key'),
  insecureSkipTlsVerify: true
}
const client = new kc.Client({
  config: configValue,
  version: '1.9'
});

const crdJson = yaml.safeLoad(fs.readFileSync('./deployment-crd.yaml', 'utf8'));
client.addCustomResourceDefinition(crdJson);


let dataObjects = [];

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
      _.omit(obj, ['startPost', 'startGet', 'startFilter']);
      _.remove(dataObjects, function (n) {
        return n.count == count;
      });
      dataObjects.push(_.pick(obj, ['count', 'post', 'get', 'filter']));
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
    _.remove(dataObjects, function (n) {
      return n.count == 0;
    });
    console.log(dataObjects);
    const actualCsvFromArrayOfObjects = convertArrayToCSV(dataObjects);
    fs.writeFile("datafile/dataCreateGetFilter.csv", actualCsvFromArrayOfObjects, function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("The file was saved!");
    });
  })

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
