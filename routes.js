const express = require('express');
const textReportController = require('./controllers/textReportController.js');
const updateController = require('./controllers/updateController.js');
const searchController = require('./controllers/searchController.js');
const inController = require('./controllers/inController.js');


const app = express();

app.get('/', textReportController.getReport);

app.get('/updatePage', updateController.updatePage);
app.get('/updateRecord', updateController.updateRecord);

app.get('/searchPage', searchController.searchPage);
app.get('/searchRecord', searchController.searchRecord);

app.get('/inPage', inController.insertPage);
app.get('/inRecord', inController.insertRecord);


module.exports = app;
