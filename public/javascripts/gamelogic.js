var Board = function() {
  /* Private vars */
  //var myPerson = new Person(),
  var that = this,
      worldElem = $('#world');
      worldGrid = [],
      codeW = 87,
      codeA = 65,
      codeS = 83,
      codeD = 68,
      codeUp = 38,
      codeLeft = 37,
      codeRight = 39,
      codeDown = 40,
      codeSpace = 32,
      snakes = {};

  /* Public vars and methods */
  this.width = this.height = worldElem.children('li').length;
  this.getGrid = function() { return worldGrid; };
  this.redraw = function(rows) {
    // Assume empty board when this function is called.
    for (var id in snakes) {
      var body = snakes[id].body;
      for (var j=0; j<body.length; ++j) {
        var bodyPart = body[j];
        var coord = this.getWorldCell(bodyPart.x, bodyPart.y);
        toggleCell(coord, true, snakes[id].color);
      }
    }
  }
  this.redrawCoord = function(x, y, color) {
    var cell = this.getWorldCell(x, y);
    if (worldGrid[x][y] == 0) {
      toggleCell(cell, false);
    }
    else {
      toggleCell(cell, true, color);
    }
  };
  this.getWorldCell = function(x, y) {
    // get row
    var y = y+1, x = x+1; // nth-child works on 1-based values;
    var row = worldElem.children('li:nth-child(' + y + ')');
    var col = row.find('li:nth-child(' + x + ')');
    return col;
  }
  this.addSnake = function(snake) {
    snakes[snake.id] = snake;
  }
  this.redrawSnakeById = function(id) {
    var snake = this.getSnakeById(id);
    for (var i=0; i<snake.body.length; ++i) {
      var cell = myBoard.getWorldCell(snake.body[i].x, snake.body[i].y);
      toggleCell(cell, true, snake.color);
    }
  }
  this.getSnakeById = function(id) {
    return snakes[id];
  }
  this.removeSnakeById = function(id) {
    var snake = snakes[id];
    for (var i=0; i<snake.body.length; ++i) {
      var bodyPart = snake.body[i];
      worldGrid[bodyPart.x][bodyPart.y] = 0;
      var cell = this.getWorldCell(bodyPart.x, bodyPart.y);
      toggleCell(cell, false);
    }
    delete snake;
  }

  for (var i=0; i<this.width; ++i) {
    worldGrid[i] = [];
    for (var j=0; j<this.height; ++j) {
      worldGrid[i][j] = 0;
    }
  }

  // Capture keyboard input.
  $(window).keydown(function(e) {
    var dx = 0;
    var dy = 0;
    switch(e.keyCode) {
      case codeW:
      case codeUp:
      case codeSpace:
        dy = -1;
        
        break;
      case codeA:
      case codeLeft:
        dx = -1;
        break;
      case codeS:
      case codeDown:
        dy = 1;
        break;
      case codeD:
      case codeRight:
        dx = 1;
        break;
      default:
        return;
    }
    messageObj = { type: 'clientMove', dx: dx, dy: dy };
    socket.send(messageObj);
    /*
    if (checkBounds(nextPos.x, nextPos.y)) {
      var updateCoords = that.mysnake.move(dx,dy);

      var oldtail = updateCoords.oldtail;
      var newhead = updateCoords.newhead;

      worldGrid[oldtail.x][oldtail.y] = 0;
      worldGrid[newhead.x][newhead.y] = that.mysnake.id;

      redrawCoord(oldtail.x, oldtail.y);
      redrawCoord(newhead.x, newhead.y);
    }
    */
    e.stopPropagation();
    return false;
  });

  var checkBounds = function(x, y) {
    var inbounds = (x >= 0 && x < that.width) && (y >= 0 && y < that.height);
    inbounds = inbounds && (worldGrid[x][y] == 0);
    return inbounds;
  }
  var toggleCell = function(cell, state, color) {
    if (state) {
      cell.css('background-color', color);
    }
    else {
      cell.css('background-color', '#fff');
    }
  }
};

var Snake = function(/*optional*/snake) {
  this.body = [];
  if (!snake) return;
  this.body = snake.body;
  this.id = snake.id;
  this.color = snake.color;

  /*
   * Function: move
   * --------------
   * 1) Add new body part adjacent to head.
   * 2) Remove tail body part.
   */
  this.move = function(x, y) {
    var oldtail = this.body.pop();
    var newhead = { x: x, y:y };
    this.body.unshift(newhead);
    return { newhead: newhead, oldtail: oldtail };
  };

};


var myBoard = new Board();
var colors = ['#f00', '#00f', '#0f0', '#0ff'];



// SOCKET.IO STUFF
// ---------------

var socket = new io.Socket(null, {port: 8080, rememberTransport: false});

socket.connect();

// Receive message
socket.on('message', function(obj){
  // Initialize board.
  if ('snakes' in obj){
    var mySessionId = 0;
    if ('sessionId' in obj) {
      mySessionId = obj.sessionId;
    }
    for (var id in obj.snakes) {
      snake = obj.snakes[id]
      myBoard.addSnake(new Snake(snake));

      // Set "my" snake.
      if (snake.id == mySessionId) {
        myBoard.mysnake = new Snake(obj.snakes[id]);
      }
    }
    myBoard.redraw();
  }
  else if ('newsnake' in obj) {
    // a new snake entered the board
    myBoard.addSnake(new Snake(obj.newsnake));
    // use server snake obj to get client snake obj and redraw
    myBoard.redrawSnakeById(obj.newsnake.id);
  }
  else if ('type' in obj && obj.type == 'serverMove') {
    var snake = myBoard.getSnakeById(obj.sessionId);
    var updateCoords = snake.move(obj.x, obj.y);

    var oldtail = updateCoords.oldtail;
    var newhead = updateCoords.newhead;

    worldGrid[oldtail.x][oldtail.y] = 0;
    worldGrid[newhead.x][newhead.y] = obj.sessionId;

    myBoard.redrawCoord(oldtail.x, oldtail.y, snake.color);
    myBoard.redrawCoord(newhead.x, newhead.y, snake.color);
  }
  else if ('disconnect' in obj) {
    // remove snake from board.
    id = obj.disconnect;
    myBoard.removeSnakeById(id);
  }
});
