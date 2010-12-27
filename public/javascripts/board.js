var Board = function(dimsize) {
  /* Private vars */

  this.CELL_EMPTY = 0;
  this.CELL_SNAKE = 1;
  this.CELL_APPLE = 2;
  var that        = this,
      worldGrid   = [],
      appleColor  = '#0d0';
      codeW       = 87,
      codeA       = 65,
      codeS       = 83,
      codeD       = 68,
      codeUp      = 38,
      codeLeft    = 37,
      codeRight   = 39,
      codeDown    = 40,
      codeSpace   = 32,
      apple       = null;

  this.snakes     = {};

  /* Public vars and methods */
  this.getGrid = function() { return worldGrid; };

  this.redraw = function(rows) {
    // Assume empty board when this function is called.
    for (var id in this.snakes) {
      var body = this.snakes[id].body;
      for (var j=0; j<body.length; ++j) {
        var bodyPart = body[j];
        var coord = this.getCellElem(bodyPart.x, bodyPart.y);
        toggleCell(coord, true, this.snakes[id].color);
      }
    }
  };

  this.redrawCoord = function(x, y, color) {
    var cell = this.getCellElem(x, y);
    if (worldGrid[x][y] == 0) {
      toggleCell(cell, false);
    }
    else {
      toggleCell(cell, true, color);
    }
  };

  this.addSnake = function(snake) {
    this.snakes[snake.playerId] = snake;
  };

  this.redrawSnakeByPlayerId = function(playerId) {
    var snake = this.getSnakeByPlayerId(playerId);
    for (var i=0; i<snake.body.length; ++i) {
      var cell = this.getCellElem(snake.body[i].x, snake.body[i].y);
      toggleCell(cell, true, snake.color);
    }
  };

  this.getSnakeByPlayerId = function(playerId) {
    for (var id in this.snakes) {
      if (this.snakes[id].playerId == playerId) {
        return this.snakes[id];
      }
    }
    // should not get here.
  };

  this.removeSnakeByPlayerId = function(playerId) {
    var snake = this.snakes[playerId];
    for (var i=0; i<snake.body.length; ++i) {
      var bodyPart = snake.body[i];
      worldGrid[bodyPart.x][bodyPart.y] = 0;
      var cell = this.getCellElem(bodyPart.x, bodyPart.y);
      toggleCell(cell, false);
    }
    delete snake;
  };

  this.addApple = function(x, y) {
    this.setAppleCell(false, x, y);
    this.redrawCoord(x, y, appleColor);
  };

  this.kill = function(playerId) {
    var snake     = this.getSnakeByPlayerId(playerId),
        clientId  = -1;

    for (var id in this.snakes) {
      if (this.snakes[id].playerId == playerId) {
        snake = this.snakes[id];
        clientId = id;
      }
    }

    if (typeof(this.showRip) !== 'undefined') {
      this.showRip(playerId);
    }

    // Decomission player's snake.
    if (snake.playerId == playerId) {

      var body        = snake.body,
          gameover    = false;

      snake.dead = true;

      // Erase snake.
      if (typeof(this.getCellElem) !== 'undefined') {
        for (var i=0; i<body.length; ++i) {
          var cell = this.getCellElem(body[i].x, body[i].y);
          toggleCell(cell, false);
        }
      }

      delete this.snakes[clientId];

      // Ugly way of counting snakes.
      var count = 0;
      for (var id in this.snakes) {
        ++count;
      }
      // No snakes left?
      if (!count) {
        if (typeof(alert) !== 'undefined') {
          alert('game over!');
        }
        gameover = true;
      }
    }
    return gameover;
  };

  this.setSnakeCell = function (x, y) {
    worldGrid[x][y] = this.CELL_SNAKE;
  };

  this.setEmptyCell = function (x, y) {
    worldGrid[x][y] = this.CELL_EMPTY;
  };

  this.setAppleCell = function (random, x, y) {
    if (random) {
      var randomCoord = this.getRandomCoord();
      x = randomCoord.x;
      y = randomCoord.y;
    }
    worldGrid[x][y] = this.CELL_APPLE;
    return randomCoord;
  };

  // TODO: delete this function and all traces
  this.getCell = function (x, y) {
    return worldGrid[x][y];
  };

  this.checkBounds = function(x, y) {
    var inbounds = (x >= 0 && x < dimsize) && (y >= 0 && y < dimsize);
    inbounds = inbounds && (worldGrid[x][y] != this.CELL_SNAKE);
    return inbounds;
  };

  this.getNextPos = function(snake) {
    var newX = snake.body[0].x + snake.dx;
    var newY = snake.body[0].y + snake.dy;
    return { x: newX, y: newY };
  };

  // FOR DEBUG PURPOSES
  this.printWorld = function() {
    var str = '';
    for (var i=0; i<dimsize; ++i) {
      str = '';
      for (var j=0; j<dimsize; ++j) {
        str += this.getCell(j, i);
      }
      console.log(str);
    }
    console.log('');
  };
  /*
   * Function: getRandomCoord
   * ------------------------
   * Gets a random, unoccupied coordinate on the board.
   */
  this.getRandomCoord = function() {
    while (true) {
      var randRow = Math.floor(Math.random()*dimsize);
      var randCol = Math.floor(Math.random()*dimsize);
      if (worldGrid[randRow][randCol] == this.CELL_EMPTY) {
        return { x: randRow, y: randCol };
      }
    }
  };

  // Init.
  for (var i=0; i<dimsize; ++i) {
    worldGrid[i] = [];
    for (var j=0; j<dimsize; ++j) {
      worldGrid[i][j] = this.CELL_EMPTY;
    }
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

if (typeof(exports) !== 'undefined') {
  exports.Board = Board;
}
