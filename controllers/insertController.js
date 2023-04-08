const mySQL = require('mysql');
const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const DATABASE = 'movies';

const insertController = {
    insertRecord: function (req, res) {
        //const textReport = "SELECT * FROM central LIMIT 10;";
        /*
        const title = req.body.title;
		const year = req.body.year;
		const genre = req.body.genre;
		const director = req.body.director;
		const actor1 = req.body.actor1;
		const actor2 = req.body.actor2;
        */

        const title = "Oceans 8";
		const year = "2018";
		const genre = "Action";
		const director = "Rihanna";
		const actor1 = "Anne Hathaway";
		const actor2 = "Awkwafina";

        //var query = "SELECT * FROM central LIMIT 10;"
        const sqlEntry = `INSERT INTO central (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}', '${director}','${actor1}','${actor2}')`;

        const mysql = require('mysql2');
        var con = mysql.createConnection({
            host: 'localhost',
            port: '3306',
            user: 'root',
            password: 'net11142',
            database: DATABASE
        });
        con.connect(function (err) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
            console.log('connected as id ' + con.threadId);
            console.log('in insert controller');

        });
        
        con.query(sqlEntry, function (error, results, fields) {
        if (error) throw error;
        console.log(results);
        // connected!
        //res.render('report', { tuple: results });
        //res.render('insert', {title: "insert", layout: 'insert.hbs', script: '/controllers/insertController.js'});
        //res.render('insert');
        res.render('insert', { records: results });
    });
    }
}
module.exports = insertController;