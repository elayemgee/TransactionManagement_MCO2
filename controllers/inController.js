//const mySQL = require('mysql');
const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const mysql = require('mysql2/promise');
const config = require('../models/conn');
var node1Connection
var node2Connection


const inController = {
    inPage: function (req, res) {   
        res.render('in');
    },
    inRecord: async function (req, res) { 
        

        console.log('gonna execute insert');
        const title = req.query.movie;
		const year = req.query.year;
		const genre = req.query.genre;
		const director = req.query.director;
		const actor1 = req.query.actor1;
		const actor2 = req.query.actor2;

        var flag = false;

        if(year < 1980)
        try {
            console.log('central node');
            node1Connection = await mysql.createConnection(config.node1conn)

            await node1Connection.query("set autocommit = 0;")
			await node1Connection.query("START TRANSACTION;")
			await node1Connection.query("LOCK TABLES central write;")

            await node1Connection.query(`INSERT INTO central (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}', '${director}','${actor1}','${actor2}')`);
            await node1Connection.query("COMMIT;")
			await node1Connection.query("UNLOCK TABLES;")

            node1Connection.end()

        } catch (err) {
            if (node1Connection != null) {
                node1Connection.end()
            }
        }
    
        try {
            console.log('node2');
            node2Connection = await mysql.createConnection(config.node2conn);
            console.log('created connection to node 2');
            await node2Connection.query("set autocommit = 0;");
			await node2Connection.query("START TRANSACTION;");
			await node2Connection.query("LOCK TABLES node2 write;");
            console.log('gonna insert in node2');
            await node2Connection.query(`INSERT INTO node2 (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}', '${director}','${actor1}','${actor2}')`, function( error, results, fields){
                if (error) throw error;
                console.log(results);
                res.render('insert', { records: results });
            });
            await node2Connection.query("COMMIT;");
			await node2Connection.query("UNLOCK TABLES;");

            node2Connection.end()
            console.log('gonna render results');
            res.render('in',  { records: results });

            /*
             con.query(select, function (error, results, fields) {
            if (error) throw error;
            console.log(results);
            res.render('insert', { records: results });
        });
         */

        } catch (err) {
            if (node2Connection != null) {
                node2Connection.end()
            }
            console.log('node2 failed')   
            res.render('in')        
        }
        
    }

}
module.exports = inController;