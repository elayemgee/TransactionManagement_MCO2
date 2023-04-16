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
        var logId;
        var recentIdNode2;
        var recentIdNode3;
        var newId;

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

                node3Connection = await mysql.createConnection(config.node3conn)
                console.log('connected to node 3!');
 
                await node2Connection.query(setIsolationLevel)
                console.log("Isolation level is set to: " + isolationLevelDefault)

                //look at the ids from node 2 and node 3 to get the bigger one and increment from there
                var sqlEntryFill = 'SELECT id FROM node2 ORDER BY id DESC LIMIT 1';
                let selectlist = await node2Connection.query(sqlEntryFill, function(result) {
                    console.log(result)
                    recentIdNode2 = parseInt(result[0][0].id) + 1
                })

                /*
                selectlist.then(function(result) {
                    console.log('-------')
                    console.log(result)
                    recentIdNode2 = parseInt(result[0][0].id) + 1
                    console.log("recentIdNode2: ")
                    console.log(recentIdNode2)
                }) */

                var sqlEntryFill = 'SELECT id FROM node3 ORDER BY id DESC LIMIT 1';
                selectlist = node3Connection.query(sqlEntryFill)

                selectlist.then(function(result) {
                    console.log('-------')
                    console.log(result)
                    recentIdNode3 = parseInt(result[0][0].id) + 1
                    console.log("recentIdNode3 :")
                    console.log(recentIdNode3)
                }) 

                if (recentIdNode2 > recentIdNode3){
                    newId = recentIdNode2;
                }
                else {
                    newId = recentIdNode3;
                }
                console.log('newId:' + newId)
                node3Connection.end()
                console.log('before autocommit')
                await node2Connection.query("set autocommit = 0;");
                console.log("after autocommit, before start transaction")
                await node2Connection.query("START TRANSACTION;");
                console.log("after start transaction, before lock tables")
                await node2Connection.query("LOCK TABLES node2 WRITE, logs WRITE;");
                
                //table for reference: id, operation, sql_statement, node_id, status
                //await node2Connection.query("INSERT INTO `logs` (id, operation, sql_statement, node_id, status) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node1');")
				console.log("Start log inserted to node 2 logs")
                var sqlEntryLog = `INSERT INTO central (id, title, year, genre, director, actor1, actor2) VALUES ('${newId}', '${title}',${year},'${genre}','${director}','${actor1}','${actor2}')`;

                //update logs
                sqlEntryFill = 'INSERT INTO logs (id, operation, sql_statement, node_id, status) VALUES (?,?,?,?,?)';
                let datalist = node2Connection.query(sqlEntryFill, [newId, 'INSERT', sqlEntryLog, 1, 'write'])

                datalist.then(function(result) {
                    console.log(result)
                    logId = result[0].insertId
                    console.log("logid:")
                    console.log(logId)
                }) 

                //perform insert
                sqlEntryFill = 'INSERT INTO node2 (id, title, year, genre, director, actor1, actor2) VALUES (?,?,?,?,?,?,?)';
                datalist = node2Connection.query(sqlEntryFill, [newId, title, year, genre, director, actor1,actor2])

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

                //get most recent id
                sqlEntryFill = 'SELECT id FROM node3 ORDER BY id DESC LIMIT 1';
                let selectlist = node3Connection.query(sqlEntryFill)

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

                await node3Connection.query("set autocommit = 0;");
                await node3Connection.query("START TRANSACTION;");
                await node3Connection.query("LOCK TABLES node3 WRITE, logs WRITE;");
                
                //table for reference: id, operation, sql_statement, node_id, status
                //await node2Connection.query("INSERT INTO `logs` (id, operation, sql_statement, node_id, status) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node1');")
                console.log("Start log inserted to node 3 logs")
                var sqlEntryLog = `INSERT INTO central (id, title, year, genre, director, actor1, actor2) VALUES ('${recentId}','${title}',${year},'${genre}','${director}','${actor1}','${actor2}')`;

                //update logs
                var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
                let datalist = node3Connection.query(sqlEntryFill, ['INSERT', sqlEntryLog, 1, 'write'])

                datalist.then(function(result) {
                    console.log(result)
                    logId = result[0].insertId
                    console.log("logid:")
                    console.log(logId)
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
                
        try { //check node 2 logs
            console.log('gonna check node 2 logs')
            node2Connection = await mysql.createConnection(config.node2conn)
		    const [rows1, fields1] = await node2Connection.query("SELECT * FROM `logs` WHERE `status` = ?;", ['committing'])
            console.log('connection 2 created')
            node1Connection = await mysql.createConnection(config.node1conn)
            console.log('connected to central node');

            rows1.forEach(e => {
                console.log("made it in wee")
                console.log(e)
                var query = e.sql_statement
                console.log(query)
                console.log("This is the id : " + e.id)
                //e.sql_statement
                node1Connection.query(query)
                console.log("isnertered into node 1")
                //datalist = node1Connection.query(sqlEntryFill, [title, year, genre, director, actor1,actor2])
                node2Connection.query("UPDATE `logs` SET `status` = ? WHERE `id` = ?;", ['committed', e.id])
				
                })

        } catch (err) {

        }
        

    }
}
module.exports = globalFR1Controller;