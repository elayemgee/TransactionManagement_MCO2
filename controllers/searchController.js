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
        /*
        const id = req.query.search;
        const title = req.query.search;
		const director = req.query.search;
		const actor1 = req.query.search;
		const actor2 = req.query.search;
        */
        const searchCriteria = req.query.search;
        console.log(searchCriteria);

        const sqlQuery = `SELECT * FROM central WHERE id = ? OR title LIKE ? OR director LIKE ? OR actor1 LIKE ? OR actor2 LIKE ? LIMIT 1000;`;
        const substr = `%${searchCriteria}%`;

        //const [rows, fields] = con.execute("SELECT * FROM central WHERE id = ? OR title = ? OR director = ? OR actor1 = ? OR actor2 = ? ;", [id, title, director, actor1, actor2]);

/*        
        con.query(sqlQuery, [searchCriteria, substr, substr, substr, substr, substr], function (error, results, fields) {
            if (error) throw error;
            console.log(results);
            //res.render('search', { records: results });
            //data.dataDB = rows[0]
        });*/

        con.query(sqlQuery, [searchCriteria, substr, substr, substr, substr, substr], function (error, results, fields) {
            if (error) throw error;
            console.log(results);
            res.render('search', { result: results });
        });
    }
}

module.exports = searchController;