'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Item = function () {
  function Item(ref, breadth, depth) {
    _classCallCheck(this, Item);

    this.ref = ref;
    this.breadth = breadth;
    this.depth = depth;

    this.breadthStart = null;
    this.breadthEnd = null;

    this.depthStart = null;
    this.depthEnd = null;
  }

  _createClass(Item, [{
    key: 'setBreadthOffset',
    value: function setBreadthOffset(offset) {
      this.breadthStart = offset;
      this.breadthEnd = offset + this.breadth;
    }
  }, {
    key: 'setDepthOffset',
    value: function setDepthOffset(offset) {
      this.depthStart = offset;
      this.depthEnd = offset + this.depth;
    }
  }]);

  return Item;
}();

var Metrics = function () {
  function Metrics(viewBreadth) {
    _classCallCheck(this, Metrics);

    this.state = {};

    this.state.viewBreadth = viewBreadth;
    this.state.itemDefinitions = [];
    this.state.lowestDepth = 0;
  }

  _createClass(Metrics, [{
    key: 'setViewBreadth',
    value: function setViewBreadth(viewBreadth) {
      var _this = this;

      if (viewBreadth !== this.state.viewBreadth) {
        /* Reset info */
        var oldDefinitions = this.state.itemDefinitions;
        this.state.itemDefinitions = [];

        this.state.viewBreadth = viewBreadth;
        this.state.lowestDepth = 0;

        oldDefinitions.forEach(function (item) {
          return _this.addItem(item);
        });
      } else {
        this.state.viewBreadth = viewBreadth;
      }
    }
  }, {
    key: 'addItem',
    value: function addItem(ref, breadth, depth) {
      var item = ref;
      if (breadth && depth) {
        item = new Item(ref, breadth, depth);
      }

      /*
       Check item breadth doesn't exceed container size. If
       it does, warn and resize it to the width of the container
       */

      if (item.breadth > this.state.viewBreadth) {
        item.breadth = this.state.viewBreadth;
      }

      // console.log(`#${item.ref}`);

      this.calculatePosition(item);

      this.state.itemDefinitions.push(item);
    }
  }, {
    key: 'removeItems',
    value: function removeItems(startItem) {
      this.state.itemDefinitions.splice(startItem, this.state.itemDefinitions.length);

      /*
      Update lowest item (used in estimating container size)
       */
      if (this.state.itemDefinitions.length > 0) {
        this.state.lowestDepth = this.state.itemDefinitions.sort(function (a, b) {
          return a.depthEnd < b.depthEnd;
        })[0].depthEnd;
      } else {
        this.state.lowestDepth = 0;
      }
    }
  }, {
    key: 'calculatePosition',
    value: function calculatePosition(item) {
      var _this2 = this;

      //console.log(`Item #${this.getItems().length}:`);

      var itemConfigurations = this.getClosestBreadths(item.breadth).reverse().map(function (breadthStart) {
        return {
          breadthStart: breadthStart,
          depthStart: _this2.getClosestDepth(breadthStart, breadthStart + item.breadth)
        };
      }).sort(function (a, b) {
        if (a.depthStart !== b.depthStart) {
          return a.depthStart > b.depthStart;
        } else {
          return a.breadthStart > b.breadthStart;
        }
      });

      //itemConfigurations.forEach(conf => console.log(' ', conf));

      item.setBreadthOffset(itemConfigurations[0].breadthStart);
      item.setDepthOffset(itemConfigurations[0].depthStart);

      if (item.depthEnd > this.state.lowestDepth) {
        this.state.lowestDepth = item.depthEnd;
      }
    }
  }, {
    key: 'getClosestBreadths',
    value: function getClosestBreadths(breadth) {
      var breadthOffset = [];
      var items = this.getItems();
      var numberOfItems = items.length;
      if (numberOfItems > 0) {
        var i = numberOfItems - 1;
        var lastItem = this.getItem(i);

        var initialOffset = lastItem.breadthEnd;

        if (initialOffset + breadth > this.state.viewBreadth) {
          initialOffset = 0;
        }

        breadthOffset.push(initialOffset);

        // console.log(` - initial offset ${initialOffset}`);
        if (initialOffset !== 0) {
          /*
           Set pointer back to first item that has a breadth offset higher or
           equal to the one we're looking for
           */
          for (; i >= 0; i--) {
            if (this.getItem(i).breadthStart === 0) {
              i--;
              break;
            }
          }
        }

        if (i >= 0) {
          /* Now try and fill in the gaps as well */
          var predecessor = this.getItem(i);
          // console.log(i, predecessor.breadthStart >= initialOffset);

          for (; i >= 0 && predecessor.breadthStart >= initialOffset; predecessor = this.getItem(--i)) {
            if (predecessor.breadthStart === initialOffset) {
              // console.log(`  - nope #${predecessor.ref}`);
              if (i !== lastItem || predecessor.breadthEnd + breadth > this.state.viewBreadth) {
                break;
              }
            } else {
              // console.log(`  - yep #${predecessor.ref}`, predecessor.breadthStart + breadth <= this.state.viewBreadth);
              if (predecessor.breadthStart + breadth <= this.state.viewBreadth) {
                breadthOffset.push(predecessor.breadthStart);
              }
            }
          }
        }
        /*}*/
      } else {
        breadthOffset.push(0);
      }

      return breadthOffset;
    }

    /**
     * Horizontal = left
     * Vertical = top
     */

  }, {
    key: 'getClosestDepth',
    value: function getClosestDepth(breadthStart, breadthEnd) {
      var depthOffset = null;
      var i = this.state.itemDefinitions.length - 1;

      if (i > -1) {
        /*
        Set pointer back to first item that has a breadth offset higher or
        equal to the one we're looking for
         */
        for (; i >= 0 && /* */this.getItem(i) /* this.state.itemDefinitions[i]/* */.breadthEnd < breadthStart; i--) {}

        /*
        Now go through last X items to find the lowest point we must start at
        to fit in this spot.
         */
        //console.log(`  - closest start #${i}`);
        for (; i >= 0; i--) {
          var predecessor = /* */this.getItem(i) /*this.state.itemDefinitions[i]/* */;

          if (predecessor.breadthEnd > breadthStart /*&& predecessor.breadthEnd <= breadthEnd)
                                                    || (predecessor.breadthStart >= breadthStart*/ && predecessor.breadthStart < breadthEnd) {

            if (depthOffset === null || predecessor.depthEnd > depthOffset) {
              depthOffset = predecessor.depthEnd;
            }
          } else if (depthOffset !== null) {
            break;
          }
        }
      }

      if (i <= 0 && depthOffset === null) {
        depthOffset = 0;
      }

      return depthOffset;
    }
  }, {
    key: 'estimateContainerDepth',
    value: function estimateContainerDepth(elementCount) {
      var definedItems = this.state.itemDefinitions.length;

      if (!elementCount) {
        elementCount = definedItems;
      }

      var depth = 0;
      if (definedItems > 0) {
        if (definedItems >= elementCount) {
          depth = this.state.lowestDepth;
        } else {
          depth = this.state.lowestDepth / (definedItems / elementCount);
        }
      }

      return depth;
    }
  }, {
    key: 'getItem',
    value: function getItem(i) {
      return this.state.itemDefinitions[i] || null;
    }
  }, {
    key: 'getItems',
    value: function getItems() {
      return this.state.itemDefinitions;
    }
  }]);

  return Metrics;
}();

/*
console.time('init');
const test = new Test(300);

let i = 0;

test.addItem(i++, 200, 200);
test.addItem(i++, 100, 100);

test.addItem(i++, 100, 100);

test.addItem(i++, 100, 100);
test.addItem(i++, 100, 100);
test.addItem(i++, 100, 100);

test.addItem(i++, 100, 100);
test.addItem(i++, 100, 100);
test.addItem(i++, 100, 100);

test.addItem(i++, 300, 20);

for (; i < 1000;) { test.addItem(i++, 100, 100); }

console.timeEnd('init');

console.warn(`Estimated container depth: ${test.estimateContainerDepth(10)}`);
console.log(`Container depth: ${test.state.lowestDepth}`);
// console.log(test.getItems().map(item => [item.depthStart, item.breadthStart]));

console.time('change view');
test.setViewBreadth(200);
console.timeEnd('change view');

console.warn(`Estimated container depth: ${test.estimateContainerDepth(10)}`);
console.log(`Container depth: ${test.state.lowestDepth}`);
// console.log(test.getItems().map(item => [item.depthStart, item.breadthStart]));


console.time('change view');
test.setViewBreadth(100);
console.timeEnd('change view');

console.warn(`Estimated container depth: ${test.estimateContainerDepth(10)}`);
console.log(`Container depth: ${test.state.lowestDepth}`);
// console.log(test.getItems().map(item => [item.depthStart, item.breadthStart]));

console.time('remove items');
test.removeItems(6);
console.timeEnd('remove items');

console.log(`Container depth: ${test.state.lowestDepth} ${test.getItems().length}`);
// console.log(test.getItems().map(item => [item.depthStart, item.breadthStart]));
*/

exports.default = Metrics;