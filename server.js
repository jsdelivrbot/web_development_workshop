var http = require('http');
var fs = require('fs');
var ejs = require('ejs');
var queryString = require('query-string');
var book_store = require('json-fs-store')('./storage/books')

var count=0;

//create a server object:
http.createServer(function (req, res) {
    count++;
    //log the incoming request url
    console.log('[BEGIN] received request: ' + req.url);
    var path = 'assets' + req.url;

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
            console.log(body);
            console.log(book_details);
            book_store.add(book_details, function(err) {
                res.writeHead(302, {'Location': '/books'})
                res.end();
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

}).listen(8080); //the server object listens on port 8080
