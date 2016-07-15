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

    _this.mapChildrenByKey(props.children);
    return _this;
  }

  _createClass(InfinityGrid, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      console.warn('nextProps', nextProps);

      this.mapChildrenByKey(nextProps.children);

      this.updateMetrics(nextProps);
    }
  }, {
    key: 'mapChildrenByKey',
    value: function mapChildrenByKey(children) {
      var _this2 = this;

      this.childrenMap = {};

      children.forEach(function (child) {
        return _this2.childrenMap[child.key] = child;
      });
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this3 = this;

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
      this.boundUpdateMetrics = function () {
        return _this3.updateMetrics();
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
        window.addEventListener('resize', this.boundUpdateMetrics);
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

      this.setState(state);
    }
  }, {
    key: 'loadChildrenIntoMetrics',
    value: function loadChildrenIntoMetrics(state, children) {
      var _this4 = this;

      var init = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

      children = children || this.props.children;
      console.warn('loadChildrenIntoMetrics - called');

      var breadthKey = state.isHorizontal ? 'height' : 'width';
      var depthKey = state.isHorizontal ? 'width' : 'height';

      if (children !== null && state !== null) {
        (function () {
          /* Only add children that don't already exist */
          var childrenInMetrics = _this4.metrics.getItems().length;

          children.every(function (child, i) {
            if (i < childrenInMetrics) {
              /* Only compare for differences on init of props */
              var _item = _this4.metrics.getItem(i);
              if (init || _this4.state.containerSize !== state.containerSize && (child.props[breadthKey] instanceof Function || child.props[depthKey] instanceof Function)) {
                if (child.key === _item.key && handleDimension(child.props[breadthKey], state.containerSize) === _item.breadth && handleDimension(child.props[depthKey], state.containerSize) === _item.depth) {
                  console.debug('Item ' + i + ' matches stored item');
                  return true;
                } else {
                  _this4.metrics.removeItems(i);
                  childrenInMetrics = i;
                }
              } else {
                return true;
              }
            }

            var item = _this4.metrics.addItem(child.key, handleDimension(child.props[breadthKey], state.containerSize), handleDimension(child.props[depthKey], state.containerSize));
            console.log('Added new child to metrics', item);

            return item.depthStart < state.containerEnd;
          });

          console.debug('Updated metrics object', _this4.metrics);
        })();
      }
    }
  }, {
    key: 'getChildren',
    value: function getChildren() {
      var _this5 = this;

      var children = [];

      if (this.state !== null) {
        children = this.state.childrenToRender.map(function (key) {
          return _react2.default.cloneElement(_this5.childrenMap[key], { style: _this5.getItemStyle(key) });
        });
      }

      return children;
    }
  }, {
    key: 'getWrapperStyle',
    value: function getWrapperStyle() {
      var style = { position: 'relative' };

      var minDepth = this.metrics.estimateContainerDepth(this.props.children.length);

      if (this.state !== null) {
        if (this.state.isHorizontal) {
          style.width = minDepth;
          if (this.props.containerHeight) {
            style.height = this.props.containerHeight + 'px';
          }
        } else {
          style.height = minDepth;
        }
      }

      return style;
    }
  }, {
    key: 'getItemStyle',
    value: function getItemStyle(key) {
      var child = this.metrics.getItemByKey(key);

      var style = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: child[this.state.widthKey],
        height: child[this.state.heightKey],
        transform: 'translateX(' + child[this.state.leftKey] + 'px) translateY(' + child[this.state.topKey] + 'px)'
      };

      return style;
    }
  }, {
    key: 'render',
    value: function render() {
      console.warn('Rendering', this.state !== null ? this.state.childrenToRender : null);
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
  widthKey: _react2.default.PropTypes.string
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