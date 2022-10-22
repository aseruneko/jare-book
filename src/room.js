const crypto = require("crypto");

class Player {
    constructor(
        id,
        name,
        memberNo
    ) {
        this.name = name;
        this.memberNo = memberNo;
        this.id = id;
    }
    static create(
        name,
        memberNo
    ) {
        return new Player(
            crypto.randomUUID(),
            name,
            memberNo
        )
    }
}

class Book {
    constructor(id, title, chapters) {
        this.id = id;
        this.title = title;
        this.chapters = chapters;
    }
    static create(
        title
    ) {
        return new Book(
            crypto.randomUUID(),
            title,
            []
        )
    }
}

const RoomStatus = {
    Waiting: 'WAITING', 
    Titling: 'TITLING',
    Writing: 'WRITING',
};

class Room {
    constructor(
        id,
        roomName,
        hostName,
        minuteMax,
        pageNum,
        status,
        players,
        books
    ) {
        this.id = id;
        this.roomName = roomName;
        this.hostName = hostName;
        this.minuteMax = minuteMax;
        this.pageNum = pageNum;
        this.status = status;
        this.players = players;
        this.books = books;
    }
    startTitling() {
        this.status = RoomStatus.Titling;
    }
    startWriting() {
        this.status = RoomStatus.Writing;
    }
    addBook(title) {
        this.books.push(Book.create(title));
    }
    addPlayer(playerName) {
        const player = Player.create(playerName, this.players.length);
        this.players.push(player);
        return player;
    }
    allTitleSubmitted() {
        return this.players.length == this.books.length;
    }
    static create(
        roomName,
        minuteMax,
        pageNum,
        hostPlayerName
    ) {
        const id = crypto.randomUUID();
        const hostPlayer = Player.create(hostPlayerName, 0);
        const room = new Room(
            id,
            roomName,
            hostPlayerName,
            minuteMax,
            pageNum,
            RoomStatus.Waiting,
            [hostPlayer],
            []
        )
        return room;
    }
}

module.exports = Room;