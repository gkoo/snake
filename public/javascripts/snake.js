var Snake = function(/*optional*/snake) {
  if (snake) {
    this.body = snake.body;
    this.color = snake.color;
    this.playerId = snake.playerId;
    this.dx = snake.dx;
    this.dy = snake.dy;
  }
  else {
    this.body = []; // array of coordinate objects
    this.color = '#000'; // default black snake.
    this.playerId = null;
    this.dx = 0;
    this.dy = 0;
  }

  /*
   * Function: move
   * --------------
   * 1) Add new body part adjacent to head.
   * 2) Remove tail body part.
   */
  this.move = function(x, y, grow) {
    var oldtail = null,
        newhead = { x: x, y:y };
    this.body.unshift(newhead);

    // only pop on server.
    if (typeof(grow) === 'undefined' || !grow) {
      oldtail = this.body.pop();
    }
    return { newhead: newhead, oldtail: oldtail };
  };
};

if (typeof(exports) !== 'undefined') {
  exports.Snake = Snake;
}
