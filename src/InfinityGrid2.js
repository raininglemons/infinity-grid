import React from 'react';
import ReactDOM from 'react-dom';
import consoleFactory from 'console-factory';
import Metrics from './Metrics';

const console = consoleFactory('InfinityGrid', 0);

class InfinityGrid extends React.Component {
  constructor(props, context) {
    console.warn('constructed');
    super(props, context);

    this.state = null;
    this.metrics = new Metrics();

    this.mapChildrenByKey(props.children);
  }

  componentWillReceiveProps(nextProps) {
    console.warn('nextProps', nextProps);

    this.mapChildrenByKey(nextProps.children);

    this.updateMetrics(nextProps);
  }

  mapChildrenByKey(children) {
    this.childrenMap = {};

    children.forEach(child => this.childrenMap[child.key] = child);
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
    this.updateMetrics(this.props, true);
  }
  componentWillUnmount() {
    console.debug('componentWillUnmount');

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
      window.removeEventListener('resize', this.boundUpdateMetrics);
    }

    /*
     Remove references, free up some memory
     */
    this.el = null;
  }


  shouldComponentUpdate(nextProps, nextState) {
    let shouldUpdate = true;

    if (this.state !== null) {
      if (this.state.containerSize !== nextState.containerSize) {
        shouldUpdate = true;
      } else {
        console.log('Comparing children', this.state.childrenToRender, nextState.childrenToRender);
        shouldUpdate = !shallowCompare(this.state.childrenToRender, nextState.childrenToRender);
      }
    }

    return shouldUpdate;
  }

  updateMetrics(props) {
    console.warn('updateMetrics - called');
    props = props || this.props;

    const info = this.el.getBoundingClientRect();

    const isHorizontal = props.mode === 'horizontal';

    let state = null;


    if (isHorizontal) {
      state = {
        isHorizontal: true,
        containerSize: props.containerHeight || info.height,
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

    /* Update view size if changed */
    this.metrics.setViewBreadth(state.containerSize);

    /* Load any new children, or children that haven't yet been processed that could now be in view */
    this.loadChildrenIntoMetrics(state, props.children, this.props !== props);

    /* Get the keys of children that should be in view */
    const childrenToRender = [];
    let exceeded = null;
    this.metrics.getItems().every(item => {
      if (item.depthEnd > state.containerStart) {
        if (item.depthStart < state.containerEnd) {
          childrenToRender.push(item.key);
        } else {
          if (exceeded = null) {
            exceeded = item.breadthStart;
          } else if (item.breadthStart <= exceeded) {
            return false;
          }
        }
      }
      return true;
    });

    state.childrenToRender = childrenToRender;

    this.setState(state);
  }

  loadChildrenIntoMetrics(state, children, init = false) {
    children = children || this.props.children;
    console.warn('loadChildrenIntoMetrics - called');

    const breadthKey = state.isHorizontal ? 'height' : 'width';
    const depthKey = state.isHorizontal ? 'width' : 'height';

    if (children !== null && state !== null) {
      /* Only add children that don't already exist */
      let childrenInMetrics = this.metrics.getItems().length;

      children.every((child, i) => {
        if (i < childrenInMetrics) {
          /* Only compare for differences on init of props */
          const item = this.metrics.getItem(i);
          if (init || (this.state.containerSize !== state.containerSize && (child.props[breadthKey] instanceof Function || child.props[depthKey] instanceof Function))) {
            if (child.key === item.key
              && handleDimension(child.props[breadthKey], state.containerSize) === item.breadth
              && handleDimension(child.props[depthKey], state.containerSize) === item.depth) {
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

        const item = this.metrics.addItem(child.key, handleDimension(child.props[breadthKey], state.containerSize), handleDimension(child.props[depthKey], state.containerSize));
        console.log('Added new child to metrics', item);

        return item.depthStart < state.containerEnd;
      });

      console.debug('Updated metrics object', this.metrics);
    }
  }

  getChildren() {
    let children = [];

    if (this.state !== null) {
      children = this.state.childrenToRender.map(key => {
        return React.cloneElement(this.childrenMap[key], { style: this.getItemStyle(key) });
      });
    }

    return children;
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

  render() {
    console.warn('Rendering', this.state !== null ? this.state.childrenToRender : null);
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
  tolerance: 100,
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

function handleDimension (dimension, viewBreadth) {
  if (dimension instanceof Function) {
    return dimension(viewBreadth);
  } else {
    return dimension;
  }
}

export default InfinityGrid;
