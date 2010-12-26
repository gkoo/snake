
/**
 * Module dependencies.
 */

var express = require('express');

var io = require('socket.io');

var app = module.exports = express.createServer();

var clientlogic = require('./public/javascripts/snake.js');

var boardlogic = require('./public/javascripts/board.js');

var playerlogic = require('./player.js');

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyDecoder());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// CONSTANTS
DIMSIZE     = 10, // dimension size for game board
SNAKESIZE   = 3,
NUMPLAYERS  = 4,
COLORS      = ['#f00', '#030', '#00f', '#0dd'];

// Routes

app.get('/', function(req, res){
  res.render('index', {
    locals: {
      title: 'Snake',
      dimSize: DIMSIZE
    }
  });
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(8080);
  console.log("Express server listening on port %d", app.address().port)
}

var io = io.listen(app);








// ----------
// GAME LOGIC
// ----------

/* @head: head coordinates*/
/* @tail: tail coordinates*/
var snakes = {},
    /* Starting corner positions */
    upLtCornerPos = [ { x: SNAKESIZE-1, y: 0 }, { x: 0, y: 0 } ],
    upRtCornerPos = [ { x: DIMSIZE-1, y: SNAKESIZE-1 }, { x: DIMSIZE-1, y: 0 } ],
    downRtCornerPos = [ { x: DIMSIZE-SNAKESIZE, y: DIMSIZE-1 }, { x: DIMSIZE-1, y: DIMSIZE-1 } ],
    downLtCornerPos = [ { x: 0, y: DIMSIZE-SNAKESIZE }, { x: 0, y: DIMSIZE-1 } ],
    startPosArr = [upLtCornerPos, downRtCornerPos, upRtCornerPos, downLtCornerPos],
    players = [],
    myBoard = null;



// Add some functions to Snake object
Snake.prototype.addBodyPart = function(part) {
  this.body.push(part);
  myBoard.setSnakeCell(part.x, part.y);
};

// TODO: check that head and tail share either x or y axis. (right now, no checks)
Snake.prototype.setBody = function(head, tail) {
  var delta = 1; // direction in which we proceed from head to tail.
  this.addBodyPart(head);

  // Same x, fill in with y values
  if (head.x == tail.x) {
    if (head.y > tail.y) {
      delta = -1;
    }
    for (var i=head.y+delta; i != tail.y; i+= delta) {
      this.addBodyPart({ x: head.x, y: i });
    }
  }
  // Same y, fill in with x values
  else if (head.y == tail.y) {
    if (head.x > tail.x) {
      delta = -1;
    }
    for (var i=head.x+delta; i != tail.x; i+= delta) {
      this.addBodyPart({ x: i, y: head.y });
    }
  }
  this.addBodyPart(tail);
};

Snake.prototype.destroy = function() {
  // Remove snake from world grid.
  for (var j=0; j<this.body.length; ++j) {
    var bodyPart = this.body[j];
    myBoard.setEmptyCell(bodyPart.x, bodyPart.y);
  }
};


// Init players and world.
for (var i=0; i<NUMPLAYERS; ++i) {
  var player = new Player();
  player.color = COLORS[i];
  player.startingPos = startPosArr[i];
  players.push(player);
}

myBoard = new Board(DIMSIZE);

var getNextPos = function(snake, dx, dy) {
  var newX = snake.body[0].x + dx;
  var newY = snake.body[0].y + dy;
  return { x: newX, y: newY };
};


// Function: checkBounds
// ---------------------
// Returns true if the given coordinates are within bounds and unoccupied
// on the board.
var checkBounds = function(x, y) {
  var inbounds = (x >= 0 && x < DIMSIZE) && (y >= 0 && y < DIMSIZE);
  inbounds = inbounds && (myBoard.getCell(x, y) == myBoard.CELL_EMPTY);
  //printWorld();
  return inbounds;
};


var printPlayerIds = function() {
  for (var i=0; i<NUMPLAYERS; ++i) {
    console.log(players[i].clientId);
  }
};





// SOCKET.IO STUFF
// ---------------

io.on('connection', function(client) {
  var deletePlayer = function(id) {
    var player = null;
    for (var i=0; i<players.length; ++i) {
      if (players[i].clientId == id) {
        player = players[i];
        break;
      }
    }
    var snake = player.snake;
    snake.destroy();
    player.clientId = -1;
    // Remove snake from snakes array.
    delete snakes[id];
    io.broadcast({ 'disconnect': id });
  };

  var i=0;

  // Check for an open slot.
  for (; i<players.length; ++i) {
    if (players[i].clientId == -1) {
      var player = players[i];
      player.clientId = client.sessionId;
      player.setSnake();
      console.log('Spot ' + i + ' was open!');
      printPlayerIds();
      break;
    }
    if (i == players.length-1) {
      // should not get here.
      console.log('Nothing was open!');
      printPlayerIds();
    }
  }
  if (i < players.length) {
    snakes[client.sessionId] = players[i].snake;
    console.log(client.sessionId + '\'s snake entered the world. Diablo\'s minions grow stronger.');

    client.send({ snakes: snakes, sessionId: client.sessionId });
    client.broadcast({ newsnake: players[i].snake });
  }
  else {
    client.send({ snakes: snakes });
  }

  client.on('message', function(message) {
    // Process move made on the client side and send back result.
    switch (message.type) {
      case 'clientMove':
        var mysnake = snakes[client.sessionId];
        var nextPos = getNextPos(mysnake, message.dx, message.dy);
        if (checkBounds(nextPos.x, nextPos.y)) {
          var changedCoords = mysnake.move(nextPos.x, nextPos.y),
              oldtail = changedCoords.oldtail,
              newhead = changedCoords.newhead;
          myBoard.setEmptyCell(oldtail.x, oldtail.y);
          myBoard.setSnakeCell(newhead.x, newhead.y);

          messageObj = { type: 'serverMove', sessionId: client.sessionId, x: nextPos.x, y: nextPos.y };
          io.broadcast(messageObj);
          //console.log(client.sessionId + ' moved to {' + nextPos.x + ', ' + nextPos.y + '}');
          //printWorld();
        }
        break;
      case 'apple':
        var appleCoord = myBoard.setAppleCell(true);
        io.broadcast({ apple: appleCoord });
        console.log('broadcasted coordinates: ' + appleCoord.x + ', ' + appleCoord.y);
        break;
      default:
        // do error handling?
    }
  });

  client.on('disconnect', function(message) {
    deletePlayer(client.sessionId);
    console.log(client.sessionId + '\'s snake left the world. Diablo\'s minions grow weaker.');
  });
});
