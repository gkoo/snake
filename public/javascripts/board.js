Board = function(dimsize) {
  /* Private vars */
  //var myPerson = new Person(),
  this.CELL_EMPTY = 0;
  this.CELL_SNAKE = 1;
  this.CELL_APPLE = 2;
  var that = this,
      worldGrid = [],
      appleColor = '#0d0';
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
  this.getGrid = function() { return worldGrid; };
  this.redraw = function(rows) {
    // Assume empty board when this function is called.
    for (var id in snakes) {
      var body = snakes[id].body;
      for (var j=0; j<body.length; ++j) {
        var bodyPart = body[j];
        var coord = this.getCellElem(bodyPart.x, bodyPart.y);
        toggleCell(coord, true, snakes[id].color);
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
    snakes[snake.id] = snake;
  };
  this.redrawSnakeById = function(id) {
    var snake = this.getSnakeById(id);
    for (var i=0; i<snake.body.length; ++i) {
      var cell = myBoard.getCellElem(snake.body[i].x, snake.body[i].y);
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
      var cell = this.getCellElem(bodyPart.x, bodyPart.y);
      toggleCell(cell, false);
    }
    delete snake;
  };
  this.addApple = function(x, y) {
    this.setAppleCell(false, x, y);
    this.redrawCoord(x, y, appleColor);
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
  this.getCell = function (x, y) {
    return worldGrid[x][y];
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

  var checkBounds = function(x, y) {
    var inbounds = (x >= 0 && x < that.dimsize) && (y >= 0 && y < that.dimsize);
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
