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
  this.move = function(x, y, grow) {
    console.log('body size before: ' + this.body.length);
    var oldtail = null,
        newhead = { x: x, y:y };
    this.body.unshift(newhead);
    if (typeof(grow) === 'undefined' || !grow) {
      console.log('removing tail');
      oldtail = this.body.pop();
    }
    console.log('body size after : ' + this.body.length);
    return { newhead: newhead, oldtail: oldtail };
  };
};
