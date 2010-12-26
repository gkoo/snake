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
      snakes = {},
      apple = null;

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
  };
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
  };
  this.addSnake = function(snake) {
    snakes[snake.id] = snake;
  };
  this.redrawSnakeById = function(id) {
    var snake = this.getSnakeById(id);
    for (var i=0; i<snake.body.length; ++i) {
      var cell = myBoard.getWorldCell(snake.body[i].x, snake.body[i].y);
      toggleCell(cell, true, snake.color);
    }
  };
  this.getSnakeById = function(id) {
    return snakes[id];
  };
  this.removeSnakeById = function(id) {
    var snake = snakes[id];
    for (var i=0; i<snake.body.length; ++i) {
      var bodyPart = snake.body[i];
      worldGrid[bodyPart.x][bodyPart.y] = 0;
      var cell = this.getWorldCell(bodyPart.x, bodyPart.y);
      toggleCell(cell, false);
    }
    delete snake;
  };
  /*
   * Function: getRandomCoord
   * ------------------------
   * Gets a random, unoccupied coordinate on the board.
   */
  this.getRandomCoord = function() {
    while (true) {
      var randRow = Math.floor(Math.random()*DIMSIZE);
      var randCol = Math.floor(Math.random()*DIMSIZE);
      if (worldGrid[randRow][randCol] == 0) {
        return { x: randRow, y: randCol };
      }
    }
  };
  this.addApple = function() {
    var randCoord = getRandomCoord();
  };

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
