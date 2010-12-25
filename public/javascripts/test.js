function Person() {
  var x = 0; // initial x position
  var y = 0; // initial y position
  var direction = -1; // -1 for left, 1 for right
  this.imgName = 'penguin.png';
  this.bgPos = '-12px 0';

  this.getX = function() {
    return x;
  };
  this.getY = function() {
    return y;
  };
  this.move = function(dx, dy) {
    // No bounds checking here. Do it on the
    // world level.
    x += dx;
    y += dy;
    if (dx < 0) {
      this.bgPos = '-12px 0';
    }
    else if (dx > 0) {
      this.bgPos = '-112px 0';
    }
  };
}

var Board = function() {
  /* Private vars */
  var myPerson = new Person(),
      that = this,
      worldGrid = [],
      codeW = 87,
      codeA = 65,
      codeS = 83,
      codeD = 68,
      codeUp = 38,
      codeLeft = 37,
      codeRight = 39,
      codeDown = 40,
      codeSpace = 32,
      fallingTimer; // holds setTimeOut instance when jumping.

  /* Public vars and methods */
  this.height = $('#world li').length;
  this.width = this.height*2;
  this.getGrid = function() { return worldGrid; };
  this.redrawRow = function(row, rowNum) {
    // Redraw.
    row = $(row);
    row.empty();
    for (var j=0; j<that.width; ++j) {
      row.append(worldGrid[rowNum][j]);
    }
  };
  this.redraw = function(/*optional*/rows) {

    if (rows === undefined) {
      // Initialize world state with underscores for empty spaces.
      for (var i=0; i<this.height; ++i) {
        worldGrid[i] = [];
        for (var j=0; j<this.width; ++j) {
          // TODO: change this to divs.
          worldGrid[i].push($('<div>').css('background-image', 'none'));
        }
      }
      this.setPerson();
      $('#world li').each(function(i) {
        that.redrawRow($(this), i);
      });
    }
    else if (rows) {
      for (var i=0; i<rows.length; ++i) {
        var rowNum = rows[i];
        for (var j=0; j<this.width; ++j) {
          $(worldGrid[rowNum][j]).css('background-image', 'none');
          if (rowNum == myPerson.getY() && j == myPerson.getX()) {
            this.setPerson();
          }
        }
        this.redrawRow($('#world li:nth-child('+(rowNum+1)+')'), rowNum);
      }
    }

  }
  this.setPerson = function() {
    $(worldGrid[myPerson.getY()][myPerson.getX()]).css('background-image', 'url('+myPerson.imgName+')');
    $(worldGrid[myPerson.getY()][myPerson.getX()]).css('background-position', myPerson.bgPos);
  }

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
    movePerson(dx,dy);
  });

  var movePerson = function(dx, dy) {
    var oldX = myPerson.getX();
    var oldY = myPerson.getY();
    var newX = oldX+dx;
    var newY = oldY+dy;
    if (checkBounds(newX, newY)) {
      myPerson.move(dx, dy);
      var rows = [oldY];
      if (rows.indexOf(newY) == -1) {
        rows.push(newY);
      }
      that.redraw(rows);
      return false;
    }
  }

  var checkBounds = function(x, y) {
    return (x >= 0 && x < that.width) && (y >= 0 && y < that.height);
  }

}


var myBoard = new Board();
myBoard.redraw();

