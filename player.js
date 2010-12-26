var Player = function(id) {
  // default values
  this.clientId = -1;
  this.playerId = id;
  this.startingPos = null;
  this.snake = null;

  this.initSnake = function(snake) {
    this.snake = snake;
    this.snake.id = this.clientId; // visible only to server
    this.snake.playerId = this.playerId;
    if (this.color) {
      this.snake.color = this.color;
    }
    if (this.startingPos) {
      this.snake.setBody(this.startingPos[0], this.startingPos[1]);
    }
  };

  /* THIS FUNCTION NOT TESTED YET */
  this.getRandStartPos = function() {
    var found = false;
    // Careful...
    while (true) {
      var randRow = Math.floor(Math.random()*DIMSIZE);
      var randCol = Math.floor(Math.random()*(DIMSIZE-SNAKESIZE-1));

      for (var i=randCol; i<randCol+SNAKESIZE; ++i) {
        console.log('Trying {' + randRow + ', ' + i + '}');
        if (!checkBounds(randRow, i)) { break; }
        if (myWorld.getCell(randRow, i) != myWorld.CELL_EMPTY) {
          break;
        }

        // last iteration
        if (i == randCol + SNAKESIZE-1) {
          this.startingPos = [];
          for (var i=randCol; i<randCol+SNAKESIZE; ++i) {
            this.startingPos.push({ x: i, y: randRow});
          }
          found = true;
        }
      }
      if (found) break;
    }
  }
}

exports.Player = Player;
