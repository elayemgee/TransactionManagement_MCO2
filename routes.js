const express = require('express');
const textReportController = require('./controllers/textReportController.js');
const insertController = require('./controllers/insertController.js');


const app = express();

//app.get('/', textReportController.getReport);
app.get('/', insertController.insertRecord);
//app.get('/addEntry', insertController.insertRecord);
module.exports = app;
