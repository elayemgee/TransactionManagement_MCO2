const mySQL = require('mysql');
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


const insertController = {

    insertPage: function (req, res) {   
        res.render('insert');
        /*
        con.connect(function (err) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
            console.log('connected as id ' + con.threadId);
            console.log('in insert controller');
            
        });
        */
        
    },
    insertRecord: function (req, res) { 
        console.log('gonna execute insert');
        const title = req.query.movie;
		const year = req.query.year;
		const genre = req.query.genre;
		const director = req.query.director;
		const actor1 = req.query.actor1;
		const actor2 = req.query.actor2;

        const sqlEntry = `INSERT INTO central (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}', '${director}','${actor1}','${actor2}')`;

        con.query(sqlEntry, function (error, results, fields) {
            if (error) throw error;
            console.log(results);
            //res.render('insert', { records: results });
        });

        //Displays most recent file added to records
        const select = `SELECT * FROM central ORDER BY id DESC LIMIT 1`;

        con.query(select, function (error, results, fields) {
            if (error) throw error;
            console.log(results);
            res.render('insert', { records: results });
        });
    }

}
module.exports = insertController;