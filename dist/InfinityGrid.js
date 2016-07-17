'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _consoleFactory = require('console-factory');

var _consoleFactory2 = _interopRequireDefault(_consoleFactory);

var _Metrics = require('./Metrics');

var _Metrics2 = _interopRequireDefault(_Metrics);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var console = (0, _consoleFactory2.default)('InfinityGrid', 0);

var InfinityGrid = function (_React$Component) {
  _inherits(InfinityGrid, _React$Component);

  function InfinityGrid(props, context) {
    _classCallCheck(this, InfinityGrid);

    console.warn('constructed');

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(InfinityGrid).call(this, props, context));

    _this.state = null;
    _this.metrics = new _Metrics2.default();
    _this.endOfListCallbackFired = false;
    _this.childrenMap = {};

    _this.rafHandle = null;
    _this.idleHandle = null;
    return _this;
  }

  _createClass(InfinityGrid, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      console.warn('nextProps', nextProps);

      this.endOfListCallbackFired = false;

      this.updateMetrics(nextProps);

      /*
       If browser supports requestIdleCallback, continue to process remaining items
       in idle time
       */
      if (window.requestIdleCallback || window.setImmediate) {
        this.idleHandle = (window.setImmediate ? setImmediate : requestIdleCallback)(this.loadChildrenWhenIdle.bind(this));
      }
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this2 = this;

      console.debug('componentDidMount', this.props.children.length);

      /*
       Find element we're rendering to, and pseudo-'window'
       */
      this.el = _reactDom2.default.findDOMNode(this);
      this.scrollTarget = this.props.scrollTarget;
      if (this.scrollTarget === 'parent') {
        this.scrollTarget = this.el.parentElement;
      }

      /*
       Add window scroll and resize listeners
       */
      var metricsFn = function metricsFn() {
        return _this2.updateMetrics();
      };

      /*
      Only request an animation frame if one is not already pending
       */
      this.boundUpdateMetrics = function () {
        return !_this2.rafHandle && (_this2.rafHandle = requestAnimationFrame(metricsFn));
      };

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
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
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
  }, {
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate(nextProps, nextState) {
      var shouldUpdate = true;

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
  }, {
    key: 'updateMetrics',
    value: function updateMetrics(props) {
      console.warn('updateMetrics - called');
      props = props || this.props;

      var info = this.el.getBoundingClientRect();

      var isHorizontal = props.mode === 'horizontal';

      var state = null;

      if (isHorizontal) {
        state = {
          isHorizontal: true,
          containerSize: props.containerHeight || info.height,
          containerOffset: info.left,
          viewSize: window.innerWidth,
          widthKey: 'depth',
          heightKey: 'breadth',
          leftKey: 'depthStart',
          topKey: 'breadthStart'
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
          topKey: 'depthStart'
        };
      }
      state.containerStart = state.containerOffset * -1 - this.props.tolerance;
      state.containerEnd = state.containerStart + state.viewSize + this.props.tolerance * 2;

      /* Update view size if changed */
      this.metrics.setViewBreadth(state.containerSize);

      /* Load any new children, or children that haven't yet been processed that could now be in view */
      this.loadChildrenIntoMetrics(state, props.children, this.props !== props);

      /* Estimate the container depth */
      state.containerDepth = this.metrics.estimateContainerDepth(this.props.children.length);

      /* Get the keys of children that should be in view */
      var childrenToRender = [];
      var exceeded = null;
      this.metrics.getItems().every(function (item) {
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

      if (!this.endOfListCallbackFired && this.props.callback && state.childrenToRender[state.childrenToRender.length - 1] === this.props.children[this.props.children.length - 1].key) {
        console.warn('Firing end of list callback');
        this.endOfListCallbackFired = true;
        setTimeout(this.props.callback, 0);
      }

      this.setState(state);

      this.rafHandle = null;
    }
  }, {
    key: 'loadChildrenWhenIdle',
    value: function loadChildrenWhenIdle(deadline) {
      console.warn('loadChildrenWhenIdle called');
      /* Still children left to do? */
      var itemsInMetrics = this.metrics.getItems().length;
      var numberOfChildren = this.props.children.length;

      /* If we're using IE's setIntermediate, instead cap iteration to 5 items */
      var iterationsStillAllowed = 5;

      if (itemsInMetrics < numberOfChildren) {
        var containerSize = this.state.containerSize;
        var breadthKey = this.state.isHorizontal ? this.props.heightKey : this.props.widthKey;
        var depthKey = this.state.isHorizontal ? this.props.widthKey : this.props.heightKey;

        if (containerSize) {
          for (var i = itemsInMetrics; i < numberOfChildren && (deadline && deadline.timeRemaining() > 0 || !deadline && iterationsStillAllowed-- > 0); i++) {
            var child = this.props.children[i];

            this.metrics.addItem(child.key, handleDimension(child.props[breadthKey], containerSize), handleDimension(child.props[depthKey], containerSize));

            this.childrenMap[child.key] = child;
          }
        }

        this.idleHandle = (window.setImmediate ? setImmediate : requestIdleCallback)(this.loadChildrenWhenIdle.bind(this));
      } else {
        console.log('Children preloading complete', this.props.children, this.metrics);
        this.idleHandle = null;

        /* Update state if we have a more accurate document length now */
        var containerDepth = this.metrics.estimateContainerDepth(numberOfChildren);
        if (containerDepth !== this.state.containerDepth) {
          console.debug('Updating new container depth ' + containerDepth + ', instead of ' + this.state.containerDepth);
          this.setState(Object.assign({}, this.metrics, { containerDepth: containerDepth }));
        }
      }
    }
  }, {
    key: 'loadChildrenIntoMetrics',
    value: function loadChildrenIntoMetrics(state, children) {
      var _this3 = this;

      var init = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

      children = children || this.props.children;
      console.warn('loadChildrenIntoMetrics - called');

      var breadthKey = state.isHorizontal ? this.props.heightKey : this.props.widthKey;
      var depthKey = state.isHorizontal ? this.props.widthKey : this.props.heightKey;

      if (children !== null && state !== null) {
        (function () {
          /* Only add children that don't already exist */
          var childrenInMetrics = _this3.metrics.getItems().length;

          children.every(function (child, i) {
            if (i < childrenInMetrics) {
              /* Only compare for differences on init of props */
              var _item = _this3.metrics.getItem(i);
              if (init || _this3.state.containerSize !== state.containerSize && (child.props[breadthKey] instanceof Function || child.props[depthKey] instanceof Function)) {
                if (child.key === _item.key && handleDimension(child.props[breadthKey], state.containerSize) === _item.breadth && handleDimension(child.props[depthKey], state.containerSize) === _item.depth) {
                  console.debug('Item ' + i + ' matches stored item');
                  return true;
                } else {
                  _this3.metrics.removeItems(i).forEach(function (item) {
                    return delete _this3.childrenMap[item.key];
                  });
                  childrenInMetrics = i;
                }
              } else {
                return true;
              }
            }

            console.log('Init new item ' + child.key);
            var item = _this3.metrics.addItem(child.key, handleDimension(child.props[breadthKey], state.containerSize), handleDimension(child.props[depthKey], state.containerSize));

            _this3.childrenMap[child.key] = child;

            return item.depthStart < state.containerEnd;
          });

          console.debug('Updated metrics object', _this3.metrics);
        })();
      }
    }
  }, {
    key: 'getChildren',
    value: function getChildren() {
      var _this4 = this;

      var children = [];

      if (this.state !== null) {
        children = this.state.childrenToRender.map(function (key) {
          /*if (!this.childrenMap[key]) {
            window.console.warn(`Couldn't find child ${key}`);
          }
          try {*/
          return _react2.default.cloneElement(_this4.childrenMap[key], { style: _this4.getItemStyle(key) });
          /*} catch (e) {
            console.error('Error cloning child', e, this.childrenMap[key], key, this.childrenMap);
          }*/
        });
      }

      return children;
    }
  }, {
    key: 'getWrapperStyle',
    value: function getWrapperStyle() {
      var style = { position: 'relative' };

      if (this.state !== null) {
        if (this.state.isHorizontal) {
          style.width = this.state.containerDepth;
          if (this.props.containerHeight) {
            style.minHeight = this.props.containerHeight + 'px';
          }
        } else {
          style.minHeight = this.state.containerDepth;
        }
      }

      return style;
    }
  }, {
    key: 'getItemStyle',
    value: function getItemStyle(key) {
      var child = this.metrics.getItemByKey(key);

      var left = child[this.state.leftKey];
      var top = child[this.state.topKey];

      var style = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: child[this.state.widthKey],
        height: child[this.state.heightKey],
        //transform: `translateX(${left}px) translateY(${top}px)`,
        transform: 'translate3d(' + left + 'px, ' + top + 'px, 0)'
      };

      return style;
    }
  }, {
    key: 'render',
    value: function render() {
      console.warn('Render');

      var style = Object.assign(this.getWrapperStyle(), this.props.style);

      return _react2.default.createElement(
        'div',
        { className: this.props.className, style: style },
        this.getChildren()
      );
    }
  }]);

  return InfinityGrid;
}(_react2.default.Component);

InfinityGrid.propTypes = {
  mode: _react2.default.PropTypes.string,
  tolerance: _react2.default.PropTypes.number,
  children: _react2.default.PropTypes.array,
  scrollTarget: _react2.default.PropTypes.any,
  containerHeight: _react2.default.PropTypes.number,
  className: _react2.default.PropTypes.string,
  style: _react2.default.PropTypes.object,
  heightKey: _react2.default.PropTypes.string,
  widthKey: _react2.default.PropTypes.string,
  callback: _react2.default.PropTypes.func
};

InfinityGrid.defaultProps = {
  mode: 'vertical',
  tolerance: 100,
  children: [],
  scrollTarget: window,
  className: 'infinity-grid',
  style: {},
  heightKey: 'height',
  widthKey: 'width'
};

function shallowCompare(one, two) {
  if (!one && !two && one == two) return true;else if (!one && !two || !one && !!two || !!one && !two) return false;

  if (one.__proto__ !== two.__proto__) {
    return false;
  }

  var keys = null;
  var oneLen = one instanceof Array ? one.length : (keys = Object.keys(one)).length;
  var twoLen = two instanceof Array ? two.length : Object.keys(two).length;

  if (oneLen !== twoLen) {
    return false;
  }

  if (keys) {
    return keys.every(function (key) {
      return one[key] === two[key];
    });
  } else {
    return one.every(function (val, i) {
      return val === two[i];
    });
  }
}

function handleDimension(dimension, viewBreadth) {
  if (dimension instanceof Function) {
    return dimension(viewBreadth);
  } else {
    return dimension;
  }
}

exports.default = InfinityGrid;