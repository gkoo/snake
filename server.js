
/**
 * Module dependencies.
 */

var express = require('express');

var io = require('socket.io');

var app = module.exports = express.createServer();

var snakelogic = require('./public/javascripts/snake.js');

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
var DIMSIZE     = 10, // dimension size for game board
    SNAKESIZE   = 3,
    NUMPLAYERS  = 4,
    SPEED       = 1000, // bigger is slower.
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
    apple = null,
    appleCountdown,
    /* Starting corner positions */
    upLtCornerPos = [ { x: SNAKESIZE-1, y: 0 }, { x: 0, y: 0 } ],
    upRtCornerPos = [ { x: DIMSIZE-1, y: SNAKESIZE-1 }, { x: DIMSIZE-1, y: 0 } ],
    downRtCornerPos = [ { x: DIMSIZE-SNAKESIZE, y: DIMSIZE-1 }, { x: DIMSIZE-1, y: DIMSIZE-1 } ],
    downLtCornerPos = [ { x: 0, y: DIMSIZE-SNAKESIZE }, { x: 0, y: DIMSIZE-1 } ],
    startPosArr = [upLtCornerPos, downRtCornerPos, upRtCornerPos, downLtCornerPos],
    players = [],
    autoMode = true,
    myBoard = null,
    moveInterval = null,
    gameover    = false;



/* -----------------------
 * EXTEND THE SNAKE OBJECT
 * -----------------------
 */

snakelogic.Snake.prototype.id = -1; // add id here so that client doesn't see it.

snakelogic.Snake.prototype.addBodyPart = function(part) {
  this.body.push(part);
  myBoard.setSnakeCell(part.x, part.y);
};

// TODO: check that head and tail share either x or y axis. (right now, no checks)
snakelogic.Snake.prototype.setBody = function(head, tail) {
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

snakelogic.Snake.prototype.destroy = function() {
  // Remove snake from world grid.
  for (var j=0; j<this.body.length; ++j) {
    var bodyPart = this.body[j];
    myBoard.setEmptyCell(bodyPart.x, bodyPart.y);
  }
};


// Init players and world.
for (var i=0; i<NUMPLAYERS; ++i) {
  var player = new playerlogic.Player(i),
      dx     = 0;
      dy     = 0;

  player.color = COLORS[i];
  player.startingPos = startPosArr[i];
  switch(i) {
    case 0:
      dx = 1;
      break;
    case 1:
      dx = -1;
      break;
    case 2:
      dy = 1;
      break;
    case 3:
      dy = -1;
      break;
  }
  player.startingDx = dx;
  player.startingDy = dy;
  players.push(player);
}

myBoard = new boardlogic.Board(DIMSIZE);

var moveSnake = function(snake) {
  var nextPos = myBoard.getNextPos(snake);
  if (myBoard.checkBounds(nextPos.x, nextPos.y)) {
    // Check if we got an apple
    var nextCellContents = myBoard.getCell(nextPos.x, nextPos.y),
        grow             = nextCellContents === myBoard.CELL_APPLE,
        changedCoords    = snake.move(nextPos.x, nextPos.y, grow),
        oldtail          = changedCoords.oldtail,
        newhead          = changedCoords.newhead;

    // Want to remove the tail.
    if (oldtail) {
      myBoard.setEmptyCell(oldtail.x, oldtail.y);
    }
    // reset apple.
    else {
      apple = null;
      // wait 2-5 seconds for next apple.
      appleCountdown = Math.floor(Math.random(4))+2;
    }
    myBoard.setSnakeCell(newhead.x, newhead.y);

    return {
      type: 'serverMove',
      playerId: snake.playerId,
      x: nextPos.x,
      y: nextPos.y,
      grow: grow
    };

    //console.log(client.sessionId + ' moved to {' + nextPos.x + ', ' + nextPos.y + '}');
    //myBoard.printWorld();
  }
  else {
    return null;
  }
}

// DEBUG STUFF
var printPlayerIds = function() {
  for (var i=0; i<NUMPLAYERS; ++i) {
    console.log(players[i].clientId);
  }
};
var printSnakes = function() {
  for (var id in snakes) {
    console.log('snake id ' + id);
    var body = snakes[id].body;
    for (var i = 0; i<body.length; ++i) {
      console.log('Snake id ' + id + ': ' + body[i].x + ', ' + body[i].y);
    }
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
    delete myBoard.snakes[id];
    io.broadcast({ 'disconnect': player.playerId });
  };

  var i=0;

  // Check for an open slot.
  for (; i<players.length; ++i) {
    if (players[i].clientId == -1) {
      var player = players[i],
          snake = new snakelogic.Snake();
      myBoard.snakes[client.sessionId] = snake;
      player.clientId = client.sessionId;
      player.initSnake(snake); // give snake startingPos and color.
      console.log('Spot ' + i + ' was open!');
      break;
    }
    if (i == players.length-1) {
      // should not get here.
      console.log('Nothing was open!');
      printPlayerIds();
    }
  }
  if (i < players.length) {
    // We found an open spot.
    var snakeArr = [];

    console.log(client.sessionId + '\'s snake entered the world. Diablo\'s minions grow stronger.');

    // Construct snakes array to pass to client. We don't send the
    // snakes object we have because it uses client session id's as
    // keys, which a malicious user could use to spoof moves.
    for (var id in myBoard.snakes) {
      // Always put client's snake at beginning of array so it
      // can be identified.
      if (id == client.sessionId) {
        snakeArr.unshift(myBoard.snakes[id]);
      }
      else {
        snakeArr.push(myBoard.snakes[id]);
      }
    }

    client.send({ snakes: snakeArr, apple: apple, sessionId: client.sessionId });
    client.broadcast({ newsnake: players[i].snake });
  }
  else {
    client.send({ snakes: snakeArr, apple: apple });
  }

  client.on('message', function(message) {

    if (gameover) { return; } // add some kind of Restart Game call.

    switch (message.type) {
      // Process move made on the client side and send back result.
      case 'clientMove':
        var mysnake   = myBoard.snakes[client.sessionId],
            dx        = message.dx,
            dy        = message.dy;

        if (autoMode) {
          if (mysnake.dx == dx * (-1) || mysnake.dy == dy * (-1)) {
            return;
          }
          mysnake.dx = dx;
          mysnake.dy = dy;
        }
        else {
          // Manual mode.
          var msgObj = null;
          mysnake.dx = dx;
          mysnake.dy = dy;

          msgObj = moveSnake(mysnake);
          if (!msgObj) {
            msgObj = handleDeath(mysnake.playerId);
          }
          io.broadcast(msgObj);
        }
        break;
      case 'apple':
        apple = myBoard.setAppleCell(true);
        io.broadcast({ apple: apple });
        console.log('broadcasted coordinates: ' + apple.x + ', ' + apple.y);
        break;
      case 'start':
        moveInterval = setInterval(function() {
          var snakeMoves = [];

          // send all snake moves in one message.
          for (var id in myBoard.snakes) {
            var snake  = myBoard.snakes[id],
                msgObj = moveSnake(snake);

            if (!msgObj) {
              msgObj = handleDeath(snake.playerId);
              io.broadcast(msgObj);
            }
            else {
              snakeMoves.push(msgObj);
            }

          }
          if (appleCountdown > 0) {
            --appleCountdown;
          }
          io.broadcast({ type: 'allMove', moves: snakeMoves });
          //console.log('move');
        }, SPEED);
        break;
      case 'stop':
        clearInterval(moveInterval);
        break;
      default:
        // do error handling?
    }
  });

  client.on('disconnect', function(message) {
    deletePlayer(client.sessionId);
    console.log(client.sessionId + '\'s snake left the world. Diablo\'s minions grow weaker.');
  });

  var handleDeath = function(playerId) {
    var gameover = myBoard.kill(playerId),
        msgObj   = null;

    if (gameover) {
      gameover = true;
      clearInterval(moveInterval);
      msgObj = { type: 'gameover' };
    }
    else {
      msgObj = { type: 'death', playerId: playerId };
    }

    return msgObj;
  };
});
