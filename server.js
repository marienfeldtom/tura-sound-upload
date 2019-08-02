var express = require("express");
var multer = require('multer');
var app = express();
const crypto = require('crypto');
var path = require('path');
const accepted_extensions = ['mp3'];
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
var swig  = require('swig');

app.use(express.json())

const adapter = new FileSync('db.json')
const db = low(adapter)

const adapter2 = new FileSync('public/uploads/files.json')
const db2 = low(adapter2)

function isValid(fields) {
    if (db.get('spieler')
        .find({ username: fields.username })
        .value().passwort == fields.passwort) {
        return true;
    } else {
        return false;
    }
}

function fileValid(file) {
    if (!file) {
        return false;
    } else {
        return true;
    }
}

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './public/uploads');
    },
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            if (err) return cb(new Error('Fehler'));
            cb(null, req.body.username + path.extname(file.originalname))
        })
    }
});

var upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        console.log("hi");
        if (!isValid(req.body)) {
            return cb(new Error('Falsches Passwort'));
        }
        if (file.mimetype !== 'audio/mp3') {
            return cb(new Error('Falsches Format'));
        }
        cb(null, true);
    }
}).single('mp3');


app.use(express.static('public'));
app.engine('html',swig.renderFile);
    app.set('view engine', 'html');

app.get('/', function (req, res) {
   // res.sendFile(__dirname + "/index.html");
   db.read();
   res.render('index', {spieler: db.get('spieler').value()});
});

app.post('/upload', function (req, res) {
    db.read();
    upload(req, res, function (err) {
        if (!req.file) {
            return res.status(500).send("Bitte wähle eine Datei aus!");
        }
        if (err) return res.status(500).send(err.message);
        console.log(req.body.username);
        var spieler = db.get('spieler').find({ username: req.body.username }).value();
        console.log(spieler);
        var spieler2 = db2.get('spieler').find({ username: req.body.username }).value();
        if(!db2.get('spieler').find({ username: req.body.username }).value()) {
            db2.get('spieler')
            .push({ username: req.body.username, anzeigename: spieler.anzeigename, version: 1, mannschaft: spieler.mannschaft})
            .write()
        } else {
            console.log("else");
            db2.find({ username: req.body.username })
            .assign({version: spieler2.version++})
            .write();
        }
        res.end("File is uploaded");
    });
});

app.listen(3000,'0.0.0.0', function () {
    console.log("Working on port 3000");
});