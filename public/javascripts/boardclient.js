Board.prototype.worldElem = $('#world');
Board.prototype.getCellElem = function(x, y) {
  // get row
  var y = y+1, x = x+1; // nth-child works on 1-based values;
  var row = this.worldElem.children('li:nth-child(' + y + ')');
  var col = row.find('li:nth-child(' + x + ')');
  return col;
};

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
