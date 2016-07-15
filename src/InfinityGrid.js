import React from 'react';
import ReactDOM from 'react-dom';
import consoleFactory from 'console-factory';
import Metrics from './Metrics';

const console = consoleFactory('InfinityGrid', 1);

class InfinityGrid extends React.Component {
  constructor(props, context) {
    console.warn('constructed');
    super(props, context);

    this.state = null;
    this._childrenToRender = [];
    this.metrics = new Metrics();
  }

  componentWillReceiveProps(nextProps) {
    console.warn('nextProps', nextProps);

    this.loadChildrenIntoMetrics(this.props.children, true);
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
     Add window scroll and resize listeners
     */
    this.boundUpdateMetrics = () => this.updateMetrics();
    this.scrollTarget.addEventListener('scroll', this.boundUpdateMetrics);
    this.scrollTarget.addEventListener('resize', this.boundUpdateMetrics);
    if (this.scrollTarget !== window) {
      window.addEventListener('resize', this.boundUpdateMetrics);
    }

    /*
     Populate state
     */
    this.updateMetrics();
  }

  shouldComponentUpdate(nextProps, nextState) {
    /*
    Work out which children will be rendered in the next view now. Compare
    against the previously rendered children, if theres no change, do nothing
     */
    this.loadChildrenIntoMetrics();
    const children = this.childrenToRender();

    /*
    Let's cheat somewhat to save time, if the first and last child match,
    assume we're fine
     */
    if (this._childrenToRender.length !== children.length || children.length === 0) {
      this._childrenToRender = children;
      return true;
    }

    if (this._childrenToRender[0].key !== children[0].key) {
      this._childrenToRender = children;
      return true;
    }

    if (this._childrenToRender[this._childrenToRender.length - 1].key !== children[children.length - 1].key) {
      this._childrenToRender = children;
      return true;
    }

    console.warn('BLOCKING RENDER');

    return false;
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
    return this._childrenToRender.map(child => {
      return React.cloneElement(child, { style: this.getItemStyle(child.key) });
    })
  }

  getItemStyle(key) {
    const child = this.metrics.getItemByKey(key);

    const style = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: child[this.state.widthKey],
      height: child[this.state.heightKey],
      transform: `translateX(${child[this.state.leftKey]}px) translateY(${child[this.state.topKey]}px)`,
    };

    return style;
  }

  loadChildrenIntoMetrics(children, init = false) {
    children = children || this.props.children;
    console.warn('loadChildrenIntoMetrics - called');

    const breadthKey = this.props.mode === 'horizontal' ? 'height' : 'width';
    const depthKey = this.props.mode === 'horizontal' ? 'width' : 'height';

    if (children !== null && this.state !== null) {
      /* Only add children that don't already exist */
      let childrenInMetrics = this.metrics.getItems().length;

      children.every((child, i) => {
        if (i < childrenInMetrics) {
          /* Only compare for differences on init of props */
          if (init) {
            const item = this.metrics.getItem(i);
            if (child.key === item.key
              && child.props[breadthKey] === item.breadth
              && child.props[depthKey] === item.depth) {
              console.debug(`Item ${i} matches stored item`);
              return true;
            } else {
              this.metrics.removeItems(i);
              childrenInMetrics = i;
            }
          } else {
            return true;
          }
        }

        const item = this.metrics.addItem(child.key, child.props[breadthKey], child.props[depthKey]);
        console.log('Added new child to metrics', item);

        return item.depthStart < this.state.containerEnd;
      });

      console.debug('Updated metrics object', this.metrics);
    }
  }

  updateMetrics(props) {
    console.warn('updateMetrics - called');
    props = props || this.props;

    const info = this.el.getBoundingClientRect();

    console.log(info);

    const isHorizontal = props.mode === 'horizontal';

    let state = null;

    if (isHorizontal) {
      state = {
        isHorizontal: true,
        containerSize: info.height,
        containerOffset: info.left,
        viewSize: window.innerWidth,
        widthKey: 'depth',
        heightKey: 'breadth',
        leftKey: 'depthStart',
        topKey: 'breadthStart',
      };
    } else {
      state = {
        isHorizontal: false,
        containerSize: info.width,
        containerOffset: info.top,
        viewSize: window.innerHeight,
        widthKey: 'breadth',
        heightKey: 'depth',
        leftKey: 'breadthStart',
        topKey: 'depthStart',
      };
    }
    state.containerStart = (state.containerOffset * -1) - this.props.tolerance;
    state.containerEnd = state.containerStart + state.viewSize + (this.props.tolerance * 2);

    const stateChanged = this.state === null || Object.keys(state).some(key => this.state[key] !== state[key]);

    console.debug(`State changed?`, stateChanged, state);

    if (stateChanged) {
      this.metrics.setViewBreadth(state.containerSize);
      this.setState(state);
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

  childrenToRender() {
    if (this.state !== null) {
      return this.props.children.filter((child, i) => {
        const item = this.metrics.getItem(i);
        return item && item.depthStart < this.state.containerEnd && item.depthEnd > this.state.containerStart;
      })
    } else {
      return [];
    }
  }

  getWrapperStyle() {
    const style = { position: 'relative' };

    const minDepth = this.metrics.estimateContainerDepth(this.props.children.length);

    if (this.state !== null) {
      if (this.state.isHorizontal) {
        style.width = minDepth;
        if (this.props.containerHeight) {
          style.height = `${this.props.containerHeight}px`;
        }
      } else {
        style.height = minDepth;
      }
    }

    return style;
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

InfinityGrid.propTypes = {
  mode: React.PropTypes.string,
  itemWidth: React.PropTypes.any,
  itemHeight: React.PropTypes.any,
  tolerance: React.PropTypes.number,
  children: React.PropTypes.array,
  scrollTarget: React.PropTypes.any,
  containerHeight: React.PropTypes.number,
  className: React.PropTypes.string,
  style: React.PropTypes.object,
  heightKey: React.PropTypes.string,
  widthKey: React.PropTypes.string,
};

InfinityGrid.defaultProps = {
  mode: 'vertical',
  tolerance: 200,
  children: [],
  scrollTarget: window,
  className: 'infinity-grid',
  style: {},
  heightKey: 'height',
  widthKey: 'width',
};

function shallowCompare(one, two) {
  if (!one && !two && one == two)
    return true;
  else if (!one && !two || !one && !!two || !!one && !two)
    return false;

  if (one.__proto__ !== two.__proto__) {
    return false;
  }

  let keys = null;
  const oneLen = one instanceof Array ? one.length : (keys = Object.keys(one)).length;
  const twoLen = two instanceof Array ? two.length : Object.keys(two).length;

  if (oneLen !== twoLen) {
    return false;
  }

  if (keys) {
    return keys.every(key => one[key] === two[key]);
  } else {
    return one.every((val, i) => val === two[i]);
  }
}

export default InfinityGrid;
