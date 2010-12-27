var dimsize = $('#world').children('li').length,
    myBoard = new Board(dimsize),
    mySessionId = 0,
    debug = function(str) {
      var elem = $('<p>');
      elem.text(str);
      $('.debug').append(elem);
    };



var doMove = function(playerId, newX, newY, grow) {
  var snake = myBoard.getSnakeByPlayerId(playerId);
  var updateCoords = snake.move(newX, newY, grow);

  var oldtail = updateCoords.oldtail;
  var newhead = updateCoords.newhead;

  // oldtail is null if snake just ate the apple.
  if (oldtail) {
    myBoard.setEmptyCell(oldtail.x, oldtail.y);
    myBoard.redrawCoord(oldtail.x, oldtail.y, snake.color);
  }

  myBoard.setSnakeCell(newhead.x, newhead.y);
  myBoard.redrawCoord(newhead.x, newhead.y, snake.color);
};


// SOCKET.IO STUFF
// ---------------

var socket = new io.Socket(null, {port: 8080, rememberTransport: false});

socket.connect();

// Receive message
socket.on('message', function(obj){
  // Initialize board.
  if ('snakes' in obj){
    if ('sessionId' in obj) {
      mySessionId = obj.sessionId;
    }
    for (var i=0; i<obj.snakes.length; ++i) {
      snake = obj.snakes[i];
      var newsnake = new Snake(snake);
      myBoard.addSnake(newsnake);

      // Set "my" snake.
      if (i == 0) {
        myBoard.mysnake = newsnake;
        $('.yourcolor').css('background-color', myBoard.mysnake.color);
      }

    }
    myBoard.redraw();
  }
  else if ('newsnake' in obj) {
    // a new snake entered the board
    myBoard.addSnake(new Snake(obj.newsnake));
    // use server snake obj to get client snake obj and redraw
    myBoard.redrawSnakeByPlayerId(obj.newsnake.playerId);
  }
  else if ('apple' in obj) {
    myBoard.addApple(obj.apple.x, obj.apple.y);
  }
  else if ('type' in obj) {
    switch(obj.type) {
      case 'serverMove':
        doMove(obj.playerId, obj.x, obj.y, obj.grow);
        break;

      case 'allMove':
        if (typeof(obj.apple) !== 'undefined' && obj.apple) {
          //myBoard.addApple(obj.apple.x, obj.apple.y);
        }
        for (var i=0; i<obj.moves.length; ++i) {
          var move = obj.moves[i];
          if (typeof(move.death) !== 'undefined') {
            var i=0;
            // TODO: handle death
          }
          else {
            // It's a normal move.
            debug('playerId: ' + move.playerId + ' | ' + move.x + ', ' + move.y);
            doMove(move.playerId, move.x, move.y, move.grow);
          }
        }
        break;

      case 'death':
        if (myBoard.kill(obj.playerId)) {
          // Game over.
        }
        break;

      case 'gameover':
        alert('game over!');
        break;
    }
  }
  else if ('disconnect' in obj) {
    // remove snake from board.
    playerId = obj.disconnect;
    myBoard.removeSnakeByPlayerId(playerId);
  }
});




// DEBUG STUFF
// -----------

$('#applebtn').click(function(e) {
  socket.send({ type : 'apple' });
});
$('#startbtn').click(function(e) {
  socket.send({ type : 'start' });
});
$('#stopbtn').click(function(e) {
  socket.send({ type : 'stop' });
});
