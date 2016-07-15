import React from 'react';
import ReactDOM from 'react-dom';
import consoleFactory from 'console-factory';
import Metrics from './Metrics';

const console = consoleFactory('InfinityGrid', 3);

class InfinityGrid extends React.Component {
  constructor(props, context) {
    console.warn('constructed');
    super(props, context);

    this.state = null;
    this.window = null;
    this.metrics = new Metrics();

    this.loadChildrenIntoMetrics(this.props.children);
  }

  componentWillReceiveProps(nextProps) {
    console.warn('nextProps', nextProps);

    this.loadChildrenIntoMetrics(this.props.children);
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
    const children = this.childrenToRender();

    return children.map(child => {
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

  loadChildrenIntoMetrics(children) {
    children = children || this.props.children;
    console.warn('loadChildrenIntoMetrics - called');

    const breadthKey = this.props.mode === 'horizontal' ? 'height' : 'width';
    const depthKey = this.props.mode === 'horizontal' ? 'width' : 'height';

    if (children !== null) {
      /* Only add children that don't already exist */
      let childrenInMetrics = this.metrics.getItems().length;

      children.forEach((child, i) => {
        if (i < childrenInMetrics) {
          const item = this.metrics.getItem(i);
          if (child.key === item.key
            && child.props[breadthKey] === item.breadth
            && child.props[depthKey] === item.depth) {
            console.debug(`Item ${i} matches stored item`);
            return;
          } else {
            this.metrics.removeItems(i);
            childrenInMetrics = i;
          }
        }

        this.metrics.addItem(child.key, child.props[breadthKey], child.props[depthKey]);
      });

      console.debug('Updated metrics object', this.metrics);
    }
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

    const stateChanged = this.state === null || Object.keys(state).some(key => this.state[key] !== state[key]);

    console.debug(`State changed?`, stateChanged);

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
      return this.props.children || [];
    } else {
      return [];
    }
  }

  getWrapperStyle() {
    const style = { position: 'relative' };

    if (this.state !== null) {
      if (this.state.isHorizontal) {
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
    if (this.props.mode === 'horizontal' && this.props.children) {
      style.minHeight = this.metrics.estimateContainerDepth(this.props.children.length);
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
  itemWidth: 150,
  itemHeight: 300,
  tolerance: 10,
  children: [],
  scrollTarget: window,
  className: 'infinity-grid',
  style: {},
  heightKey: 'height',
  widthKey: 'width',
};

export default InfinityGrid;
