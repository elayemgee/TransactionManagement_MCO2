const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const mysql = require('mysql2/promise');
const config = require('../models/conn');
var node1Connection
var node2Connection
var node3Connection

const searchController = {

    searchPage: function (req, res) {   
            res.render('search');        
    },


    searchRecord: async function (req, res) { 
        console.log('gonna execute search');
//        const sqlEntry = `UPDATE movies SET name ='${title}',year='${year}', genre='${genre}',director='${director}',actor1='${actor1}',actor2='${actor2}' WHERE id=${id}`;
        const searchCriteria = req.query.search;
        console.log(searchCriteria);

        var flag = false;
        var flag2 = false;
        var originalYear

        
			// search node 1
        try {
            node1Connection = await mysql.createConnection(config.node1conn)
            
            await node1Connection.query("set autocommit = 0;")
            console.log("autocommit=0")
            await node1Connection.query("START TRANSACTION;")
            console.log("start transaction")
            await node1Connection.query("LOCK TABLES central read;")
            console.log("lock")
    
            //search movie
            const sqlQuery = `SELECT * FROM central WHERE id = ? OR title LIKE ? OR director LIKE ? OR actor1 LIKE ? OR actor2 LIKE ? LIMIT 1000;`;
            const substr = `%${searchCriteria}%`;                
            let datalist = node1Connection.query(sqlQuery, [searchCriteria, substr, substr, substr, substr, substr])
            console.log(datalist)

            datalist.then(function(result) {
                console.log(result)
                })   
            console.log('performed update')

            await node1Connection.query("COMMIT;")
            console.log("commit")
            await node1Connection.query("UNLOCK TABLES;")
            console.log("unlock")

            node1Connection.query(sqlQuery, [searchCriteria, substr, substr, substr, substr, substr], function (error, results) {
                if (error) throw error;
                console.log(results);
                res.render('search', { result: results });
            });
    
            // end connections
            node1Connection.end()

        } catch (err) {
            console.log(err)
            if (node1Connection != null) {
                node1Connection.end()
            }
            // search in node 2 and 3 if node 1 isn't successful
            try {
                node2Connection = await mysql.createConnection(config.node2conn)
    
                await node2Connection.query("set autocommit = 0;")
                await node2Connection.query("START TRANSACTION;")
                await node2Connection.query("LOCK TABLES node2 read;")
    
                // update movie
                const sqlQuery = `SELECT * FROM node2 WHERE id = ? OR title LIKE ? OR director LIKE ? OR actor1 LIKE ? OR actor2 LIKE ? LIMIT 1000;`;
                const substr = `%${searchCriteria}%`;                
                let datalist = node2Connection.query(sqlQuery, [searchCriteria, substr, substr, substr, substr, substr])
                console.log(datalist)

                datalist.then(function(result) {
                    console.log(result)
                    res.send('search', { result: results })
                })   

                await node2Connection.query("COMMIT;")
                await node2Connection.query("UNLOCK TABLES;")
    
                // end connections
                node2Connection.end()
                //nodeLogsConnection.end()
        
            } catch (err) {
                var flag2 = true
                //console.log(err)
                if (node2Connection != null) {
                    node2Connection.end()
                }
                try { 
                    // search in node 3 if node 2 failss
                    node3Connection = await mysql.createConnection(config.node2conn)
        
                    await node3Connection.query("set autocommit = 0;")
                    await node3Connection.query("START TRANSACTION;")
                    await node3Connection.query("LOCK TABLES node3 read;")
        
        
                    // search movie
                    const sqlQuery = `SELECT * FROM node3 WHERE id = ? OR title LIKE ? OR director LIKE ? OR actor1 LIKE ? OR actor2 LIKE ? LIMIT 1000;`;
                    const substr = `%${searchCriteria}%`;                
                    let datalist = node3Connection.query(sqlQuery, [searchCriteria, substr, substr, substr, substr, substr])
                    console.log(datalist)
    
                    datalist.then(function(result) {
                        console.log(result)
                    })   

                    await node3Connection.query("COMMIT;")
                    await node3Connection.query("UNLOCK TABLES;")
        
                    // end connections
                    node3Connection.end()
                    //nodeLogsConnection.end()
        
                } catch (err) {
                    if (node3Connection != null) {
                        node3Connection.end()
                    }
                }
                
            }
        }
		
    }
}
    
module.exports = searchController;