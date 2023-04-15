const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const mysql = require('mysql2/promise');
const config = require('../models/conn');
var node1Connection
var node2Connection
var node3Connection

const updateController = {

    updatePage: function (req, res) {   
            res.render('update');        
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

        var sqlEntry = `UPDATE central SET title = '${title}', year = ${year}, genre = '${genre}', director = '${director}', actor1 = '${actor1}', actor2 = '${actor2}'
                          WHERE id = '${id}'`;

        if(title == null)
            sqlEntry = sqlEntry.replaceAll(" title = '${title}',", '')
        if(year == null)
            sqlEntry = sqlEntry.replaceAll(" year = ${year},", '')
        if(genre == null)
            sqlEntry = sqlEntry.replaceAll(" genre = '${genre}',", '')
        if(director == null)
            sqlEntry = sqlEntry.replaceAll(" director = '${director}',", '')
        if(actor1 == null && actor2 == null)
            sqlEntry = sqlEntry.replaceAll(", actor1 = '${actor1}', actor2 = '${actor2}'", '')
        if(actor2 == null && actor1 != null)
            sqlEntry = sqlEntry.replaceAll(", actor2 = '${actor2}'", '')
        if(actor1 == null && actor2 != null)
            sqlEntry = sqlEntry.replaceAll(" actor1 = '${actor1}',", '')

        console.log(sqlEntry)

        node1Connection.query(sqlEntry, function (error, results, fields) {
            if (error) throw error;
            console.log(results);
            //res.render('insert', { records: results });
        });

        //Displays most recent file added to records
        const select = `SELECT * FROM central WHERE id = '${id}'`;

        node1Connection.query(select, function (error, results, fields) {
            if (error) throw error;
            console.log(results);
            res.render('update', { records: results });
        });
    }

}
module.exports = updateController;

/*//const mySQL = require('mysql');
const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const DATABASE = 'movies';
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
module.exports = updateController;*/ 