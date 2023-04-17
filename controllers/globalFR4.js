const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const mysql = require('mysql2/promise');
//const mysql2 = require('mysql2');
const config = require('../models/conn');
var node1Connection
var node3Connection

const isolationLevelDefault = `REPEATABLE READ`;
const isolationLevelSql = `SET SESSION TRANSACTION ISOLATION LEVEL `;
const setIsolationLevel = isolationLevelSql + isolationLevelDefault

//Failure in writing to Node 2 or Node 3 when attempting to replicate the transaction from the central node
const globalFR4Controller = {
    /**
	 * This POST method inserts a movie into the DB
	 * @param {*} req 
	 * @param {*} res 
	 */
    Case4Update: async function (req, res) { 

        console.log('gonna execute insert');
        const title = req.query.movie;
		const year = req.query.year;
		const genre = req.query.genre;
		const director = req.query.director;
		const actor1 = req.query.actor1;
		const actor2 = req.query.actor2;
        const id = req.query.id;

        var logId;
        var flag = false;

        try {
            node1Connection = await mysql.createConnection(config.node1conn)
            console.log('connected to node 1')

            await node1Connection.query(setIsolationLevel)
            console.log("Isolation level is set to: " + isolationLevelDefault)
            await node1Connection.query("set autocommit = 0;")
            await node1Connection.query("START TRANSACTION;")
            await node1Connection.query("LOCK TABLES central write, logs WRITE;")
            await console.log('Locked tables central');

            //logs
            console.log("Start log inserted to node 1 logs")
            var sqlEntryLog = `UPDATE central SET title = '${title}', year = ${year}, genre = '${genre}', director = '${director}', actor1 = '${actor1}', actor2 = '${actor1}' WHERE id = '${id}'`;

            //update logs
            var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
            datalist = node1Connection.query(sqlEntryFill, ['UPDATE', sqlEntryLog, 3, 'start'])
            console.log("after start")
        
            datalist.then(function(result) {
                console.log(result)
                logId = result[0].insertId
                console.log("logid:")
                console.log(logId)
            })

            // update movie
            sqlEntryFill = 'UPDATE central SET title = ?, year = ?, genre = ?, director = ?, actor1 = ?, actor2 = ? WHERE id = ?';
            datalist = node1Connection.query(sqlEntryFill, [title, year, genre, director, actor1,actor2, id])
            console.log(datalist)

            datalist.then(function(result) {
                console.log(result)
                results = result[0]
            })   
            console.log('performed update')

            // update logs 
            await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
            await node1Connection.query("COMMIT;")
            await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
            await node1Connection.query("UNLOCK TABLES;")
    
            // end connections
            node1Connection.end()
            flag = true
        }
        catch (err){
            console.log(err)
                if (node1Connection != null) {
                    node1Connection.end()
                }
        }

        //makes sure that update in node 3 was made first before replicating to node 1
        if (flag) {
            try{
                node3Connection = await mysql.createConnection(config.node3conn)
                console.log('connected to node3')

				node3Connection = await mysql.createConnection(config.node3conn)
                await node3Connection.query(setIsolationLevel)
                console.log("Isolation level is set to: " + isolationLevelDefault)

                await node3Connection.query("set autocommit = 0;")
                console.log("autocommit=0")
				await node3Connection.query("START TRANSACTION;")
                console.log("start transaction")
				await node3Connection.query("LOCK TABLES node3 WRITE, logs WRITE;")
                await console.log('Locked tables node3');

                //logs
                console.log("Start log inserted to node3 logs")
                //var sqlEntryLog = `INSERT INTO central (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}','${director}','${actor1}','${actor1}')`;
                var sqlEntryLog = `UPDATE node3 SET title = '${title}', year = ${year}, genre = '${genre}', director = '${director}', actor1 = '${actor1}', actor2 = '${actor1}' WHERE id = '${id}'`;
                //update logs
                var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
                let datalist = node3Connection.query(sqlEntryFill, ['UPDATE', sqlEntryLog, 1, 'start'])
                console.log("after start")
                
				datalist.then(function(result) {
                    console.log(result)
                    logId = result[0].insertId
                    console.log("logid:")
                    console.log(logId)
                })

                sqlEntryFill = 'UPDATE node3 SET title = ?, year = ?, genre = ?, director = ?, actor1 = ?, actor2 = ? WHERE id = ?';
                datalist = node3Connection.query(sqlEntryFill, [title, year, genre, director, actor1,actor2, id])
                
				datalist.then(function(result) {
					console.log(result)
				})

				await node3Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
                node3Connection.destroy();
                (await node3Connection).ping(function (err) {
                    if (err) {
                        console.log('Node 3 failed!')
                    } 
                })
            
            }catch(err){
                console.log(err)
                if (node3Connection != null) {
                    node3Connection.end()
                }

                try {
                console.log('gonna recover node 3 logs')
                node3Connection = await mysql.createConnection(config.node3conn)
                var [rows1, fields1] = await node3Connection.query("SELECT * FROM `logs` WHERE `status` = ?;", ['committing'])
                console.log('connected to node 1');
        
                rows1.forEach(e => {
                    console.log(e)
                    var query = e.sql_statement
                    console.log(query)
                    console.log("This is the id : " + e.id)

                    node3Connection.query(query)
                    node3Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
		            node3Connection.query("COMMIT;")
                    node3Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
                    console.log("committed and inserted into node 1")

                    //node3Connection.query("UPDATE `logs` SET `status` = ? WHERE `id` = ?;", ['committed', e.id])
                    })
                } catch(err){
                    if(node3Connection != null) { node3Connection.end() }
                }
            }

        }
    }
}
                

module.exports = globalFR4Controller;