const mySQL = require('mysql');
const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const DATABASE = 'movies';

const textReportController = {
    getReport: function (req, res) {
        //const textReport = "SELECT * FROM central LIMIT 10;";
        var query = "SELECT * FROM central LIMIT 10;"

        const mysql = require('mysql2');
        var con = mysql.createConnection({
            //host: 'localhost',
            host: '172.16.3.142',
            port: '3306',
            //user: 'root',
            //password: 'net11142',
            user: 'group16',
            password: '12341234',
            database: DATABASE
        });
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