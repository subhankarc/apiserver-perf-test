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
const fileName = `datafile/dataDelete-${MAX_COUNT}-${BATCH_SIZE}.csv`;


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

const deleteAll = function (count) {
  return Promise.try(() => {
    let startDelete = Date.now();
    dataObjects.push({
      count: count,
      startDelete: startDelete
    });
    return client.apis['deployment.servicefabrik.io'].v1alpha1.namespaces('default').directors(`dddd-${count}`).delete()
      .then(() => {
        let obj = _.find(dataObjects, ['count', count])
        let timeForDelete = Date.now() - obj.startDelete;
        obj.delete = timeForDelete;
        _.omit(obj, ['startDelete']);
        _.remove(dataObjects, function (n) {
          return n.count == count;
        });
        dataObjects.push(_.pick(obj, ['count', 'delete']));
      })
  });
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
    batch.map(d => deleteAll(d))
  ));

const promiseChain = chunkedData.reduce(
  reducer,
  Promise.resolve()
);

return promiseChain
  .then(() => console.log('delete done'))
  .then(() => {
    _.remove(dataObjects, function (n) {
      return n.count == 0;
    });
    console.log(dataObjects);
    const actualCsvFromArrayOfObjects = convertArrayToCSV(dataObjects);
    fs.writeFile(fileName, actualCsvFromArrayOfObjects, function (err) {
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