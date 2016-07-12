import React from 'react';
import ReactDOM from 'react-dom';
import consoleFactory from 'console-factory';

const console = consoleFactory('InfinityScroller', 0);

class InfinityScroller extends React.Component {
  constructor(props, context) {
    console.warn('constructed');
    super(props, context);

    this.state = null;
    this.window = null;
  }

  componentWillReceiveProps(nextProps) {
    console.log('nextProps', nextProps);
    this.updateMetrics(nextProps);
  }

  componentDidMount() {
    console.debug('componentDidMount', this.props.children.length);

    /*
     Find element we're rendering to, and pseudo-'window'
     */
    this.el = ReactDOM.findDOMNode(this);
    this.scrollTarget = this.props.scrollTarget;
    if (this.scrollTarget === 'parent') {
      this.scrollTarget = this.el.parentElement;
    }

    /*
     Scroll container as necessary
     */
    if (this.containerOffset) {
      if (this.scrollTarget !== window) {
        this.scrollTarget.scrollLeft = this.containerOffset.left;
        this.scrollTarget.scrollTop = this.containerOffset.top;
      }
      this.containerOffset = null;
    }

    /*
     Add window scroll and resize listeners
     */
    this.boundUpdateMetrics = () => this.updateMetrics(this.props);
    this.scrollTarget.addEventListener('scroll', this.boundUpdateMetrics);
    this.scrollTarget.addEventListener('resize', this.boundUpdateMetrics);
    if (this.scrollTarget !== window) {
      window.addEventListener('resize', this.boundUpdateMetrics);
    }

    /*
     Populate state
     */
    this.updateMetrics(this.props);
  }

  componentWillUnmount() {
    console.debug('componentWillUnmount');

    /*
     Remember offset of scroll window (if not document window)
     */
    if (this.scrollTarget !== window) {
      this.containerOffset = {
        top: this.scrollTarget.scrollTop,
        left: this.scrollTarget.scrollLeft,
      };
      console.warn('containerOffset stored', this.containerOffset);
    }

    /*
     Clean up
     */
    this.state = null;

    /*
     Remove event listeners
     */
    this.scrollTarget.removeEventListener('scroll', this.boundUpdateMetrics);
    this.scrollTarget.removeEventListener('resize', this.boundUpdateMetrics);
    if (this.scrollTarget !== window) {
      window.addEventListener('resize', this.boundUpdateMetrics);
    }

    /*
     Remove references, free up some memory
     */
    this.el = null;
    this.boundUpdateMetrics = null;
  }

  getChildren() {
    if (this.state !== null) {
      /* Work out first child that's visible */
      const { first, last } = this.state;
      console.debug('first', first);
      console.debug('last', last);

      console.log('children to display', first, last);

      if (this.props.component) {
        return this.props.children.slice(first, last + 1).map((child, i) => {
            return React.createElement(this.props.component, Object.assign(child, { style: this.getItemStyle(i + first) }));
      });
      } else {
        return this.props.children.slice(first, last + 1).map((child, i) => {
            return React.cloneElement(child, { style: this.getItemStyle(i + first) });
      });
      }
    } else {
      /* First load, return nothing, as we don't have the required metrics */
      return [];
    }
  }

  getItemStyle(i) {
    const style = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: this.props.itemWidth,
      height: this.props.itemHeight,
    };
    let column;
    let row;

    switch (this.props.mode) {
      case 'horizontal':
        column = (i / this.state.groupedItems) >>> 0;
        row = i % this.state.groupedItems;
        break;

      default:
        row = (i / this.state.groupedItems) >>> 0;
        column = i % this.state.groupedItems;
    }

    const top = row * this.props.itemHeight;
    const left = column * this.props.itemWidth;

    console.debug(`Position #${i}: row: ${row}, column: ${column}, top: ${top}px, left: ${left}px`);

    const transform = `translateX(${left}px) translateY(${top}px)`;
    style.transform = transform;
    return style;
  }

  updateMetrics(props) {
    console.debug('updateMetrics - called');
    props = props || this.props;

    let visibleChildren = {};

    if (props.children.length === 0) {
      visibleChildren = {
        first: null,
        last: null,
        height: null,
        width: null,
      };
    } else {
      //const el = ReactDOM.findDOMNode(this);
      const info = this.el.getBoundingClientRect();

      console.log('info', info);

      const isHorizontal = props.mode === 'horizontal';

      /*
       Convert any percentages or strings to numbers
       */
      //const itemWidth = this.convertDimensionToString(props.itemHeight, info.height);
      //const itemHeight = this.convertDimensionToString(props.itemWidth, info.width);

      const metrics = {
        containerSize: isHorizontal ? info.height : info.width,
        containerOffset: isHorizontal ? info.left : info.top,
        viewSize: isHorizontal ? window.innerWidth : window.innerHeight,
        groupedItems: (isHorizontal ? (info.height / props.itemHeight)
          : (info.width / props.itemWidth)) >>> 0,
        itemBreadth: isHorizontal ? this.convertDimensionToString(props.itemHeight, info.height)
          : this.convertDimensionToString(props.itemWidth, info.width),
        itemDepth: isHorizontal ? props.itemWidth : props.itemHeight,
      };

      /*
       Add item 'breadth' + tolerance to window size
       */
      metrics.viewSize += 2 * props.tolerance + metrics.itemDepth;

      if (metrics.groupedItems < 1) {
        metrics.groupedItems = 1;
      }

      visibleChildren = this.visibleChildren(metrics, props);
    }

    let stateChanged = this.state === null;

    if (!stateChanged) {
      const keysToCompare = [
        'first',
        'last',
        'groupedItems',
        'containerSize',
        'itemWidth',
        'itemHeight',
      ];

      stateChanged = keysToCompare.some(key => visibleChildren[key] !== this.state[key]);
    }

    if (stateChanged) {
      this.setState(visibleChildren);
    }
  }

  convertDimensionToString(dimension, context) {
    console.log(dimension, context);
    if (typeof dimension === 'string') {
      let regexMatch = null;
      if ((regexMatch = dimension.match(/([0-9]+)%/)) !== null) {
        console.warn('itemBreadth is percentage', regexMatch);
        return (parseFloat(regexMatch[0]) / 100) * context;
      } else {
        console.log('itemBreadth is number');
        return parseFloat(dimension);
      }
    } else if (dimension instanceof Function) {
      return parseFloat(dimension(context));
    }
    /* Anything else, try and cast as float */
    return parseFloat(dimension);
  }

  getWrapperStyle() {
    const style = { position: 'relative' };

    if (this.state !== null) {
      if (this.props.mode === 'horizontal') {
        style.width = this.state.containerSize;
        if (this.props.containerHeight) {
          style.height = `${this.props.containerHeight}px`;
        }
      } else {
        style.height = this.state.containerSize;
      }
    }

    /*
     Set a min height in horizontal mode to be at least the height of
     a single item.
     */
    if (this.props.mode === 'horizontal') {
      style.minHeight = this.props.itemHeight;
    }

    return style;
  }

  visibleChildren(metrics, props) {
    const items = {
      first: null,
      last: null,
      containerSize: null,
      groupedItems: null,
    };

    const lastChild = props.children.length - 1;

    /*
     Work out width of container to contain all items
     */
    items.containerSize = Math.ceil(props.children.length / metrics.groupedItems)
      * metrics.itemDepth;

    /*
     Work out which column is the first visible one
     */
    const visibleUnitStart = -metrics.containerOffset - props.tolerance - metrics.itemDepth;

    let firstUnitInView = 0;
    if (visibleUnitStart < 0) {
      items.first = 0;
    } else {
      firstUnitInView = ((visibleUnitStart / metrics.itemDepth) >>> 0);
      items.first = firstUnitInView * metrics.groupedItems;

      /* Check items are in view */
      if (items.first > lastChild) {
        items.first = null;
        return items;
      }
    }

    /*
     Work out last visible column
     */
    const visibleUnitEnd = visibleUnitStart + metrics.viewSize;
    items.last = Math.ceil(visibleUnitEnd / metrics.itemDepth) * metrics.groupedItems;
    console.debug('visibleUnit', visibleUnitStart, visibleUnitEnd);

    /* Check we haven't exceeded viewable items */
    if (items.last > lastChild) {
      items.last = lastChild;
    }

    /* Store how many items per group for rendering later so it doesn't have to be recalculated */
    items.groupedItems = metrics.groupedItems;

    return items;
  }

  render() {
    console.debug('render', this);
    const style = Object.assign(this.getWrapperStyle(), this.props.style);
    return (
      <div className={this.props.className} style={style}>
      {this.getChildren()}
  </div>
  );
  }
}

InfinityScroller.propTypes = {
  mode: React.PropTypes.string,
  itemWidth: React.PropTypes.any,
  itemHeight: React.PropTypes.any,
  tolerance: React.PropTypes.number,
  children: React.PropTypes.array,
  scrollTarget: React.PropTypes.any,
  containerHeight: React.PropTypes.number,
  className: React.PropTypes.string,
  style: React.PropTypes.object,
};

InfinityScroller.defaultProps = {
  mode: 'vertical',
  itemWidth: 150,
  itemHeight: 300,
  tolerance: 10,
  children: [],
  scrollTarget: window,
  className: 'infinity-scroller',
  style: {},
};

export default InfinityScroller;
