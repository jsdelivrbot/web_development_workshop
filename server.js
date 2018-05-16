var http = require('http');
var fs = require('fs');
var ejs = require('ejs');
var queryString = require('query-string');
var book_store = require('json-fs-store')('./storage/books')
var WebSocket = require('ws');

const SERVER_PORT = process.env.PORT || 8080;

var count=0;

var books_count=0;

book_store.list(function(err, books) {
    books_count = books.length;
});

//create a server object:
var httpServer = http.createServer(function (req, res) {
    count++;
    //log the incoming request url
    console.log('[BEGIN] received request: ' + req.url);
    var path = 'assets' + req.url;

    if (req.url=='/') {
        path = 'assets/index.html';
    }

    // (static file serving handled here)
    if (fs.existsSync(path)) {
        // read file if it exists
        fs.readFile(path, function(err, data) {
            // send file contents as response
            res.write(data); //write a response to the client
            res.end(); //end the response
        });
        return; // end the request if it was handled here
    }

    // (custom actions/urls handled here)
    if(req.url == '/date'){
        res.write(new Date() + "");
        res.end();
        return;
    }

    if(req.url == '/request_count'){
        ejs.renderFile('./test.ejs', {count_value: count}, {}, function(err, str) {
            res.end(str);
        });
        return;
    }

    if(req.url == '/books'){
        var books = book_store.list(function (err, books) {
            ejs.renderFile('./books.ejs', {books: books}, {}, function(err, str) {
                res.end(str);
            });
        });
        return;
    }

    if(req.url == '/add_book'){
        var body = '';
        req.on('data', function(data) {
            body += data;
        });
        req.on('end', function(data) {
            var book_details = queryString.parse(body);
            if(body=="") {
                res.writeHead(302, {'Location': '/add_book.html'})
                res.end("please visit /add_books.html to add books");
                return;
            }
            book_details.id = ++books_count;
            book_details.count = +book_details.count || 0;
            console.log(body);
            console.log(book_details);
            // book_details.id = book_store++;
            book_store.add(book_details, function(err) {
                res.writeHead(302, {'Location': '/books'})
                res.end();
            });
        });
        return;
    }

    if(req.url == '/borrow_book'){
        var body = '';
        req.on('data', function(data) {
            body += data;
        });
        req.on('end', function(data) {
            var book_details = queryString.parse(body);
            console.log(body);
            console.log(book_details);
            book_store.load(book_details.book_id, function(err, book) {
                book.count = +book.count || 0;
                book.count--;
                book_store.add(book, function() {
                    res.writeHead(302, {'Location': '/books'})
                    res.end();
                });
            });
        });
        return;
    }

    if(req.url == '/some_custom_url'){
        res.end();
        return;
    }

    // unhandled urls. return 404 not found.
    console.log('unhandled url. returning 404')
    res.writeHead(404);
    res.end();

}).listen(SERVER_PORT); //the server object listens on port 8080


// create a websockets server
var wss = new WebSocket.Server({
    server: httpServer
});

wss.on('connection', function connection(ws, req) {

    const ip = req.connection.remoteAddress;
    console.log("[%s] new client connected", ip);

    ws.on('message', function incoming(message) {
        console.log('[%s] websocket message received: %s', ip, message);
    });

    ws.on('close', function close() {
        console.log('[%s] client disconnected', ip);
    });

     ws.send('hi client');

});
