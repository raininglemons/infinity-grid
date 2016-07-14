'use strict';

const util = require('util');

class Item {
  constructor (i, breadth, depth) {
    this.i = i || Item.i++;
    this.breadth = breadth;
    this.depth = depth;

    this.breadthStart = null;
    this.breadthEnd = null;

    this.depthStart = null;
    this.depthEnd = null;
  }

  setBreadthOffset(offset) {
    this.breadthStart = offset;
    this.breadthEnd = offset + this.breadth;
  }

  setDepthOffset(offset) {
    this.depthStart = offset;
    this.depthEnd = offset + this.depth;
  }
}

Item.i = 0;

class Test {
  constructor(viewBreadth) {
    this.props = {
      calculateLast: 8, // items
    };

    this.state = {};

    this.state.viewBreadth = 400;

    this.state.itemConfig = [];

    this.state.itemDefinitions = [];

    this.addItem(200, 200);
    this.addItem(100, 100);
    this.addItem(100, 100);
    this.addItem(100, 100);

    this.addItem(100, 100);
    this.addItem(100, 100);
    this.addItem(100, 100);
    this.addItem(100, 100);
  }

  addItem(breadth, depth) {
    const item = new Item(null, breadth, depth);

    this.calculatePosition(item);

    this.state.itemDefinitions.push(item);
  }

  calculatePosition(item) {
    let breadthOffset = this.getClosestBreadth();

    /*
    Check there is enough room in the view at this offset
     */
    if (breadthOffset > 0 && breadthOffset + item.breadth > this.state.viewBreadth) {
      breadthOffset = 0;
    }

    item.setBreadthOffset(breadthOffset);

    /*
    Calculate depth start
     */
    const depthOffset = this.getClosestDepth(item.breadthStart, item.breadthEnd);
    console.log(`${breadthOffset},${depthOffset}`);

    item.setDepthOffset(depthOffset);
  }

  /**
   * Horizontal = top
   * Vertical = left
   */
  getClosestBreadth() {
    let breadthOffset = 0;
    if (this.state.itemDefinitions.length > 0) {
      const lastItem = this.state.itemDefinitions[ this.state.itemDefinitions.length - 1 ];
      breadthOffset = lastItem.breadthEnd;
    }

    return breadthOffset;
  }

  /**
   * Horizontal = left
   * Vertical = top
   */
  getClosestDepth(breadthStart, breadthEnd) {
    let depthOffset = null;
    let i = this.state.itemDefinitions.length - 1;

    if (i > -1) {
      /*
      Set pointer back to first item that has a breadth offset higher or
      equal to the one we're looking for
       */
      for (; i >= 0 && this.state.itemDefinitions[i].breadthEnd < breadthStart; i--) { }

      /*
      Now go through last X items to find the lowest point we must start at
      to fit in this spot.
       */
      const stopAt = i - this.props.calculateLast;
      for (; i >= 0 && i > stopAt; i--) {
        let predecessor = this.state.itemDefinitions[i];

        if ((predecessor.breadthEnd > breadthStart && predecessor.breadthEnd <= breadthEnd)
          || (predecessor.breadthStart < breadthEnd && predecessor.breadthStart >= breadthStart)) {

          if (depthOffset === null || predecessor.depthEnd > depthOffset) {
            depthOffset = predecessor.depthEnd;
          }

        }
      }
    }

    if (i <= 0 && depthOffset === null) {
      depthOffset = 0;
    }

    return depthOffset;
  }
}

new Test(400)