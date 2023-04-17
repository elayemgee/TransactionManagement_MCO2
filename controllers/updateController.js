const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const mysql = require('mysql2/promise');
const config = require('../models/conn');
var node1Connection
var node2Connection
var node3Connection

const isolationLevelDefault = `READ UNCOMMITTED`;
const isolationLevelSql = `SET SESSION TRANSACTION ISOLATION LEVEL `;
const setIsolationLevel = isolationLevelSql + isolationLevelDefault

const updateController = {

    updatePage: function (req, res) {   
            res.render('update');        
    },

    updateRecord: async function (req, res) { 
        console.log('gonna execute update');
        const title = req.query.movie;
		const year = req.query.year;
		const genre = req.query.genre;
		const director = req.query.director;
		const actor1 = req.query.actor1;
		const actor2 = req.query.actor2;
        const id = req.query.id;

        var flag = false;
        var flag2 = false;
		var flag3 = false;
        var results
		var logId;

        if (year < 1980) {
			// insert to node 1
			try {
				console.log("<1980")
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
                var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
                let datalist = node1Connection.query(sqlEntryFill, ['UPDATE', sqlEntryLog, 1, 'start'])
                console.log("after start")
                
				datalist.then(function(result) {
                    console.log(result)
                    logId = result[0].insertId
                    console.log("logid:")
                    console.log(logId)
                })

                sqlEntryFill = 'UPDATE central SET title = ?, year = ?, genre = ?, director = ?, actor1 = ?, actor2 = ? WHERE id = ?';
                datalist = node1Connection.query(sqlEntryFill, [title, year, genre, director, actor1,actor2, id])
                console.log(datalist)
				console.log("hiii")
                
				datalist.then(function(result) {
					console.log(result)
				})

                console.log('performed update')

				await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
				await node1Connection.query("COMMIT;")
                console.log("commit")
				
				await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
				await node1Connection.query("UNLOCK TABLES;")
                console.log("unlock")
		
				// end connections
				node1Connection.end()		
				flag = true
		
			} catch (err) {
				console.log(err)
				if (node1Connection != null) {
					node1Connection.end()
				}
		
				// insert to node 2 if node 1 isn't successful
				try {
					// throw Error // simulate
					console.log("insert to node 2 if node 1 isn't successful")
					node2Connection = await mysql.createConnection(config.node2conn)

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
					flag3=true
				} catch (err) {
					var flag2 = true
					if (node2Connection != null) {
						node2Connection.end()
					}
				}
				if (flag3) { //if node 2 inserts we insert to node 1
					try {
						console.log("inserts to node 1 after node 2")
						node1Connection = await mysql.createConnection(config.node1conn)
						//nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)
                		await node1Connection.query(setIsolationLevel)
                		console.log("Isolation level is set to: " + isolationLevelDefault)

						await node1Connection.query("set autocommit = 0;")
                		console.log("autocommit=0")
						await node1Connection.query("START TRANSACTION;")
                		console.log("start transaction")
						await node1Connection.query("LOCK TABLES central write, logs WRITE;")
                		await console.log('Locked tables central');

                		//logs
                		console.log("Start log inserted to central logs")
                        var sqlEntryLog = `UPDATE central SET title = '${title}', year = ${year}, genre = '${genre}', director = '${director}', actor1 = '${actor1}', actor2 = '${actor1}' WHERE id = '${id}'`;

                		//update logs
                		var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
                		datalist = node1Connection.query(sqlEntryFill, ['UPDATE', sqlEntryLog, 1, 'start'])
                		console.log("after start")
                
						datalist.then(function(result) {
                    		console.log(result)
                    		logId = result[0].insertId
                    		console.log("logid:")
                    		console.log(logId)
                		})
							
                		sqlEntryFill = 'UPDATE central SET title = ?, year = ?, genre = ?, director = ?, actor1 = ?, actor2 = ? WHERE id = ?';
                		datalist = await node1Connection.query(sqlEntryFill, [title, year, genre, director, actor1,actor2, id])
                		console.log(datalist)

                		datalist.then(function(result) {
                    		console.log(result)
                 		})   
                		console.log('performed update')

						await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
						await node1Connection.query("COMMIT;")
                		console.log("commit")

						await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
						await node1Connection.query("UNLOCK TABLES;")
                		console.log("unlock")
		
						// end connections
						node1Connection.end()
					}
					catch (err) {
						flag2=true
						if (node1Connection != null) {
							node1Connection.end()
						}
					}
				}
			}
		
			if (flag) {
				try {
					console.log("<1980")
					node2Connection = await mysql.createConnection(config.node2conn)
                	await node2Connection.query(setIsolationLevel)
                	console.log("Isolation level is set to: " + isolationLevelDefault)

                	await node2Connection.query("set autocommit = 0;")
                	console.log("autocommit=0")
					await node2Connection.query("START TRANSACTION;")
                	console.log("start transaction heeere")
					await node2Connection.query("LOCK TABLES node2 WRITE, logs WRITE;")
                	await console.log('Locked tables node2');

                	//logs
                	console.log("Start log inserted to node2 logs")
                    var sqlEntryLog = `UPDATE central SET title = '${title}', year = ${year}, genre = '${genre}', director = '${director}', actor1 = '${actor1}', actor2 = '${actor1}' WHERE id = '${id}'`;

                	//update logs
                	var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
                	let datalist = node2Connection.query(sqlEntryFill, ['UPDATE', sqlEntryLog, 1, 'start'])
                	console.log("after start")
                
					datalist.then(function(result) {
                    	console.log(result)
                    	logId = result[0].insertId
                    	console.log("logid:")
                    	console.log(logId)
                	})

                	sqlEntryFill = 'UPDATE node2 SET title = ?, year = ?, genre = ?, director = ?, actor1 = ?, actor2 = ? WHERE id = ?';
                	datalist = node2Connection.query(sqlEntryFill, [title, year, genre, director, actor1,actor2, id])
                	console.log(datalist)
					console.log("hiii")
                
					datalist.then(function(result) {
						console.log(result)
					})

                	console.log('performed update')

					await node2Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
					await node2Connection.query("COMMIT;")
                	console.log("commit")
				
					await node2Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
					await node2Connection.query("UNLOCK TABLES;")
                	console.log("unlock")
		
					// end connections
					node2Connection.end()		
				
				} catch (err) {
					flag2=true
					if (node2Connection != null) {
						node2Connection.end()
					}
				}
			}
		} 
		
		else if (year >= 1980) {
			try {
				// throw Error // simulate
				node1Connection = await mysql.createConnection(config.node1conn)
				//nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)
                console.log("node 1: connected to node 1")

                await node1Connection.query(setIsolationLevel)
                console.log("Isolation level is set to: " + isolationLevelDefault)
		
				await node1Connection.query("set autocommit = 0;")
                console.log("node 1: autocommit = 0")

				await node1Connection.query("START TRANSACTION;")
                console.log("node 1: started transaction")
				await node1Connection.query("LOCK TABLES central write, logs WRITE;")
                await console.log('Locked tables central');

				//logs
				console.log("Start log inserted to central logs")
                var sqlEntryLog = `UPDATE central SET title = '${title}', year = ${year}, genre = '${genre}', director = '${director}', actor1 = '${actor1}', actor2 = '${actor1}' WHERE id = '${id}'`;

				//update logs
				var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
				datalist = node1Connection.query(sqlEntryFill, ['UPDATE', sqlEntryLog, 1, 'start'])
				console.log("after start")
			
				datalist.then(function(result) {
					console.log(result)
					logId = result[0].insertId
					console.log("logid:")
					console.log(logId)
				})

				console.log("before update")
                sqlEntryFill = 'UPDATE central SET title = ?, year = ?, genre = ?, director = ?, actor1 = ?, actor2 = ? WHERE id = ?';
                datalist = node1Connection.query(sqlEntryFill, [title, year, genre, director, actor1,actor2, id])
				console.log("after update")

                datalist.then(function(result) {
                    console.log(result)
                    results = result[0]
                 })   
                console.log('performed update')

                // update logs 
				await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
				await node1Connection.query("COMMIT;")
                console.log("node 1: performed commit")

				await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
				await node1Connection.query("UNLOCK TABLES;")
                console.log("node 1: unlocked tables")
		
				// end connections
				node1Connection.end()
                console.log("node 1: ended connection")
				flag = true

			} catch (err) {
				flag2=true
				if (node1Connection != null) {
					node1Connection.end()
				}
		
				try {
					// enter node 3 if node 1 fails
					node3Connection = await mysql.createConnection(config.node3conn)
                    console.log('node 3: established connection')
					//nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)

                    await node3Connection.query(setIsolationLevel)
                    console.log("Isolation level is set to: " + isolationLevelDefault)
		
					await node3Connection.query("set autocommit = 0;")
                    console.log('node 3: set autocommit')

					await node3Connection.query("START TRANSACTION;")
                    console.log('node 3: started transaction')

					await node3Connection.query("LOCK TABLES node3 write, logs WRITE;")
                	await console.log('Locked tables node3');

					//logs
					console.log("Start log inserted to node3 logs")
                    var sqlEntryLog = `UPDATE central SET title = '${title}', year = ${year}, genre = '${genre}', director = '${director}', actor1 = '${actor1}', actor2 = '${actor1}' WHERE id = '${id}'`;

					//update logs
					var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
					datalist = node1Connection.query(sqlEntryFill, ['UPDATE', sqlEntryLog, 1, 'start'])
					console.log("after start")
			
					datalist.then(function(result) {
						console.log(result)
						logId = result[0].insertId
						console.log("logid:")
						console.log(logId)
					})
		
					// update movie
                    sqlEntryFill = 'UPDATE node3 SET title = ?, year = ?, genre = ?, director = ?, actor1 = ?, actor2 = ? WHERE id = ?';
                    datalist = node3Connection.query(sqlEntryFill, [title, year, genre, director, actor1,actor2, id])
                    console.log(datalist)

                    datalist.then(function(result) {
                        console.log(result)
                        results = result[0]
                    })   
                    console.log('performed update')

                    // update logs 
					await node3Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
					await node3Connection.query("COMMIT;")
                    console.log('node 3: committed')

					await node3Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
					await node3Connection.query("UNLOCK TABLES;")
                    console.log('node 3: unlocked tables')

					// end connections
					node3Connection.end()
					flag3=true

				} catch (err) {
					flag2 = true
					if (node3Connection != null) {
						node3Connection.end()
					}
				}
				if (flag3) {
					try {
						console.log("inserts to node 1 after node 3")
						node1Connection = await mysql.createConnection(config.node1conn)
						//nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)
                		await node1Connection.query(setIsolationLevel)
                		console.log("Isolation level is set to: " + isolationLevelDefault)

						await node1Connection.query("set autocommit = 0;")
                		console.log("autocommit=0")
						await node1Connection.query("START TRANSACTION;")
                		console.log("start transaction")
						await node1Connection.query("LOCK TABLES central write, logs WRITE;")
                		await console.log('Locked tables central');

						//logs
						console.log("Start log inserted to central logs")
                        var sqlEntryLog = `UPDATE central SET title = '${title}', year = ${year}, genre = '${genre}', director = '${director}', actor1 = '${actor1}', actor2 = '${actor1}' WHERE id = '${id}'`;

						//update logs
						var sqlEntryFill = 'INSERT INTO logs (operation, sql_statement, node_id, status) VALUES (?,?,?,?)';
						datalist = node1Connection.query(sqlEntryFill, ['UPDATE', sqlEntryLog, 1, 'start'])
						console.log("after start")
			
						datalist.then(function(result) {
							console.log(result)
							logId = result[0].insertId
							console.log("logid:")
							console.log(logId)
						})
		
                		sqlEntryFill = 'UPDATE central SET title = ?, year = ?, genre = ?, director = ?, actor1 = ?, actor2 = ? WHERE id = ?';
                		let datalist = await node1Connection.query(sqlEntryFill, [title, year, genre, director, actor1,actor2, id])
                		console.log(datalist)

                		datalist.then(function(result) {
                    		console.log(result)
                 		})   
                		console.log('performed update')

						await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
						await node1Connection.query("COMMIT;")
                		console.log("commit")

						await node1Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
						await node1Connection.query("UNLOCK TABLES;")
                		console.log("unlock")
		
						// end connections
						node1Connection.end()
					}

					catch(err) {
						flag2=true
						if (node1Connection != null) {
							node1Connection.end()
						}
					}
				}
			}
		
			if (flag) {
				// insert to node 3 if node 1 is successful
				try {
					// throw Error // simulate
					node3Connection = await mysql.createConnection(config.node3conn)
                    console.log('node 3: established connection')

					//nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)
                    await node3Connection.query(setIsolationLevel)
                    console.log("Isolation level is set to: " + isolationLevelDefault)
		
					await node3Connection.query("set autocommit = 0;")
                    console.log('node 3: autocommit')
					await node3Connection.query("START TRANSACTION;")
                    console.log('node 3: started transaction')
					await node3Connection.query("LOCK TABLES node3 write, logs WRITE;")
                	await console.log('Locked tables central');

					//logs
					console.log("Start log inserted to node3 logs")
                    var sqlEntryLog = `UPDATE central SET title = '${title}', year = ${year}, genre = '${genre}', director = '${director}', actor1 = '${actor1}', actor2 = '${actor1}' WHERE id = '${id}'`;

                    console.log("preeesent")
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
		
					// update movie
                    sqlEntryFill = 'UPDATE node3 SET title = ?, year = ?, genre = ?, director = ?, actor1 = ?, actor2 = ? WHERE id = ?';
                    datalist = node3Connection.query(sqlEntryFill, [title, year, genre, director, actor1,actor2, id])
                    console.log(datalist)

                    datalist.then(function(result) {
                        console.log(result)
                        //results = result[0]
                    })   
                    console.log('performed update')

                    // update logs 
                    
					await node3Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committing', logId]);
					await node3Connection.query("COMMIT;")
                    console.log('node 3: committed')
					await node3Connection.query('UPDATE `logs` SET `status` = ? WHERE `id` = ?;', ['committed', logId]);
					await node3Connection.query("UNLOCK TABLES;")
                    console.log('node 3: unlocked tables')
		
					// end connections
					node3Connection.end()
                    console.log('node 3: ended connection')

				} catch (err) {
					flag2=true
					if (node3Connection != null) {
						node3Connection.end()
					}
				}
			}
		}
		
		
		// flag 2 means none of the nodes were able to be modified
		if(flag2) {
			res.send(false)
		} else {
			//res.send(true)
    
            console.log(results)
			res.render('update', { id: id, title: title, year: year, genre: genre, director: director, 
				actor1: actor1, actor2: actor2 })
		}
    }
}
    
module.exports = updateController;