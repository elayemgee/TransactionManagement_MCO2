const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const mysql = require('mysql2/promise');
//const mysql2 = require('mysql2');
const config = require('../models/conn');
var node1Connection
var node2Connection
var node2LogsConnection
var node3Connection
var node3LogsConnection 


const isolationLevelDefault = `READ UNCOMMITTED`;
const isolationLevelSql = `SET SESSION TRANSACTION ISOLATION LEVEL `;
const setIsolationLevel = isolationLevelSql + isolationLevelDefault


const globalFR1Controller = {
    /**
	 * This POST method inserts a movie into the DB
	 * @param {*} req 
	 * @param {*} res 
	 */
    Case1Insert: async function (req, res) { 

        console.log('gonna execute insert');
        const title = req.query.movie;
		const year = req.query.year;
		const genre = req.query.genre;
		const director = req.query.director;
		const actor1 = req.query.actor1;
		const actor2 = req.query.actor2;
        var insertedId;
        var logId;
        var results;

        var flag = false;
        var flag2 = false;

        if(year < 1980){
            try {
                node1Connection = await mysql.createConnection(config.node1conn)
                console.log('connected to central node');

                node1Connection.destroy();
                console.log('Node 1 destroyed')
                (await node1Connection).ping(function (err) {
                    if (err) {
                        console.log('Central node failed!')
                    } 
                    
                })
            }
            catch (err){
                node2Connection = await mysql.createConnection(config.node2conn)
                console.log('connected to node 2!');
 
                await node2Connection.query(setIsolationLevel)
                console.log("Isolation level is set to: " + isolationLevelDefault)

                await node2Connection.query("set autocommit = 0;");
                await node2Connection.query("START TRANSACTION;");
                await node2Connection.query("LOCK TABLES node2 WRITE, logs WRITE;");
                
                //table for reference: id, operation, sql_statement, node_id, status
                //await node2Connection.query("INSERT INTO `logs` (id, operation, sql_statement, node_id, status) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node1');")
				console.log("Start log inserted to node 2 logs")
                var sqlEntryLog = `INSERT INTO node2 (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}','${director}','${actor1}','${actor2}')`;

                //update logs
                var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
                let datalist = node2Connection.query(sqlEntryFill, ['INSERT', sqlEntryLog, 1, 'start'])

                datalist.then(function(result) {
                    console.log(result)
                    logId = result[0].insertId
                    console.log("logid:")
                    console.log(logId)
                }) 

                sqlEntryFill = 'SELECT id FROM node2 ORDER BY id DESC LIMIT 1';
                datalist = node2Connection.query(sqlEntryFill)
                var recentId
                datalist.then(function(result) {
                    console.log('-------')
                    console.log(result)
                    recentId = result
                    console.log('.......')
                    console.log(result[0]) // "Some User token"
                    console.log('///////')
                    console.log(result[0][0].id)
                    console.log(result[0][0])
                    recentId = result[0][0].id + 1
                    //recentId = result[0].id
                    //console.log(recentId)
                }) 
                console.log(recentId)

                //perform insert
                sqlEntryFill = 'INSERT INTO node2 (id, title, year, genre, director, actor1, actor2) VALUES (?,?,?,?,?,?,?)';
                datalist = node2Connection.query(sqlEntryFill, [recentId, title, year, genre, director, actor1,actor2])

                datalist.then(function(result) {
                    console.log(result)
                    console.log(result[0].insertId) // "Some User token"
                }) 
                
                //set log as write
                
                node2Connection.query("UPDATE logs SET status = 'committing' WHERE id == " + [logId]);
                await node2Connection.query("COMMIT;");
                node2Connection.query("UPDATE logs SET status = 'committed' WHERE id == " + [logId]);
                await node2Connection.query("UNLOCK TABLES;");

                //update logs
                node2Connection.end()
                console.log('inserted into node 2')
            }
        }

        /*
        node1Pool.getConnection(function (err, centralConnection) {
            if (err) {
				throw err;
			}
            centralConnection.destroy();
            centralConnection.ping(function (err) {
                if (err) {
					console.log('Central node failed!');
                    if (year < 1980) {
                        node2Pool.getConnection(function(err, node2Connection) {
                            if (err) {
								throw err;
							}

                            node2Connection.ping(function(err){
                                if (err) {
									console.log('Node 2 failed!');
									// should be in node 2 but node 2 is down --> unavailable all servers
									res.send('Node 1 and Node 2 are down. Sorry for the inconvenience.');
								}
                            })

                        })
                    }
            }
            
        })
    })*/
    }
}
module.exports = globalFR1Controller;