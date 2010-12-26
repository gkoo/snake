Snake = function(/*optional*/snake) {
  if (snake) {
    this.body = snake.body;
    this.id = snake.id;
    this.color = snake.color;
  }
  else {
    this.body = []; // array of coordinate objects
    this.id = -1;
    this.color = '#000'; // default black snake.
  }

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
