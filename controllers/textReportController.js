const mySQL = require('mysql');
const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const DATABASE = 'movies';

const mysql = require('mysql2');
var con = mysql.createConnection({
    host: '172.16.3.142',
    port: '3306',
    user: 'group16',
    password: '12341234',
    database: DATABASE
});

const textReportController = {
    moviesPage: function (req, res) {   
        console.log('present');
        con.connect(function (err) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
            console.log('connected as id ' + con.threadId);
            console.log('in textReport controller');
            res.render('report');
        });
    },

    getReport: function (req, res) {
        //const textReport = "SELECT * FROM central LIMIT 10;";
        var query = "SELECT * FROM central LIMIT 10;"

        con.connect(function (err) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
            console.log('connected as id ' + con.threadId);
            console.log('in text report controller');
        });
        
        con.query(query, function (error, results, fields) {
        if (error) throw error;
        console.log(results);
        // connected!
        res.render('report', { tuple: results });
        
    });
    }
}

module.exports = textReportController;