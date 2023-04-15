const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const mysql = require('mysql2/promise');
const config = require('../models/conn');
var node1Connection
var node2Connection
var node3Connection

const updateController = {

    updatePage: function (req, res) {   
            res.render('update');        
    },


    updateRecord: async function (req, res) { 
        console.log('gonna execute update');
        //const sqlEntry = `UPDATE movies SET name ='${title}',year='${year}', genre='${genre}',director='${director}',actor1='${actor1}',actor2='${actor2}' WHERE id=${id}`;
        const id = req.query.id;
        const title = req.query.movie;
		const year = req.query.year;
		const genre = req.query.genre;
		const director = req.query.director;
		const actor1 = req.query.actor1;
		const actor2 = req.query.actor2;

        var flag = false;
        var flag2 = false;

        if (year < 1980) {
			// insert to node 1
			try {
				// throw Error // simulate
				// insert in node 1 table 1
				// connections
				node1Connection = await mysql.createConnection(config.node1conn)
				//nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)
                
				await node1Connection.query("set autocommit = 0;")
                console.log("autocommit=0")
				await node1Connection.query("START TRANSACTION;")
                console.log("start transaction")
				await node1Connection.query("LOCK TABLES node1 write;")
                console.log("lock")
		
				// insert in logs
				/*await nodeLogsConnection.query("INSERT INTO `node1_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('update', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node1');")
				console.log("Start log inserted to node 1 table 1")*/
		
				// update movie
				await node1Connection.query("UPDATE node1 SET `title` = '" + title + "'," + "`year` = " + year + "," + "`genre` = " + genre  + "',"+ "`director` = " + director + "',"+ "`actor1 = `" + actor1 + "',"+ "`actor2 = `" + actor2 + " WHERE id = " + id + ";")
                console.log("updated works")
				// update logs 
				//await nodeLogsConnection.query("UPDATE `node1_logs` SET `status` = 'write' WHERE `name` = ? AND `dest` = 'node1';", [movieName])
				// await nodeLogsConnection.query("UPDATE `node1_logs` SET `status` = 'write' WHERE `name` = '" + movieName + "' AND `dest` = 'node1';")
				//console.log("Log updated to write in node 1 table 1")
				await node1Connection.query("COMMIT;")
                console.log("commit")
				await node1Connection.query("UNLOCK TABLES;")
                console.log("unlock")
		
				// update logs
				//await nodeLogsConnection.query('UPDATE `node1_logs` SET `status` = ? WHERE `name` = ? AND `dest` = ?;', ['committing', movieName, 'node1'])
				//console.log("Log updated to committing in node 1 table 1")
				//await nodeLogsConnection.query('UPDATE `node1_logs` SET `status` = ? WHERE `name` = ? AND `dest` = ?;', ['committed', movieName, 'node1'])
				//console.log("Log updated to committed in node 1 table 1")
				//console.log("Inserted to node 1 table 1")
		
				// end connections
				node1Connection.end()
				nodeLogsConnection.end()
		
				flag = true
		
			} catch (err) {
				console.log(err)
				if (node1Connection != null) {
					node1Connection.end()
				}
                /*
				if (nodeLogsConnection != null) {
					nodeLogsConnection.end()
				}*/
		
				// insert to node 2 if node 1 isn't successful
				try {
					// throw Error // simulate
					node2Connection = await mysql.createConnection(config.node2conn)
					nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)
		
					await node2Connection.query("set autocommit = 0;")
					await node2Connection.query("START TRANSACTION;")
					await node2Connection.query("LOCK TABLES node2 write;")
		
					// insert in logs
					//await nodeLogsConnection.query("INSERT INTO `node2_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('update', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node2');")
					//console.log("Start log inserted to node 2")
		
					// update movie
                    await node2Connection.query("UPDATE node2 SET `title` = '" + title + "'," + "`year` = " + year + "," + "`genre` = " + genre  + "',"+ "`director` = " + director + "',"+ "`actor1 = `" + actor1 + "',"+ "`actor2 = `" + actor2 + " WHERE id = " + id + ";")					
					// update logs 
					//await nodeLogsConnection.query("UPDATE `node2_logs` SET `status` = 'write' WHERE `name` = ? AND `dest` = 'node2';", [movieName])
					//console.log("Log updated to write in node 2")
					await node2Connection.query("COMMIT;")
					await node2Connection.query("UNLOCK TABLES;")
		
					// update logs
					//await nodeLogsConnection.query("UPDATE `node2_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node2';", ['committing', movieName])
					//console.log("Log updated to committing in node 2")
					//await nodeLogsConnection.query("UPDATE `node2_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node2';", ['committed', movieName])
					//console.log("Log updated to committed in node 2")
					//console.log("Inserted to node 2")
		
					// log na nag fail sa node 1
					//await nodeLogsConnection.query("INSERT INTO `node2_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('update', '" + movieName + "'," + movieYear + "," + movieRank + ", 'committing', 'node1');")
					//console.log("Successful insert in node2 but unsuccessful in node1")
		
					// end connections
					node2Connection.end()
					//nodeLogsConnection.end()
		
					// create log to put to node 2 na unCOMMITted ung last query, tas after, query in node 1 pag naka recover na
		
				} catch (err) {
					var flag2 = true
					//console.log(err)
					if (node2Connection != null) {
						node2Connection.end()
					}
                    /*
					if (nodeLogsConnection != null) {
						nodeLogsConnection.end()
					}*/
		
					// update logs status = terminated, since nag error sa lahat
                    /*
					try {
						nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)
		
						await nodeLogsConnection.query("INSERT INTO `node2_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('update', '" + movieName + "'," + movieYear + "," + movieRank + ", 'terminated', 'node2');")
						//console.log("Logs in node2_logs terminated")
		
						await nodeLogsConnection.query("INSERT INTO `node1_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('update', '" + movieName + "'," + movieYear + "," + movieRank + ", 'terminated', 'node1');")
						//console.log("Logs in node1_logs terminated")
		
					} catch(err) {
						//console.log(err)
						if(nodeLogsConnection != null) {
							nodeLogsConnection.end()
						}
					}
                    */
		
					
				}
			}
		
			if (flag) {
				try {
					// throw Error // simulate
                    console.log("---------------")
                    console.log("node 2")
					node2Connection = await mysql.createConnection(config.node2conn)
					//nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)
		
					await node2Connection.query("set autocommit = 0;")
                    console.log("node2: autocommit=0")
					await node2Connection.query("START TRANSACTION;")
                    console.log("node 2: start transaction")
					await node2Connection.query("LOCK TABLES node2 write;")
                    console.log("node 2: lock")

		
					// insert in logs
					//await nodeLogsConnection.query("INSERT INTO `node2_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('update', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node2');")
					//console.log("Start log inserted to node 2")
		
					// update movie
                    await node2Connection.query("UPDATE node1 SET `title` = '" + title + "'," + "`year` = " + year + "," + "`genre` = " + genre  + "',"+ "`director` = " + director + "',"+ "`actor1 = `" + actor1 + "',"+ "`actor2 = `" + actor2 + " WHERE id = " + id + ";")		
                    console.log("node 2: update worked")			
					// update logs 
					//await nodeLogsConnection.query("UPDATE `node2_logs` SET `status` = 'write' WHERE `name` = ? AND `dest` = 'node2';", [movieName])
					//console.log("Log updated to write in node 2")
					await node2Connection.query("COMMIT;")
                    console.log("node2: commit")
					await node2Connection.query("UNLOCK TABLES;")
                    console.log("node2: update tables")
		
					// update logs
					//await nodeLogsConnection.query("UPDATE `node2_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node2'", ['committing', movieName])
					//console.log("Log updated to committing in node 2")
					//await nodeLogsConnection.query("UPDATE `node2_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node2';", ['committed', movieName])
					//console.log("Log updated to committed in node 2")
					//console.log("Inserted to node 2 no error in node 1")
		
					// end connections
					node2Connection.end()
					//nodeLogsConnection.end()
				} catch (err) {
					// log to node 1 na di gumana ung node 2, may unCOMMITted sa node 2, node 1 = on RECOVERY
					if (node2Connection != null) {
						node2Connection.end()
					}
		
					//nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)
		
					// create log in node1 na di pumasok sa node 2 ung insert, pero successful in node 1
					// log na nag fail sa node 2
                    /*
					try {
						
						await nodeLogsConnection.query("INSERT INTO `node1_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('update', '" + movieName + "'," + movieYear + "," + movieRank + ", 'committing', 'node2');")
						//console.log("Successful insert in node1 but unsuccessful in node2")
						nodeLogsConnection.end()
					} catch(err) {
						if(nodeLogsConnection != null) {
							nodeLogsConnection.end()
						}
					}
                    */
				}
			}
		
		
		} else if (year >= 1980) {
			try {
				// throw Error // simulate
				node1Connection = await mysql.createConnection(config.node1conn)
				//nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)
                console.log("node 1: connected to node 1")
		
				await node1Connection.query("set autocommit = 0;")
                console.log("node 1: autocommit = 0")

				await node1Connection.query("START TRANSACTION;")
                console.log("node 1: started transaction")

				await node1Connection.query("LOCK TABLES central write;")
                console.log("node 1: locked central")

		
				// insert in logs
				//await nodeLogsConnection.query("INSERT INTO `node1_2_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('update', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node1_2');")
				//console.log("Start log inserted to node 1 table 2")
		
				// update movie
                await node1Connection.query("UPDATE node1 SET `title` = '" + title + "'," + "`year` = " + year + "," + "`genre` = " + genre  + "',"+ "`director` = " + director + "',"+ "`actor1 = `" + actor1 + "',"+ "`actor2 = `" + actor2 + " WHERE id = " + id + ";")				
                console.log("node 1: performed update")

                // update logs 
				//await nodeLogsConnection.query("UPDATE `node1_2_logs` SET `status` = 'write' WHERE `name` = ? AND `dest` = 'node1_2';", [movieName])
				//console.log("Log updated to write in node 1 table 2")
				await node1Connection.query("COMMIT;")
                console.log("node 1: performed commit")

				await node1Connection.query("UNLOCK TABLES;")
                console.log("node 1: unlocked tables")

		
				// update logs
				//await nodeLogsConnection.query("UPDATE `node1_2_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node1_2';", ['committing', movieName])
				//console.log("Log updated to committing in node 1 table 2")
				//await nodeLogsConnection.query("UPDATE `node1_2_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node1_2';", ['committed', movieName])
				//console.log("Log updated to committed in node 1 table 2")
				//console.log("Inserted to node 1 table 2")
		
				// end connections
				node1Connection.end()
                console.log("node 1: ended connection")

				//nodeLogsConnection.end()
		
				flag = true
			} catch (err) {
				if (node1Connection != null) {
					node1Connection.end()
				}
                /*
				if (nodeLogsConnection != null) {
					nodeLogsConnection.end()
				}*/
		
				try {
					// throw Error // simulate
					node3Connection = await mysql.createConnection(config.node3conn)
                    console.log('node 3: established connection')
					//nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)
		
					await node3Connection.query("set autocommit = 0;")
                    console.log('node 3: set autocommit')

					await node3Connection.query("START TRANSACTION;")
                    console.log('node 3: started transaction')

					await node3Connection.query("LOCK TABLES node3 write;")
                    console.log('node 3: locked tables')
		
					// insert in logs
					//await nodeLogsConnection.query("INSERT INTO `node3_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('update', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node3');")
					//console.log("Start log inserted to node3")
		
					// update movie
                    await node3Connection.query("UPDATE node1 SET `title` = '" + title + "'," + "`year` = " + year + "," + "`genre` = " + genre  + "',"+ "`director` = " + director + "',"+ "`actor1 = `" + actor1 + "',"+ "`actor2 = `" + actor2 + " WHERE id = " + id + ";")					
                    console.log('node 3: locked tables')

                    // update logs 
					//await nodeLogsConnection.query("UPDATE `node3_logs` SET `status` = 'write' WHERE `name` = ? AND `dest` = 'node3';", [movieName])
					//console.log("Log updated to write in node3")
					await node3Connection.query("COMMIT;")
                    console.log('node 3: committed')

					await node3Connection.query("UNLOCK TABLES;")
                    console.log('node 3: unlocked tables')
		
					// update logs
					//await nodeLogsConnection.query("UPDATE `node3_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node3';", ['committing', movieName])
					//console.log("Log updated to committing in node3")
					//await nodeLogsConnection.query("UPDATE `node3_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node3';", ['committed', movieName])
					//console.log("Log updated to committed in node3")
					//console.log("Inserted to node3")
		
					// log na nag fail sa node 1
                    /*
					await nodeLogsConnection.query("INSERT INTO `node3_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('update', '" + movieName + "'," + movieYear + "," + movieRank + ", 'committing', 'node1_2');")
					console.log("Successful insert in node3 but unsuccessful in node1")
                    */
		
					// end connections
					node3Connection.end()
					//nodeLogsConnection.end()
		
					//
				} catch (err) {
					flag2 = true
					if (node3Connection != null) {
						node3Connection.end()
					}
                    /*
					if (nodeLogsConnection != null) {
						node3Connection.end()
					}*/
		
					// update logs status = terminated, since nag error sa lahat
                    /*
					try {
						nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)
		
						await nodeLogsConnection.query("INSERT INTO `node3_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('update', '" + movieName + "'," + movieYear + "," + movieRank + ", 'terminated', 'node3');")
						console.log("Logs in node3_logs terminated")
		
						await nodeLogsConnection.query("INSERT INTO `node1_2_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('update', '" + movieName + "'," + movieYear + "," + movieRank + ", 'terminated', 'node1');")
						console.log("Logs in node1_logs terminated")
		
					} catch(err) {
						console.log(err)
                        
						if(nodeLogsConnection != null) {
							nodeLogsConnection.end()
						}
                        
					}*/
				}
			}
		
			if (flag) {
				// insert to node 3 if node 1 is successful
				try {
					// throw Error // simulate
					node3Connection = await mysql.createConnection(config.node3conn)
                    console.log('node 3: established connection')

					//nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)
		
					await node3Connection.query("set autocommit = 0;")
                    console.log('node 3: autocommit')

					await node3Connection.query("START TRANSACTION;")
                    console.log('node 3: started transaction')

					await node3Connection.query("LOCK TABLES node3 write;")
                    console.log('node 3: locked tables')

					// insert in logs
                    /*
					await nodeLogsConnection.query("INSERT INTO `node3_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('update', '" + movieName + "'," + movieYear + "," + movieRank + ", 'start', 'node3');")
					console.log("Start log inserted to node3")
                    */
		
					// update movie
                    await node3Connection.query("UPDATE node1 SET `title` = '" + title + "'," + "`year` = " + year + "," + "`genre` = " + genre  + "',"+ "`director` = " + director + "',"+ "`actor1 = `" + actor1 + "',"+ "`actor2 = `" + actor2 + " WHERE id = " + id + ";")					
                    console.log('node 3:did update')

                    // update logs 
                    
					//await nodeLogsConnection.query("UPDATE `node3_logs` SET `status` = 'write' WHERE `name` = ? AND `dest` = 'node3';", [movieName])
					//console.log("Log updated to write in node3")

					await node3Connection.query("COMMIT;")
                    console.log('node 3: committed')

					await node3Connection.query("UNLOCK TABLES;")
                    console.log('node 3: unlocked tables')

					// update logs
                    /*
					await nodeLogsConnection.query("UPDATE `node3_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node3';", ['committing', movieName])
					console.log("Log updated to committing in node3")
					await nodeLogsConnection.query("UPDATE `node3_logs` SET `status` = ? WHERE `name` = ? AND `dest` = 'node3';", ['committed', movieName])
					console.log("Log updated to committed in node3")
					console.log("Inserted to node3")
                    */
		
					// end connections
					node3Connection.end()
                    console.log('node 3: ended connection')

					//nodeLogsConnection.end()
				} catch (err) {
					if (node3Connection != null) {
						node3Connection.end()
					}
                    /*
					if (nodeLogsConnection != null) {
						nodeLogsConnection.end()
					}
                    */
		
					// log to node 1 na di gumana ung node 3, may unCOMMITted sa node 3, node 1 = on, tas i query sa node 3 ung logged sa node 1
					// create log in node1 na di pumasok sa node 3 ung insert, pero successful in node 1
					// log na nag fail sa node 3
                    /*
					try {
						nodeLogsConnection = await mysql.createConnection(config.nodeLogsConn)
						await nodeLogsConnection.query("INSERT INTO `node1_2_logs` (`operation`, `name`, `year`, `rank`, `status`, `dest`) VALUES ('update', '" + movieName + "'," + movieYear + "," + movieRank + ", 'committing', 'node3');")
						console.log("Successful insert in node1 but unsuccessful in node3")
					} catch(err) {
						if(nodeLogsConnection != null) {
							nodeLogsConnection.end()
						}
					}
                    */
				}
			}
		}
		
		
		// false pag di na add sa node 1/node2 or 3
		if(flag2) {
			res.send(false)
		} else {
			res.send(true)
		}
    }
}
    
module.exports = updateController;