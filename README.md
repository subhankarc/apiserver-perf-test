# ApiServer performance Test

## Goal
Primarily, these are the following goals for performing the ApiServer performance test.

1. Number of resource instance ApiServer can support and performance impact on create, patch, delete and get of a resource with n number of existing resources already present.

2. If resources need to be filtered based on the specific key value, which are part of the label, how is the performance with n number of resources present in ApiServer.

3. ETCD CPU and memory stats for high workload.

## Anti-Goal

We intend to test only the ApiServer and not ETCD directly, only monitor the VM metrics of it.

## Test-cases

With the goal at hand, our test cases are to see the time taken for the fllowing operations.

1. Create a resource with n number of resources already present in ApiServer and m parallel operations happenning.

2. Patch a resource with n number of resources already present in ApiServer and m parallel operations happenning.

3. Get a resource with n number of resources already present in ApiServer and m parallel operations happenning.

4. Delete a resource with n number of resources already present in ApiServer and m parallel operations happenning.

5. Filter set of resources based on a label with n number of resources already present in ApiServer and m parallel operations happenning.

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
const fileName = `datafile/dataCreatePatchGetFilter-bosh-${MAX_COUNT}-${BATCH_SIZE}.csv`;
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

Open http://localhost:3000 to access it and follow the guide to create charts.


## Statistics

### Service Fabrik APIServer



#### Data with 30000 resources and 20 parallel operations
In all the graphs, the **x axis represents the number of resources in APIServer** and **y axis denotes the time taken in milliseconds for each of these operations**.

![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/CreateGetPatchFilter-bosh-30000-20.png?raw=true)

![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/Delete-bosh-30000-20.png?raw=true)

While the workload was running, we measured the ETCD performance. Below are some of the metrics.

| CPU Usage  | Disk Latency |
| ------------- | ------------- |
| ![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/bosh-30000-20/etcd0_cpuusage.png?raw=true)  | ![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/bosh-30000-20/etcd0_disklatency.png?raw=true)  |

| Disk Usage  | ETCD Process consumption|
| ------------- | ------------- |
| ![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/bosh-30000-20/etcd0_diskusage.png?raw=true)  | ![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/bosh-30000-20/etcd0_etcd.png?raw=true)  |

| INodes  | Iops |
| ------------- | ------------- |
| ![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/bosh-30000-20/etcd0_inodes.png?raw=true)  | ![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/bosh-30000-20/etcd0_iops.png?raw=true)  |

| Memory Usage  | Packets |
| ------------- | ------------- |
| ![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/bosh-30000-20/etcd0_memusage.png?raw=true)  | ![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/bosh-30000-20/etcd0_packets.png?raw=true)  |

| Throughput  | Traffic |
| ------------- | ------------- |
| ![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/bosh-30000-20/etcd0_throughput.png?raw=true)  | ![alt text](https://github.com/subhankarc/apiserver-perf-test/blob/master/graphs/bosh-30000-20/etcd0_traffic.png?raw=true)  |


Other statistics are [here](https://github.com/subhankarc/apiserver-perf-test/blob/master/SFApiServerStats.md)
