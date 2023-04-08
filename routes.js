const express = require('express');
const textReportController = require('./controllers/textReportController.js');
const insertController = require('./controllers/insertController.js');
const updateController = require('./controllers/updateController.js');



const app = express();

//app.get('/', textReportController.getReport);
//app.get('/', insertController.insertRecord);
app.get('/insertPage', insertController.insertPage);
app.get('/insertRecord', insertController.insertRecord);

app.get('/updatePage', updateController.updatePage);
app.get('/updateRecord', updateController.updateRecord);

module.exports = app;
