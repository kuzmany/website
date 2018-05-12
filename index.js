const fs = require('fs');
const path = require('path');
//
const mysql = require('mysql');
//
const fetches = require('./libs/fetch');
const mutators = require('./libs/mutators');
//
const paths = {
    outPages: path.resolve(__dirname, 'out', 'pages'),
    outPosts: path.resolve(__dirname, 'out', 'posts'),
}

let connection;

//---------------------
const connect = async () => {
    return new Promise(resolve => {
        connection = mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            database: 'mt_org_migration',
            user: 'root',
            password: 'dockerpass'
        })
        connection.connect(err => {
            if (err) {
                throw err
            }
            resolve(connection.threadId)
        })
    })
}

const disconnect = async () => {
    return new Promise(resolve => {
        connection.end(err => {
            if (err) {
                throw err
            }
            resolve(connection.threadId)
        })
    })
}

const fwrite = async (content, path) => {
    return new Promise(resolve => {
        fs.writeFile(path, content, 'utf8', err => {
            if (err) {
                throw err
            }
            resolve();
        })
    })
}

//---------------------
const main = async () => {
    return new Promise(async resolve => {
        let cid = await connect();
        let post_types = await fetches.fetch(fetches.queries.getPublishedTypesCount, connection);
        let pages = await fetches.fetch(fetches.queries.getPublishedContentByType('page'), connection);
        pages.forEach(async (page, index) => {
            let mutatedPage = mutators.mutatePage(page);
            await fwrite(mutatedPage.fcontent, path.resolve(paths.outPages, mutatedPage.fname));
        })

        let posts = await fetches.fetch(fetches.queries.getPublishedContentByType('post'), connection);
        posts.forEach(async (page, index) => {
            let mutatedPosts = mutators.mutatePage(page);
            await fwrite(mutatedPosts.fcontent, path.resolve(paths.outPosts, mutatedPosts.fname));
        })

        resolve('yep, done!');
    })
};

main()
    .then(res => {
        console.log(`done?\n${res}\nconnection:${connection.threadId}`)
    })