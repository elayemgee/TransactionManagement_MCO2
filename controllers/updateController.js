const mySQL = require('mysql');
const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const DATABASE = 'movies';
const mysql = require('mysql2');
var con = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'net11142',
    database: DATABASE
});


const updateController = {

    updatePage: function (req, res) {   
        con.connect(function (err) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
            console.log('connected as id ' + con.threadId);
            console.log('in update controller');
            res.render('update');
        });
        
    },
    updateRecord: function (req, res) { 
        console.log('gonna execute update');
        const id = req.query.id;
        const title = req.query.movie;
		const year = req.query.year;
		const genre = req.query.genre;
		const director = req.query.director;
		const actor1 = req.query.actor1;
		const actor2 = req.query.actor2;

        const sqlEntry = `UPDATE central SET title = '${title}', year = ${year}, genre = '${genre}', director = '${director}', actor1 = '${actor1}', actor2 = '${actor2}'
                          WHERE id = '${id}'`;

        con.query(sqlEntry, function (error, results, fields) {
            if (error) throw error;
            console.log(results);
            //res.render('insert', { records: results });
        });

        //Displays most recent file added to records
        const select = `SELECT * FROM central WHERE id = '${id}'`;

        con.query(select, function (error, results, fields) {
            if (error) throw error;
            console.log(results);
            res.render('update', { records: results });
        });
    }

}
module.exports = updateController;