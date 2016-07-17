'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Item = function () {
  function Item(key, breadth, depth) {
    _classCallCheck(this, Item);

    this.key = key;
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
    this.state.itemsByKey = {};
    this.state.lowestDepth = 0;
    this.state.itemsByDepthStart = null;
    this.state.itemsByDepthEnd = null;
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
      }
    }
  }, {
    key: 'addItem',
    value: function addItem(key, breadth, depth) {
      var item = key;
      if (breadth && depth) {
        item = new Item(key, breadth, depth);
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

      this.state.itemsByKey[item.key] = item;

      /*
       Empty cached sort indexes
       */
      if (this.state.itemsByDepthStart) {
        this.state.itemsByDepthStart = null;
      }

      if (this.state.itemsByDepthEnd) {
        this.state.itemsByDepthEnd = null;
      }

      return item;
    }
  }, {
    key: 'removeItems',
    value: function removeItems(startItem) {
      var _this2 = this;

      var removedItems = this.state.itemDefinitions.splice(startItem, this.state.itemDefinitions.length);

      removedItems.forEach(function (item) {
        delete _this2.state.itemsByKey[item.key];
      });

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

      /*
      Empty cached sort indexes
       */
      this.state.itemsByDepthStart = null;
      this.state.itemsByDepthEnd = null;

      return removedItems;
    }
  }, {
    key: 'calculatePosition',
    value: function calculatePosition(item) {
      var _this3 = this;

      //console.log(`Item #${this.getItems().length}:`);

      var itemConfigurations = this.getClosestBreadths(item.breadth).reverse().map(function (breadthStart) {
        return {
          breadthStart: breadthStart,
          depthStart: _this3.getClosestDepth(breadthStart, breadthStart + item.breadth)
        };
      }).sort(function (a, b) {
        if (a.depthStart !== b.depthStart) {
          return a.depthStart - b.depthStart;
        } else {
          return a.breadthStart - b.breadthStart;
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

        //console.log(` - initial offset ${initialOffset}`);
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

        for (var ii = 0; ii < this.state.viewBreadth; ii += breadth) {
          breadthOffset.push(ii);
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
              if (predecessor.breadthStart + breadth <= this.state.viewBreadth && breadthOffset.indexOf(predecessor.breadthStart) === -1) {
                breadthOffset.unshift(predecessor.breadthStart);
              }
            }
          }
        }
        /*}*/
      } else {
        breadthOffset.push(0);
      }

      //console.log(breadthOffset);

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
      var id = null;

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
    key: 'getItemByKey',
    value: function getItemByKey(key) {
      return this.state.itemsByKey[key] || null;
    }
  }, {
    key: 'getItems',
    value: function getItems() {
      return this.state.itemDefinitions;
    }
  }, {
    key: 'getItemsByDepthStart',
    value: function getItemsByDepthStart() {
      if (this.state.itemsByDepthStart === null) {
        this.sortItemsByDepthStart(this.state.itemDefinitions);
      }

      return this.state.itemsByDepthStart;
    }
  }, {
    key: 'getItemsByDepthEnd',
    value: function getItemsByDepthEnd() {
      if (this.state.itemsByDepthEnd === null) {
        this.sortItemsByDepthEnd(this.state.itemDefinitions);
      }

      return this.state.itemsByDepthEnd;
    }
  }, {
    key: 'sortItemsByDepthStart',
    value: function sortItemsByDepthStart(items) {
      this.state.itemsByDepthStart = items.sort(function (a, b) {
        return a.depthStart - b.depthStart;
      });
    }
  }, {
    key: 'sortItemsByDepthEnd',
    value: function sortItemsByDepthEnd(items) {
      this.state.itemsByDepthEnd = items.sort(function (a, b) {
        return a.depthEnd - b.depthEnd;
      });
    }
  }]);

  return Metrics;
}();

exports.default = Metrics;