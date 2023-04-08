const express = require('express');
const textReportController = require('./controllers/textReportController.js');
const insertController = require('./controllers/insertController.js');
const updateController = require('./controllers/updateController.js');



const app = express();

//app.get('/', textReportController.getReport);
//app.get('/', insertController.insertRecord);
app.get('/insertPage', insertController.insertPage);
app.get('/insertRecord', insertController.insertRecord);

//app.get('/udpatePage', insertController.updatePage);
//app.get('/updateRecord', insertController.updateRecord);

module.exports = app;
