const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const mysql = require('mysql2/promise');
//const mysql2 = require('mysql2');
const config = require('../models/conn');
var node1Connection
var node2Connection


const isolationLevelDefault = `READ UNCOMMITTED`;
const isolationLevelSql = `SET SESSION TRANSACTION ISOLATION LEVEL `;
const setIsolationLevel = isolationLevelSql + isolationLevelDefault


const globalFR2Controller = {
    /**
	 * This POST method inserts a movie into the DB
	 * @param {*} req 
	 * @param {*} res 
	 */
    Case2Insert: async function (req, res) { 

        console.log('gonna execute insert');
        const title = req.query.movie;
		const year = req.query.year;
		const genre = req.query.genre;
		const director = req.query.director;
		const actor1 = req.query.actor1;
		const actor2 = req.query.actor2;
        var logId;
        var newId;

        var flag = false;
        var flag2 = false;

            try {
                node2Connection = await mysql.createConnection(config.node1conn)
                console.log('connected to node2');

                node2Connection.destroy();
                console.log('Node 2 destroyed')
                (await node1Connection).ping(function (err) {
                    if (err) {
                        console.log('Connection to Node 2 failed!')
                    } 
                })
            }
            catch (err){
                node1Connection = await mysql.createConnection(config.node1conn)
                console.log('connected to node 1!');

                await node1Connection.query(setIsolationLevel)
                console.log("Isolation level is set to: " + isolationLevelDefault)

                //get most recent id and increment
                var sqlEntryFill = 'SELECT id FROM central ORDER BY id DESC LIMIT 1';
                let selectlist = node1Connection.query(sqlEntryFill)

                selectlist.then(function(result) {
                    console.log('-------')
                    console.log(result)
                    newId = parseInt(result[0][0].id) + 1
                    console.log("newId: ")
                    console.log(newId)
                }) 

                console.log('before autocommit')
                await node1Connection.query("set autocommit = 0;");
                console.log("after autocommit, before start transaction")
                await node1Connection.query("START TRANSACTION;");
                console.log("after start transaction, before lock tables")
                await node1Connection.query("LOCK TABLES central WRITE, logs WRITE;");

                //table for reference: id, operation, sql_statement, node_id, status
                //await node2Connection.query("INSERT INTO `logs` (id, operation, sql_statement, node_id, status) VALUES ('insert', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node1');")
				console.log("Start log inserted to node 1 logs")
                var sqlEntryFill = `INSERT INTO node2 (id, title, year, genre, director, actor1, actor2) VALUES ('${newId}','${title}',${year},'${genre}','${director}','${actor1}','${actor2}')`;

                //update logs
                var sqlEntryLog = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
                let datalist = node1Connection.query(sqlEntryLog, ['INSERT', sqlEntryFill, 1, 'start'])

                datalist.then(function(result) {
                    console.log(result)
                    logId = result[0].insertId
                    console.log("logid:")
                    console.log(logId)
                }) 

                //var sqlEntryLog = 'UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['write', logId];
                await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['write', logId])

                //perform insert
                sqlEntryFill = 'INSERT INTO central (title, year, genre, director, actor1, actor2) VALUES (?,?,?,?,?,?)';
                datalist = node1Connection.query(sqlEntryFill, [title, year, genre, director, actor1,actor2])

                datalist.then(function(result) {
                    console.log(result)
                    console.log(result[0].insertId) // "Some User token"
                    newId = result[0].insertId
                }) 
                
                //set log as write
                await node1Connection.query("COMMIT;");
                //node2Connection.query("UPDATE logs SET status = 'committed' WHERE id = " + [logId]);
                await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
                await node1Connection.query("UNLOCK TABLES;");

                //update logs
                node1Connection.end()
                console.log('inserted into node 1')
            }

            try{
                console.log('gonna recover node 1 logs')
                node1Connection = await mysql.createConnection(config.node1conn)
                var [rows1, fields1] = await node1Connection.query("SELECT * FROM `logs` WHERE `status` = ?;", ['committing'])
                console.log('connected to node 1');
                node2Connection = await mysql.createConnection(config.node2conn)
                console.log('connected to node 2');
        
                rows1.forEach(e => {
                    console.log(e)
                    var query = e.sql_statement
                    console.log(query)
                    console.log("This is the id : " + e.id)
                    
                    node2Connection.query("set autocommit = 0;")
                    node2Connection.query("START TRANSACTION;")
                    node2Connection.query("LOCK TABLES node2 WRITE, logs WRITE;")

                    var sqlEntryLog = `INSERT central SET title = '${title}', year = ${year}, genre = '${genre}', director = '${director}', actor1 = '${actor1}', actor2 = '${actor1}' WHERE id = '${query}'`;
                    var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
                    let datalist = node1Connection.query(sqlEntryFill, ['UPDATE', sqlEntryLog, 1, 'start'])
    
                    datalist.then(function(result) {
                        console.log(result)
                        logId = result[0].insertId
                        console.log("logid:" + logId)
                    })

                    node2Connection.query(query)

                    node2Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
		            node2Connection.query("COMMIT;")
                    node2Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
                    console.log("committed and inserted into node 2")

                    node1Connection.query("UPDATE `logs` SET `status` = ? WHERE `id` = ?;", ['committed', e.id])
                    })
                } catch (err){
                    if(node1Connection != null) {
                        node1Connection.end()
                    }
                    if(node2Connection != null) {
                        node2Connection.end()
                    }
            }
            res.render('in', {id: newId, title: title, year: year, genre: genre, director: director, 
				actor1: actor1, actor2: actor2 })
        }
                
}
module.exports = globalFR2Controller;