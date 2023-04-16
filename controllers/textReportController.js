const dotenv = require('dotenv');
const e = require('express');
dotenv.config();

const mysql = require('mysql2/promise');
const config = require('../models/conn');
var node1Connection
var node2Connection
var node3Connection

const textReportController = {
    getReport: async function (req, res) { 
        console.log('gonna generate reports');

        const data = {
			title: "report",
			styles: ["style"],
			scripts: ["home"]
		}
			
        try {// search node 1
            node1Connection = await mysql.createConnection(config.node1conn)
        
            //search movie
            const qResult = await node2Connection.query(`SELECT * FROM central LIMIT 100;`)
    
            // end connections
            node1Connection.end()

            data.dataDB1 = qResult[0]

        } catch (err) {
            console.log(err)
            if (node1Connection != null) {
                node1Connection.end()
            }
            
            // goto node 2 and 3
			try {
				node2Connection = await mysql.createConnection(config.node2conn)
				const qResult1 = await node2Connection.query(`SELECT * FROM node2 LIMIT 50;`)

				node2Connection.end()

				node3Connection = await mysql.createConnection(config.node3conn)
				const qResult2 = await node3Connection.query(`SELECT * FROM node3 LIMIT 50;`)
				node3Connection.end()

				data.dataDB1 = qResult1[0]
				data.dataDB2 = qResult2[0]

				console.log("CONNECTED TO NODE 2 AND 3")

			} catch (err) {
				if(node2Connection != null) {
					node2Connection.end()
				}

				if(node3Connection != null) {
					node3Connection.end()
				}
				
				console.log(err)
			}
                
            
        }

        //res.render('search', { result: results })
        res.render('report', data)
		
    }
}
    
module.exports = textReportController;