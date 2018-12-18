# ApiServer performance Test

## Goal
Primarily, these are the following goals for performing the ApiServer performance test.

1. Number of resource instance ApiServer can support and performance impact on create, delete and get of a resource with n number of existing resources already present.

2. If resources need to be filtered based on the specific key value, which are part of the label, how is the performance with n number of resources present in ApiServer.

## Anti-Goal

We intend to test only the ApiServer and not ETCD directly.

## Test-cases

With the goal at hand, our test cases are to see the time taken for the fllowing operations.

1. Create a resource with n number of resources already present in ApiServer and m parallel operations happenning.

2. Get a resource with n number of resources already present in ApiServer and m parallel operations happenning.

3. Delete a resource with n number of resources already present in ApiServer and m parallel operations happenning.

4. Filter set of resources based on a label with n number of resources already present in ApiServer and m parallel operations happenning.

## How to run

There are two different files for the testcases.

1. create-get-filter-resource.js

You can change the value of m and n in the following variables.

```javascript
const MAX_COUNT = 10;
const BATCH_SIZE = 5;
```
Also, you can change the output file here

```javascript
fs.writeFile("datafile/dataCreateGetFilter.csv", actualCsvFromArrayOfObjects, function (err) {
  if (err) {
    return console.log(err);
  }
  console.log("The file was saved!");
});
```
Once done, you can run it using

```shell
node create-get-filter-resource.js
```
This should save the resoult in the output csv file.

2. delete-resource.js

Similar to the first file, you can change the value of m and n in the following variables.

```javascript
const MAX_COUNT = 10;
const BATCH_SIZE = 5;
```
Also, you can change the output file here

```javascript
fs.writeFile("datafile/dataDelete.csv", actualCsvFromArrayOfObjects, function (err) {
  if (err) {
    return console.log(err);
  }
  console.log("The file was saved!");
});
```
Once done, you can run it using

```shell
node delete-resource.js
```

## Graph creation

We recomend to use https://github.com/charted-co/charted.git to create the chart out of the csv files.

The following needs to be done for it.
```shell
git clone https://github.com/charted-co/charted.git
cd charted
npm install
nvm use 8.14.0
npm start
```
This should start the server on 3000 port.

Open https://localhost:3000 to access it and follow the guide to create charts.


## Development

## Statistics

### Gardener ApiServer

#### Data with 100 resources and 5 parallel operations

![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/Post-100.png?raw=true)
![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/Get-100.png?raw=true)
![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/Filter-100.png?raw=true)
![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/Delete-100.png?raw=true)

#### Data with 1000 resources and 5 parallel operations

![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/Post-1000.png?raw=true)
![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/Get-1000.png?raw=true)
![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/Filter-1000.png?raw=true)
![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/Delete-1000.png?raw=true)
