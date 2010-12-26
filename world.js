World = function() {
  this.CELL_EMPTY = 0;
  this.CELL_SNAKE = 1;
  this.CELL_APPLE = 2;
  this.worldGrid = [];

  this.setSnakeCell = function (x, y) {
    this.worldGrid[x][y] = this.CELL_SNAKE;
  };
  this.setEmptyCell = function (x, y) {
    this.worldGrid[x][y] = this.CELL_EMPTY;
  };
  this.setAppleCell = function (x, y) {
    this.worldGrid[x][y] = this.CELL_APPLE;
  };
  this.getCell = function (x, y) {
    return this.worldGrid[x][y];
  };

  // Init.
  for (var i=0; i<DIMSIZE; ++i) {
    this.worldGrid[i] = [];
    for (var j=0; j<DIMSIZE; ++j) {
      this.worldGrid[i][j] = this.CELL_EMPTY;
    }
  }
};
