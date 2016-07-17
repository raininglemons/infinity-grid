'use strict';

class Item {
  constructor (key, breadth, depth) {
    this.key = key;
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

class Metrics {
  constructor(viewBreadth) {
    this.state = {};

    this.state.viewBreadth = viewBreadth;
    this.state.itemDefinitions = [];
    this.state.itemsByKey = {};
    this.state.lowestDepth = 0;
    this.state.itemsByDepthStart = null;
    this.state.itemsByDepthEnd = null;
  }

  setViewBreadth(viewBreadth) {
    if (viewBreadth !== this.state.viewBreadth) {
      /* Reset info */
      const oldDefinitions = this.state.itemDefinitions;
      this.state.itemDefinitions = [];

      this.state.viewBreadth = viewBreadth;
      this.state.lowestDepth = 0;

      oldDefinitions.forEach(item => this.addItem(item));
    }
  }

  addItem(key, breadth, depth) {
    let item = key;
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

  removeItems(startItem) {
    const removedItems = this.state.itemDefinitions.splice(startItem, this.state.itemDefinitions.length);

    removedItems.forEach(item => {
        delete this.state.itemsByKey[item.key];
      });

    /*
    Update lowest item (used in estimating container size)
     */
    if (this.state.itemDefinitions.length > 0) {
      this.state.lowestDepth = this.state.itemDefinitions.sort((a, b) => a.depthEnd < b.depthEnd)[0].depthEnd;
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

  calculatePosition(item) {
    //console.log(`Item #${this.getItems().length}:`);

    const itemConfigurations = this.getClosestBreadths(item.breadth)
      .reverse()
      .map(breadthStart => ({
        breadthStart,
        depthStart: this.getClosestDepth(breadthStart, breadthStart + item.breadth),
      }))
      .sort((a, b) => {
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

  getClosestBreadths(breadth) {
    let breadthOffset = [];
    const items = this.getItems();
    const numberOfItems = items.length;
    if (numberOfItems > 0) {
      let i = numberOfItems - 1;
      const lastItem = this.getItem(i);

      let initialOffset = lastItem.breadthEnd;

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

      for (let ii = 0; ii < this.state.viewBreadth; ii += breadth) {
        breadthOffset.push(ii);
      }

      if (i >= 0) {
        /* Now try and fill in the gaps as well */
        let predecessor = this.getItem(i);
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
  getClosestDepth(breadthStart, breadthEnd) {
    let depthOffset = null;
    let i = this.state.itemDefinitions.length - 1;
    let id = null;

    if (i > -1) {
      /*
      Set pointer back to first item that has a breadth offset higher or
      equal to the one we're looking for
       */
      for (; i >= 0 && /* */this.getItem(i)/* this.state.itemDefinitions[i]/* */.breadthEnd < breadthStart; i--) { }

      /*
      Now go through last X items to find the lowest point we must start at
      to fit in this spot.
       */
      //console.log(`  - closest start #${i}`);
      for (; i >= 0; i--) {
        let predecessor = /* */this.getItem(i)/*this.state.itemDefinitions[i]/* */;

        if ((predecessor.breadthEnd > breadthStart /*&& predecessor.breadthEnd <= breadthEnd)
          || (predecessor.breadthStart >= breadthStart*/ && predecessor.breadthStart < breadthEnd)) {

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

  estimateContainerDepth(elementCount) {
    const definedItems = this.state.itemDefinitions.length;

    if (!elementCount) {
      elementCount = definedItems;
    }

    let depth = 0;
    if (definedItems > 0) {
      if (definedItems >= elementCount) {
        depth = this.state.lowestDepth;
      } else {
        depth = this.state.lowestDepth / (definedItems / elementCount);
      }
    }

    return depth;
  }

  getItem(i) {
    return this.state.itemDefinitions[i] || null;
  }

  getItemByKey(key) {
    return this.state.itemsByKey[key] || null;
  }

  getItems() {
    return this.state.itemDefinitions;
  }

  getItemsByDepthStart() {
    if (this.state.itemsByDepthStart === null) {
      this.sortItemsByDepthStart(this.state.itemDefinitions);
    }

    return this.state.itemsByDepthStart;
  }

  getItemsByDepthEnd() {
    if (this.state.itemsByDepthEnd === null) {
      this.sortItemsByDepthEnd(this.state.itemDefinitions);
    }

    return this.state.itemsByDepthEnd;
  }

  sortItemsByDepthStart(items) {
    this.state.itemsByDepthStart = items.sort((a, b) => a.depthStart - b.depthStart);
  }

  sortItemsByDepthEnd(items) {
    this.state.itemsByDepthEnd = items.sort((a, b) => a.depthEnd - b.depthEnd);
  }
}

export default Metrics;