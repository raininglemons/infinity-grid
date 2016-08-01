import React from 'react';
import ReactDOM from 'react-dom';
import consoleFactory from 'console-factory';
import Metrics from './Metrics';

const console = consoleFactory('InfinityGrid', 0);

if (environment === 'server') {
  console.debug = console.warn;
}

const environment = typeof window !== 'undefined' ? 'browser' : 'server';

class InfinityGrid extends React.Component {
  constructor(props, context) {
    console.warn('constructed');
    super(props, context);

    this.state = null;
    this.metrics = new Metrics();
    this.endOfListCallbackFired = false;
    this.childrenMap = {};

    this.rafHandle = null;
    this.idleHandle = null;

    if (environment === 'server') {
      this.updateMetrics(props, true);
    }
  }

  componentWillReceiveProps(nextProps) {
    console.warn('nextProps', nextProps);

    this.endOfListCallbackFired = false;

    this.updateMetrics(nextProps);

    /*
     If browser supports requestIdleCallback, continue to process remaining items
     in idle time
     */
    if (environment === 'browser' && (window.requestIdleCallback || window.setImmediate)) {
      this.idleHandle = (window.setImmediate ? setImmediate :requestIdleCallback)(this.loadChildrenWhenIdle.bind(this));
    }
  }

  componentDidMount() {
    console.debug('componentDidMount', this.props.children.length);

    /*
    If we're running on a server, dont bind to anything, window doesn't exist ;)
     */
    if (environment === 'server') {
      this.updateMetrics(this.props, true);
      return;
    }

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
    const metricsFn = () => this.updateMetrics();

    /*
    Only request an animation frame if one is not already pending
     */
    this.boundUpdateMetrics = () => !this.rafHandle && (this.rafHandle = requestAnimationFrame(metricsFn));

    this.scrollTarget.addEventListener('scroll', this.boundUpdateMetrics);
    this.scrollTarget.addEventListener('resize', this.boundUpdateMetrics);
    if (this.scrollTarget !== window) {
      window.addEventListener('resize', this.boundUpdateMetrics);
    }

    /*
     Populate state
     */
    this.updateMetrics(this.props, true);

    /*
    If browser supports requestIdleCallback and requestIdleCallback isn't already
    queued up queue it...
     */
    if (!this.idleHandle && window.requestIdleCallback) {
      this.idleHandle = requestIdleCallback(this.loadChildrenWhenIdle.bind(this));
    }
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
    if (environment === 'browser') {
      this.scrollTarget.removeEventListener('scroll', this.boundUpdateMetrics);
      this.scrollTarget.removeEventListener('resize', this.boundUpdateMetrics);
      if (this.scrollTarget !== window) {
        window.removeEventListener('resize', this.boundUpdateMetrics);
      }
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

  updateMetrics(props, init = false) {
    console.warn('updateMetrics - called');
    props = props || this.props;

    const info = environment === 'server' ? {} : this.el.getBoundingClientRect();

    const isHorizontal = props.mode === 'horizontal';

    let state = null;

    if (isHorizontal) {
      state = {
        isHorizontal: true,
        containerSize: environment === 'server' ? props.serverViewHeight || props.containerHeight : props.containerHeight || info.height,
        containerOffset: info.left || 0,
        viewSize: environment === 'server' ? props.serverViewWidth : window.innerWidth,
        widthKey: 'depth',
        heightKey: 'breadth',
        leftKey: 'depthStart',
        topKey: 'breadthStart',
      };
    } else {
      state = {
        isHorizontal: false,
        containerSize: environment === 'server' ? props.serverViewWidth : info.width,
        containerOffset: info.top || 0,
        viewSize: environment === 'server' ? props.serverViewHeight : window.innerHeight,
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

    /* Estimate the container depth */
    state.containerDepth = this.metrics.estimateContainerDepth(this.props.children.length);

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

    if (environment !== 'server' && !this.endOfListCallbackFired && this.props.callback &&
      state.childrenToRender[state.childrenToRender.length - 1] === this.props.children[this.props.children.length - 1].key) {
      console.warn('Firing end of list callback');
      this.endOfListCallbackFired = true;
      setTimeout(this.props.callback, 0);
    }

    if (init) {
      this.state = state;
    } else {
      this.setState(state);
    }

    this.rafHandle = null;
  }

  loadChildrenWhenIdle(deadline) {
    console.warn('loadChildrenWhenIdle called');
    /* Still children left to do? */
    const itemsInMetrics = this.metrics.getItems().length;
    const numberOfChildren = this.props.children.length;

    /* If we're using IE's setIntermediate, instead cap iteration to 5 items */
    let iterationsStillAllowed = 5;

    if (itemsInMetrics < numberOfChildren) {
      const containerSize = this.state.containerSize;
      const breadthKey = this.state.isHorizontal ? this.props.heightKey : this.props.widthKey;
      const depthKey = this.state.isHorizontal ? this.props.widthKey : this.props.heightKey;

      if (containerSize) {
        for (let i = itemsInMetrics; i < numberOfChildren && (
          (deadline && deadline.timeRemaining() > 0)
          || (!deadline && iterationsStillAllowed-- > 0)
        ); i++) {
          const child = this.props.children[i];

          this.metrics.addItem(
            child.key,
            handleDimension(child.props[breadthKey], containerSize),
            handleDimension(child.props[depthKey], containerSize)
          );

          this.childrenMap[child.key] = child;
        }
      }

      this.idleHandle = (window.setImmediate ? setImmediate :requestIdleCallback)(this.loadChildrenWhenIdle.bind(this));
    } else {
      console.log('Children preloading complete', this.props.children, this.metrics);
      this.idleHandle = null;

      /* Update state if we have a more accurate document length now */
      const containerDepth = this.metrics.estimateContainerDepth(numberOfChildren);
      if (containerDepth !== this.state.containerDepth) {
        console.debug(`Updating new container depth ${containerDepth}, instead of ${this.state.containerDepth}`);
        this.setState(Object.assign({}, this.metrics, { containerDepth }));
      }
    }
  }

  loadChildrenIntoMetrics(state, children, init = false) {
    children = children || this.props.children;
    console.warn('loadChildrenIntoMetrics - called');

    const breadthKey = state.isHorizontal ? this.props.heightKey : this.props.widthKey;
    const depthKey = state.isHorizontal ? this.props.widthKey : this.props.heightKey;

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
              this.metrics.removeItems(i).forEach(item => delete this.childrenMap[item.key]);
              childrenInMetrics = i;
            }
          } else {
            return true;
          }
        }

        console.log(`Init new item ${child.key}`);
        const item = this.metrics.addItem(
          child.key,
          handleDimension(child.props[breadthKey], state.containerSize),
          handleDimension(child.props[depthKey], state.containerSize)
        );

        this.childrenMap[child.key] = child;

        return item.depthStart < state.containerEnd;
      });

      console.debug('Updated metrics object', this.metrics);
    }
  }

  getChildren() {
    let children = [];

    if (this.state !== null) {
      children = this.state.childrenToRender.map(key => {
        /*if (!this.childrenMap[key]) {
          window.console.warn(`Couldn't find child ${key}`);
        }
        try {*/
          return React.cloneElement(this.childrenMap[key], { style: this.getItemStyle(key) });
        /*} catch (e) {
          console.error('Error cloning child', e, this.childrenMap[key], key, this.childrenMap);
        }*/
      });
    }

    return children;
  }

  getWrapperStyle() {
    const style = { position: 'relative' };

    if (this.state !== null) {
      if (this.state.isHorizontal) {
        style.width = this.state.containerDepth;
        if (this.props.containerHeight) {
          style.minHeight = `${this.props.containerHeight}px`;
        }
      } else {
        style.minHeight = this.state.containerDepth;
      }
    }

    return style;
  }

  getItemStyle(key) {
    const child = this.metrics.getItemByKey(key);

    const left = child[this.state.leftKey];
    const top = child[this.state.topKey];

    const style = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: child[this.state.widthKey],
      height: child[this.state.heightKey],
      //transform: `translateX(${left}px) translateY(${top}px)`,
      transform: `translate3d(${left}px, ${top}px, 0)`,
    };

    return style;
  }

  render() {
    console.warn('Render');

    const style = Object.assign(this.getWrapperStyle(), this.props.style);

    console.log(this.getChildren());

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
  callback: React.PropTypes.func,
  serverViewWidth: React.PropTypes.number,
  serverViewHeight: React.PropTypes.number,
};

InfinityGrid.defaultProps = {
  mode: 'vertical',
  tolerance: 100,
  children: [],
  scrollTarget: environment === 'browser' ? window : null,
  className: 'infinity-grid',
  style: {},
  heightKey: 'height',
  widthKey: 'width',
  serverViewWidth: 800,
  serverViewHeight: 800,
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
