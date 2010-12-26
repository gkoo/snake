var myBoard = new Board();


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
        $('.yourcolor').css('background-color', myBoard.mysnake.color);
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




// DEBUG STUFF
// -----------

$('#applebtn').click(function(e) {
  socket.send({ type : 'apple' });
  //myBoard.addApple();
});
