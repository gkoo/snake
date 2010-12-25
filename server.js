
/**
 * Module dependencies.
 */

var express = require('express');

var io = require('socket.io');

var app = module.exports = express.createServer();

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

dimSize = 10; // dimension size for game board

// Routes

app.get('/', function(req, res){
  res.render('index', {
    locals: {
      title: 'Snake',
      dimSize: dimSize
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
var Snake = function() {
  this.body = []; // array of coordinate objects
  this.id = -1;
  this.color = '#000'; // default black snake.
  this.addBodyPart = function(part) {
    this.body.push(part);
    worldGrid[part.x][part.y] = this.id;
  };
  this.move = function(x, y) {
    var oldtail = this.body.pop();
    var newhead = { x: x, y:y };
    this.body.unshift(newhead);

    worldGrid[oldtail.x][oldtail.y] = 0;
    worldGrid[newhead.x][newhead.y] = this.id;
    return { newhead: newhead, oldtail: oldtail };
  };
  // TODO: check that head and tail share either x or y axis. (right now, no checks)
  this.setBody = function(head, tail) {
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
  }
  this.destroy = function() {
    // Remove snake from world grid.
    for (var j=0; j<this.body.length; ++j) {
      var bodyPart = this.body[j];
      worldGrid[bodyPart.x][bodyPart.y] = 0;
    }
  }
}

var Player = function() {
  // default values
  this.clientId = -1;
  this.startingPos = null;
  this.snake = null;

  this.setSnake = function() {
    this.snake = new Snake();
    this.snake.id = this.clientId;
    if (this.color) {
      this.snake.color = this.color;
    }
    if (this.startingPos) {
      console.log('setting start position');
      this.snake.setBody(this.startingPos[0], this.startingPos[1]);
    }
    else {
      console.log('didn not set');
    }
  };

  this.getRandStartPos = function() {
    var found = false;
    while (true) {
      var randRow = Math.floor(Math.random()*dimSize);
      var randCol = Math.floor(Math.random()*(dimSize-2));
      for (var i=randCol; i<randCol+3; ++i) {
        console.log('Trying {' + randRow + ', ' + i + '}');
        if (!checkBounds(randRow, i)) { break; }
        if (worldGrid[randRow][i] != 0) {
          break;
        }
        // last iteration
        if (i == randCol + 2) {
          head = { x: randCol, y: randRow };
          mid = { x: randCol+1, y: randRow };
          tail = { x: randCol+2, y: randRow };
          this.startingPos = [ head, mid, tail];
          found = true;
        }
      }
      if (found) break;
    }
  }
}

var snakes = {},
    worldGrid = [],
    colors = ['#f00', '#0d0', '#00f', '#0dd'],
    /* Starting corner positions */
    upLtCornerPos = [ { x: 2, y: 0 }, { x: 0, y: 0 } ],
    upRtCornerPos = [ { x: dimSize-1, y: 0 }, { x: dimSize-1, y: 2 } ],
    downRtCornerPos = [ { x: dimSize-3, y: dimSize-1 }, { x: dimSize-1, y: dimSize-1 } ],
    downLtCornerPos = [ { x: 2, y: 0 }, { x: 0, y: 0 } ],
    startPosArr = [upLtCornerPos, downRtCornerPos, upRtCornerPos, downLtCornerPos],
    players = [];
    numPlayers = 4,

// Init players.
(function () {
  for (var i=0; i<numPlayers; ++i) {
    var player = new Player();
    player.color = colors[i];
    player.startingPos = startPosArr[i];
    players.push(player);
  }
})();

for (var i=0; i<dimSize; ++i) {
  worldGrid[i] = [];
  for (var j=0; j<dimSize; ++j) {
    worldGrid[i][j] = 0;
  }
}
var getNextPos = function(snake, dx, dy) {
  var newX = snake.body[0].x + dx;
  var newY = snake.body[0].y + dy;
  return { x: newX, y: newY };
};
var checkBounds = function(x, y) {
  var inbounds = (x >= 0 && x < dimSize) && (y >= 0 && y < dimSize);
  inbounds = inbounds && (worldGrid[x][y] == 0);
  return inbounds;
};
// FOR DEBUG PURPOSES
var printWorld = function() {
  var str;
  for (var i=0; i<dimSize; ++i) {
    str = '';
    for (var j=0; j<dimSize; ++j) {
      if (worldGrid[j][i] == 0) {
        str += '0';
      }
      else {
        str += '1';
      }
    }
    console.log(str);
  }
};
var getPlayerById = function(id) {
  for (var i=0; i<players.length; ++i) {
    if (players[i].clientId == id) {
      return players[i];
    }
  }
}

io.on('connection', function(client) {
  // Store a new snake specific to client's sessionId.
  var deleteSnake = function(id) {
    var player = getPlayerById(id);
    snake = player.snake;
    snake.destroy();
    player.id = -1;
    // Remove snake from snakes array.
    delete snakes[id];
    io.broadcast({ 'disconnect': id });
  };
  var i=0;
  for (; i<players.length; ++i) {
    if (players[i].clientId == -1) {
      players[i].clientId = client.sessionId;
      players[i].setSnake();
      break;
    }
  }
  snakes[client.sessionId] = players[i].snake;
  console.log(client.sessionId + '\'s snake entered the world. Diablo\'s minions grow stronger.');
  //printWorld();

  client.send({ snakes: snakes, sessionId: client.sessionId });
  client.broadcast({ newsnake: players[i].snake });

  client.on('message', function(message) {
    // Process move made on the client side and send back result.
    if (message.type == 'clientMove') {
      var mysnake = snakes[client.sessionId];
      var nextPos = getNextPos(mysnake, message.dx, message.dy);
      if (checkBounds(nextPos.x, nextPos.y)) {
        mysnake.move(nextPos.x, nextPos.y);
        messageObj = { type: 'serverMove', sessionId: client.sessionId, x: nextPos.x, y: nextPos.y };
        io.broadcast(messageObj);
        //console.log(client.sessionId + ' moved to {' + nextPos.x + ', ' + nextPos.y + '}');
        //printWorld();
      }
    }
  });

  client.on('disconnect', function(message) {
    deleteSnake(client.sessionId);
    console.log(client.sessionId + '\'s snake left the world. Diablo\'s minions grow weaker.');
  });

});
