const node1conn = {
    host: '172.16.3.142',
    port: '3306',
    user: 'group16',
    password: '12341234',
    database: 'movies',
    connectionLimit: 10
}

const node2conn = {
    host: '172.16.3.143',
    port: '3306',
    user: 'group16',
    password: '12341234',
    database: 'movies',
    connectionLimit: 10
}

const node3conn = {
    host: '172.16.3.144',
    port: '3306',
    user: 'group16',
    password: '12341234',
    database: 'movies',
    connectionLimit: 10
}

module.exports = { node1conn, node2conn, node3conn }
