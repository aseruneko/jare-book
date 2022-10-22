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
    constructor(authorId, bookId, title, pages) {
        this.authorId = authorId;
        this.bookId = bookId;
        this.title = title;
        this.pages = pages;
    }
    write(num, page) {
        if(this.pages.length - 1 >= num) {
            this.pages[num] = page;
        } else {
            this.pages.push(page);
        }
    }
    static create(
        authorId,
        title
    ) {
        return new Book(
            authorId,
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
    Reading: 'READING',
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
        books,
        editPageNum,
    ) {
        this.id = id;
        this.roomName = roomName;
        this.hostName = hostName;
        this.minuteMax = minuteMax;
        this.pageNum = pageNum;
        this.status = status;
        this.players = players;
        this.books = books;
        this.editPageNum = editPageNum;
    }
    startTitling() {
        this.status = RoomStatus.Titling;
    }
    startWriting() {
        this.editPageNum = 0;
        this.status = RoomStatus.Writing;
    }
    nextPage() {
        this.editPageNum = this.editPageNum + 1;
    }
    finishWriting() {
        this.status = RoomStatus.Reading;
    }
    write(userId, page) {
        const book = this.pickBook(userId);
        book.write(this.editPageNum, page);
    }
    addBook(authorId, title) {
        this.books.push(Book.create(authorId, title));
    }
    addPlayer(playerName) {
        const player = Player.create(playerName, this.players.length);
        this.players.push(player);
        return player;
    }
    pickBook(userId) {
        const player = this.players.find(player => player.id == userId);
        const playerNo = player.memberNo;
        var authorNo = player.memberNo - 1 - this.editPageNum;
        while (authorNo < 0) {
            authorNo = authorNo + this.players.length;
        }
        const author = this.players.find(player => player.memberNo == authorNo);
        return this.books.find(book => book.authorId == author.id);
    }
    pickPreviousPage(userId) {
        if(this.editPageNum == 0) {
            return undefined;
        }
        const book = this.pickBook(userId);
        return book.pages[this.editPageNum - 1];
    }
    allTitleSubmitted() {
        return this.players.length == this.books.length;
    }
    allPageSubmitted() {
        return this.books.every(book => 
            book.pages.length - 1 == this.editPageNum
        );
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
            [],
            -1
        )
        return room;
    }
}

module.exports = Room;