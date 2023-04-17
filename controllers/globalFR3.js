const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const mysql = require('mysql2/promise');
//const mysql2 = require('mysql2');
const config = require('../models/conn');
var node1Connection
var node2Connection

const isolationLevelDefault = `REPEATABLE READ`;
const isolationLevelSql = `SET SESSION TRANSACTION ISOLATION LEVEL `;
const setIsolationLevel = isolationLevelSql + isolationLevelDefault


const globalFR3Controller = {
    /**
	 * This POST method inserts a movie into the DB
	 * @param {*} req 
	 * @param {*} res 
	 */
    Case3Update: async function (req, res) { 

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
            node2Connection = await mysql.createConnection(config.node2conn)
            console.log('connected to node2')

            await node2Connection.query(setIsolationLevel)
            console.log("Isolation level is set to: " + isolationLevelDefault)
            await node2Connection.query("set autocommit = 0;")
            await node2Connection.query("START TRANSACTION;")
            await node2Connection.query("LOCK TABLES node2 write, logs WRITE;")
            await console.log('Locked tables central');

            //logs
            console.log("Start log inserted to node 2 logs")
            var sqlEntryLog = `UPDATE central SET title = '${title}', year = ${year}, genre = '${genre}', director = '${director}', actor1 = '${actor1}', actor2 = '${actor1}' WHERE id = '${id}'`;

            //update logs
            var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
            datalist = node2Connection.query(sqlEntryFill, ['UPDATE', sqlEntryLog, 1, 'start'])
            console.log("after start")
        
            datalist.then(function(result) {
                console.log(result)
                logId = result[0].insertId
                console.log("logid:")
                console.log(logId)
            })

            // update movie
            sqlEntryFill = 'UPDATE node2 SET title = ?, year = ?, genre = ?, director = ?, actor1 = ?, actor2 = ? WHERE id = ?';
            datalist = node2Connection.query(sqlEntryFill, [title, year, genre, director, actor1,actor2, id])
            console.log(datalist)

            datalist.then(function(result) {
                console.log(result)
                results = result[0]
            })   
            console.log('performed update')

            // update logs 
            await node2Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
            await node2Connection.query("COMMIT;")
            await node2Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
            await node2Connection.query("UNLOCK TABLES;")
    
            // end connections
            node2Connection.end()
            flag = true
        }
        catch (err){
            console.log(err)
                if (node2Connection != null) {
                    node2Connection.end()
                }
        }

        //makes sure that update in node 2 was made first before replicating to node 1
        if (flag) {
            try{
                node1Connection = await mysql.createConnection(config.node1conn)
                console.log('connected to node1')

				node1Connection = await mysql.createConnection(config.node1conn)
                await node1Connection.query(setIsolationLevel)
                console.log("Isolation level is set to: " + isolationLevelDefault)

                await node1Connection.query("set autocommit = 0;")
                console.log("autocommit=0")
				await node1Connection.query("START TRANSACTION;")
                console.log("start transaction")
				await node1Connection.query("LOCK TABLES central WRITE, logs WRITE;")
                await console.log('Locked tables central');

                //logs
                console.log("Start log inserted to central logs")
                //var sqlEntryLog = `INSERT INTO central (title, year, genre, director, actor1, actor2) VALUES ('${title}',${year},'${genre}','${director}','${actor1}','${actor1}')`;
                var sqlEntryLog = `UPDATE central SET title = '${title}', year = ${year}, genre = '${genre}', director = '${director}', actor1 = '${actor1}', actor2 = '${actor1}' WHERE id = '${id}'`;
                //update logs
                var sqlEntryFill = 'INSERT INTO logs (id, operation, sql_statement, node_id, status) VALUES (?, ?,?,?,?)';
                //let datalist = node1Connection.query(sqlEntryFill, [logId, 'UPDATE', sqlEntryLog, 2, 'start'])
                await node1Connection.query(sqlEntryFill, [logId, 'UPDATE', sqlEntryLog, 2, 'start'])

                console.log("after start")
                /*
				datalist.then(function(result) {
                    console.log(result)
                    logId = result[0].insertId
                    console.log("logid:")
                    console.log(logId)
                })*/

                //execute update
                sqlEntryFill = 'UPDATE central SET title = ?, year = ?, genre = ?, director = ?, actor1 = ?, actor2 = ? WHERE id = ?';
                //datalist = 
                await node1Connection.query(sqlEntryFill, [title, year, genre, director, actor1,actor2, id])
                
                /*
				datalist.then(function(result) {
					console.log(result)
				})*/

				await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
                
                await node1Connection.destroy()
                console.log('destroyed')
                
                
                (await node1Connection).ping(function (err) {
                    if (err) {
                        //console.log('Central node failed!')
                        node1Connection.end()
                    } 
                })
                
            
            }catch(err){
                console.log(err)
                if (node1Connection != null) {
                    node1Connection.end()
                }

                

                try {
                console.log('gonna recover node 1 logs')
                node1Connection = await mysql.createConnection(config.node1conn)
                var [rows1, fields1] = await node1Connection.query("SELECT * FROM `logs` WHERE `status` = ?;", ['committing'])
                console.log('connected to node 1');
        
                rows1.forEach(async e => {
                    console.log(e)
                    var query = e.sql_statement
                    console.log(query)
                    console.log("This is the id : " + e.id)

                    await node1Connection.query(query)
                    await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
		            await node1Connection.query("COMMIT;")
                    await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
                    console.log("committed and inserted into node 1")

                    //await node1Connection.query("UPDATE `logs` SET `status` = ? WHERE `id` = ?;", ['committed', e.id])
                    })
                } catch(err){
                    if(node1Connection != null) { node1Connection.end() }
                }
            }

        }
    }
}
                

module.exports = globalFR3Controller;