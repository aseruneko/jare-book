const express = require("express");
const fs = require('fs').promises;
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3001;
const http = require("http").Server(app);
const io = require("socket.io")(http);

const Room = require("./src/room");
const { write } = require("fs");
var rooms = [];

const VERSION = "1.1.1";

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get("/", (req, res) => {
  res.render("./index.ejs", {version: VERSION});
});

app.get("/rooms/new", (req, res) => {
  res.render("./rooms/new/index.ejs", {version: VERSION});
});

app.get("/rooms/join", (req, res) => {
  res.render("./rooms/join/index.ejs", {version: VERSION});
});

app.get("/rooms/:id", (req,res) => {
  const room = rooms.find(room => room.id == req.params.id);
  res.render("./rooms/room.ejs", {...room, version: VERSION});
});

app.post('/api/rooms/create',(req, res) =>  {
  var writeOrderStyle = "ORDERED";
  if(req.body.writeOrderRandom)  {
    writeOrderStyle = "RANDOM"
  }
  const room = Room.create(
    req.body.roomName,
    parseInt(req.body.minuteMax),
    parseInt(req.body.pageNum),
    req.body.playerName,
    writeOrderStyle,
  );
  const now = new Date();
  rooms = rooms.filter(room => now.getTime() - room.createdAt.getTime() < 1000*60*60*24);
  rooms.push(room);
  res.json({roomId: room.id, userId: room.players[0].id});
});

app.post('/api/rooms/join', (req,res) => {
  const roomId = req.body.roomId;
  const playerName = req.body.playerName;
  const room = rooms.find(room => room.id == roomId);
  const player = room.addPlayer(playerName);
  io.emit('roomStatusUpdation', {roomId: req.body.roomId, status: room.status});
  res.json({roomId: roomId, userId: player.id});
});

app.post('/api/books/create',(req,res) => {
  const userId = req.body.userId;
  const roomId = req.body.roomId;
  const title = req.body.title;
  const room = rooms.find(room => room.id == roomId);
  room.addBook(userId, title);
  io.emit('userStatusUpdation', {roomId: req.body.roomId, userId: userId});
  if(room.allTitleSubmitted()) {
    room.startWriting();
    io.emit('roomStatusUpdation', {roomId: req.body.roomId, status: room.status});
  }
  res.json();
})

app.post('/api/rooms/start',(req, res) => {
  const room = rooms.find(room => room.id == req.body.roomId);
  room.startTitling();
  io.emit('roomStatusUpdation', {roomId: req.body.roomId, status: room.status});
  res.json();
});

app.post('/api/book/edit', (req, res) => {
  const userId = req.body.userId;
  const roomId = req.body.roomId;
  const page = req.body.page;
  const room = rooms.find(room => room.id == roomId);
  room.write(userId, page);
  io.emit('userStatusUpdation', {roomId: req.body.roomId, userId: userId});
  if(room.allPageSubmitted()) {
    room.nextPage();
    if (room.editPageNum == room.pageNum) {
      room.finishWriting();
    }
    io.emit('roomStatusUpdation', {roomId: req.body.roomId, status: room.status});
  }
  res.json();
})

app.get('/api/rooms/:roomId/users/:userId', (req,res) => {
  const room = rooms.find(room => room.id == req.params.roomId);
  const userId = req.params.userId;
  const book = room.pickBook(userId);
  if(book.editPageNum == 0) {
    res.json({title: book.title, minuteMax: room.minuteMax, previousPage: []});
  } else {
    const page = room.pickPreviousPage(userId);
    res.json({title: book.title, minuteMax: room.minuteMax, previousPage: [page]});
  }
});

app.get('/api/rooms/:roomId/users/:userId/is-host', (req, res) => {
  const room = rooms.find(room => room.id == req.params.roomId);
  const userId = req.params.userId;
  res.json({isHost: room.players[0].id == userId});
});

http.listen(port, () => console.log(`Example app listening on port ${port}!`));