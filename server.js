var express = require("express");
var multer = require('multer');
var app = express();
const crypto = require('crypto');
var path = require('path');
const low = require('lowdb');
var fs = require('fs');
const FileSync = require('lowdb/adapters/FileSync');
var cors = require('cors');
app.use(express.json())
app.use(cors());

var mustacheExpress = require('mustache-express');

const adapter = new FileSync('db.json')
const db = low(adapter)
const adapter2 = new FileSync('db2.json')
const db2 = low(adapter2)

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
        if (file.mimetype !== 'audio/mpeg') {
            return cb(new Error('Falsches Format'));
        }
        cb(null, true);
    }
}).single('mp3');


app.use(express.static('public'));
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

    app.set('view engine', 'html');

app.get('/', function (req, res) {
   // res.sendFile(__dirname + "/index.html");
   db2.read();
   res.render('index.html', {"spieler": db2.get('spieler').value()});
});

app.get('/delete/:username', function (req, res) {
    db2.read();
    db2.get('spieler').remove({username: req.params.username}).write();
    var mp3path = path.join(__dirname, 'public', 'uploads', req.params.username +'.mp3');

    try {
        if (fs.existsSync(mp3path)) {
            fs.unlink(mp3path, function (err) {
                if (err) throw err;
                res.redirect("/sound/all/");
            });
        } else {
            res.redirect("/sound/all/");
        }
      } catch(err) {
        console.error(err)
      }

 });


  app.get('/info', function (req, res) {
      res.json(db2.get('spieler').sortBy('anzeigename').value().filter(function(element) {
        return element.version > 0;
        }));
});

app.get('/all', function (req, res) {
    res.render('all.html', {"spieler": db2.get('spieler').value()});
});

app.get('/edit/:username', function (req, res) {
    res.render('edit.html', {"spieler": db2.get('spieler').find({ username: req.params.username }).value()});
});

app.post('/upload', function (req, res) {
    db2.read();
   
    upload(req, res, function (err) {
        if (err) return res.status(500).send(err.message);
        if (!req.file) return res.status(500).send("Bitte wähle eine MP3 aus!");
        var spieler = db2.get('spieler').find({ username: req.body.username }).value();
        var mannschaft;
        if(spieler.herren == true) {
            mannschaft = "herren"
            } else {
            mannschaft = "damen"
        }
        var spieler2 = db2.get('spieler').find({ username: req.body.username }).value();
        if(db2.get('spieler').find({ username: req.body.username }).value()) {
            db2.find({ username: req.body.username })
            .assign({version: spieler2.version++})
            .write();
        } else {
            return res.status(500).send("Spieler wurde nicht gefunden!");
        }
        res.end("File is uploaded");
    });
});

app.listen(3005,'0.0.0.0', function () {
    console.log("Working on port 3005");
});
