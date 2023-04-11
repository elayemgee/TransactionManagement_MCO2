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

const searchController = {

    searchPage: function (req, res) {   
        con.connect(function (err) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
            console.log('connected as id ' + con.threadId);
            console.log('in search controller');
            res.render('search');
        });
        
    },
    searchRecord: function (req, res) { 
        console.log('gonna execute search');
        const title = req.query.movie;
		const year = req.query.year;
		const genre = req.query.genre;
		const director = req.query.director;
		const actor1 = req.query.actor1;
		const actor2 = req.query.actor2;

        const [rows, fields] = connection.execute("SELECT * FROM central WHERE id = ? OR title = ? OR director = ? OR actor1 = ? OR actor2 = ? ;", [id, title, director, actor1, actor2]);

        con.query(sqlEntry, function (error, results, fields) {
            if (error) throw error;
            console.log(results);
            //res.render('search', { records: results });
            data.dataDB = rows[0]
        });

        con.query(select, function (error, results, fields) {
            if (error) throw error;
            console.log(results);
            res.render('search', { records: results });
        });
    }
}

module.exports = searchController;