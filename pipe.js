// if you haven't yet install the Flex.io JS SDK, you'll need to do that
// before running this script. To do so, run `npm install flexio-sdk-js`.
var Flexio = require('flexio-sdk-js')

// insert your API key here to use the Flex.io JS SDK with your account
Flexio.setup('jynqpsnznvhxcngrdjhd')

// sources
// https://data.stackexchange.com/stackoverflow/query/780988/c-posts-per-month
// https://data.stackexchange.com/stackoverflow/query/780990/java-posts-per-month
// https://data.stackexchange.com/stackoverflow/query/780991/javascript-posts-per-month
// https://data.stackexchange.com/stackoverflow/query/780986/lisp-posts-per-month
// https://data.stackexchange.com/stackoverflow/query/780965/php-posts-per-month
// https://data.stackexchange.com/stackoverflow/query/780963/python-posts-per-month
// https://data.stackexchange.com/stackoverflow/query/780964/r-posts-per-month

// This is the Flex.io pipe logic to request a CSV file from GitHub and convert it to JSON
var pipe = Flexio.pipe()
  .request('datafile/dataCreateGetFilter.csv')
  .convert('csv','json')

// You may save this pipe to your Flex.io account, which enables a pipe endpoint to be called using an alias, via our
// REST API or cURL. Note that the alias `examples-demo-chartjs-from-csv` below needs to be replaced
// with your own alias in order to save this pipe to your account (e.g. `demo-chartjs-from-csv`)
pipe.save({
  name: 'Chart.js chart from a CSV',
  alias: 'examples-demo-chartjs-from-csv'
})