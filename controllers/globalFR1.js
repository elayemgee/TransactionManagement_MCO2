const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const mysql = require('mysql2/promise');
//const mysql2 = require('mysql2');
const config = require('../models/conn');
var node1Connection
var node2Connection
var node3Connection


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
        var recentId;

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
                let selectlist = node2Connection.query(sqlEntryFill)

                selectlist.then(function(result) {
                    console.log('-------')
                    console.log(result)
                    recentId = result
                    console.log('.......')
                    console.log(result[0]) // "Some User token"
                    console.log('///////')
                    console.log(result[0][0].id)
                    console.log(result[0][0])
                    recentId = parseInt(result[0][0].id) + 1
                    console.log("?")
                    console.log(recentId)
                }) 
                //perform insert
                sqlEntryFill = 'INSERT INTO node2 (id, title, year, genre, director, actor1, actor2) VALUES (?, ?,?,?,?,?,?)';
                datalist = node2Connection.query(sqlEntryFill, [recentId, title, year, genre, director, actor1,actor2])

                datalist.then(function(result) {
                    console.log(result)
                    console.log(result[0].insertId) // "Some User token"
                }) 
                
                //set log as write
                //await nodeLogsConnection.query('UPDATE `logs` SET `status` = ? WHERE `name` = ? AND `dest` = ?;', ['committing', title, 'central'])
                await node2Connection.query("COMMIT;");
                //node2Connection.query("UPDATE logs SET status = 'committed' WHERE id = " + [logId]);
                await node2Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
                await node2Connection.query("UNLOCK TABLES;");

                //update logs
                node2Connection.end()
                console.log('inserted into node 2')
            }
        }
        else if (year >= 1980)  {
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
                node3Connection = await mysql.createConnection(config.node3conn)
                console.log('connected to node 3!');
    
                await node3Connection.query(setIsolationLevel)
                console.log("Isolation level is set to: " + isolationLevelDefault)

                await node3Connection.query("set autocommit = 0;");
                await node3Connection.query("START TRANSACTION;");
                await node3Connection.query("LOCK TABLES node3 WRITE, logs WRITE;");
                
                //table for reference: id, operation, sql_statement, node_id, status
                //await node2Connection.query("INSERT INTO `logs` (id, operation, sql_statement, node_id, status) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node1');")
                console.log("Start log inserted to node 3 logs")
                var sqlEntryLog = `INSERT INTO node3 (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}','${director}','${actor1}','${actor2}')`;

                //update logs
                var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
                let datalist = node3Connection.query(sqlEntryFill, ['INSERT', sqlEntryLog, 1, 'start'])

                datalist.then(function(result) {
                    console.log(result)
                    logId = result[0].insertId
                    console.log("logid:")
                    console.log(logId)
                }) 

                sqlEntryFill = 'SELECT id FROM node3 ORDER BY id DESC LIMIT 1';
                let selectlist = node2Connection.query(sqlEntryFill)

                selectlist.then(function(result) {
                    console.log('-------')
                    console.log(result)
                    recentId = result
                    console.log('.......')
                    console.log(result[0]) // "Some User token"
                    console.log('///////')
                    console.log(result[0][0].id)
                    console.log(result[0][0])
                    recentId = parseInt(result[0][0].id) + 1
                    console.log("?")
                    console.log(recentId)
                }) 

                //perform insert
                sqlEntryFill = 'INSERT INTO node3 (id, title, year, genre, director, actor1, actor2) VALUES (?,?,?,?,?,?,?)';
                datalist = node3Connection.query(sqlEntryFill, [recentId, title, year, genre, director, actor1,actor2])

                datalist.then(function(result) {
                    console.log(result)
                    console.log(result[0].insertId) // "Some User token"
                }) 
                
                //set log as write
                //await nodeLogsConnection.query('UPDATE `logs` SET `status` = ? WHERE `name` = ? AND `dest` = ?;', ['committing', title, 'central'])

                await node3Connection.query("COMMIT;");
                //node2Connection.query("UPDATE logs SET status = 'committed' WHERE id = " + [logId]);
                await node3Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
                await node3Connection.query("UNLOCK TABLES;");

                //update logs
                node3Connection.end()
                console.log('inserted into node 3')
            }
            
        }
        

        /*
        try { //check node 2 logs
            node2LogsConnection = await mysql.createConnection(config.nodeLogsConn)
		    const [rows1, fields1] = await nodeLogsConnection.query("SELECT * FROM `logs` WHERE `status` = ?;", ['committing'])

            node1Connection = await mysql.createConnection(config.node1conn)
            console.log('connected to central node');

            rows1.forEach(e => {
                node1Connection.query('INSERT INTO central (title, year, genre, director, actor1, actor2) VALUES (?,?,?,?,?,?)')
                datalist = node1Connection.query(sqlEntryFill, [title, year, genre, director, actor1,actor2])
                node2LogsConnection.query("UPDATE `logs` SET `status` = ? WHERE `name` = ?;", ['committed', e.name])

                console.log("[RECOVERY] INSERTED IN NODE 1 TABLE 1")
				
                })

        } catch (err) {

        }
        */

    }
}
module.exports = globalFR1Controller;