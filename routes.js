const express = require('express');
const textReportController = require('./controllers/textReportController.js');
const updateController = require('./controllers/updateController.js');
const searchController = require('./controllers/searchController.js');
const inController = require('./controllers/inController.js');
const Case1Controller = require('./controllers/globalFR1.js');
const Case2Controller = require('./controllers/globalFR2.js');
const Case3Controller = require('./controllers/globalFR3.js');
const Case4Controller = require('./controllers/globalFR4.js');


const app = express();

app.get('/', textReportController.getReport);

app.get('/updatePage', updateController.updatePage);
app.get('/updateRecord', updateController.updateRecord);

app.get('/searchPage', searchController.searchPage);
app.get('/searchRecord', searchController.searchRecord);

app.get('/insertPage', inController.insertPage);
app.get('/insertRecord', inController.insertRecord);

app.get('/Case1Insert', Case1Controller.Case1Insert);
app.get('/Case2Insert', Case2Controller.Case2Insert);
app.get('/Case3Update', Case3Controller.Case3Update);
app.get('/Case4Update', Case4Controller.Case4Update);


module.exports = app;
