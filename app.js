const express = require("express");
const fs = require('fs').promises;
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3001;
const http = require("http").Server(app);
const io = require("socket.io")(http);

const Room = require("./src/room");
var rooms = [];

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.render("./index.ejs");
});

app.get("/rooms/new", (req, res) => {
  res.render("./rooms/new/index.ejs");
});

app.get("/rooms/join", (req, res) => {
  res.render("./rooms/join/index.ejs");
});

app.get("/rooms/:id", (req,res) => {
  const room = rooms.find(room => room.id == req.params.id);
  res.render("./rooms/room.ejs", room);
});

app.post('/api/rooms/create',(req, res) =>  {
  const room = Room.create(
    req.body.roomName,
    parseInt(req.body.minuteMax),
    parseInt(req.body.pageNum),
    req.body.playerName
  );
  rooms.push(room);
  res.json({roomId: room.id, userId: room.players[0].id});
});

app.post('/api/rooms/join', (req,res) => {
  const roomId = req.body.roomId;
  const playerName = req.body.playerName;
  const room = rooms.find(room => room.id == roomId);
  const player = room.addPlayer(playerName);
  io.emit('roomStatusUpdation', {roomId: req.body.roomId});
  res.json({roomId: roomId, userId: player.id});
});

app.post('/api/books/create',(req,res) => {
  const userId = req.body.userId;
  const roomId = req.body.roomId;
  const title = req.body.title;
  const room = rooms.find(room => room.id == roomId);
  room.addBook(title);
  if(room.allTitleSubmitted()) {
    room.startWriting();
    io.emit('roomStatusUpdation', {roomId: req.body.roomId});
  }
  res.json();
})

app.post('/api/rooms/start',(req, res) => {
  const room = rooms.find(room => room.id == req.body.roomId);
  room.startTitling();
  io.emit('roomStatusUpdation', {roomId: req.body.roomId});
  res.json();
});

http.listen(port, () => console.log(`Example app listening on port ${port}!`));