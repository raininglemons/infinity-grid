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

var console = (0, _consoleFactory2.default)('InfinityGrid', 1);

var InfinityGrid = function (_React$Component) {
  _inherits(InfinityGrid, _React$Component);

  function InfinityGrid(props, context) {
    _classCallCheck(this, InfinityGrid);

    console.warn('constructed');

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(InfinityGrid).call(this, props, context));

    _this.state = null;
    _this._childrenToRender = [];
    _this.metrics = new _Metrics2.default();
    return _this;
  }

  _createClass(InfinityGrid, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      console.warn('nextProps', nextProps);

      this.loadChildrenIntoMetrics(this.props.children, true);
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
      this.boundUpdateMetrics = function () {
        return _this2.updateMetrics();
      };
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
  }, {
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate(nextProps, nextState) {
      /*
      Work out which children will be rendered in the next view now. Compare
      against the previously rendered children, if theres no change, do nothing
       */
      this.loadChildrenIntoMetrics();
      var children = this.childrenToRender();

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
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      console.debug('componentWillUnmount');

      /*
       Remember offset of scroll window (if not document window)
       */
      if (this.scrollTarget !== window) {
        this.containerOffset = {
          top: this.scrollTarget.scrollTop,
          left: this.scrollTarget.scrollLeft
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
  }, {
    key: 'getChildren',
    value: function getChildren() {
      var _this3 = this;

      return this._childrenToRender.map(function (child) {
        return _react2.default.cloneElement(child, { style: _this3.getItemStyle(child.key) });
      });
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
    key: 'loadChildrenIntoMetrics',
    value: function loadChildrenIntoMetrics(children) {
      var _this4 = this;

      var init = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

      children = children || this.props.children;
      console.warn('loadChildrenIntoMetrics - called');

      var breadthKey = this.props.mode === 'horizontal' ? 'height' : 'width';
      var depthKey = this.props.mode === 'horizontal' ? 'width' : 'height';

      if (children !== null && this.state !== null) {
        (function () {
          /* Only add children that don't already exist */
          var childrenInMetrics = _this4.metrics.getItems().length;

          children.every(function (child, i) {
            if (i < childrenInMetrics) {
              /* Only compare for differences on init of props */
              if (init) {
                var _item = _this4.metrics.getItem(i);
                if (child.key === _item.key && child.props[breadthKey] === _item.breadth && child.props[depthKey] === _item.depth) {
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

            var item = _this4.metrics.addItem(child.key, child.props[breadthKey], child.props[depthKey]);
            console.log('Added new child to metrics', item);

            return item.depthStart < _this4.state.containerEnd;
          });

          console.debug('Updated metrics object', _this4.metrics);
        })();
      }
    }
  }, {
    key: 'updateMetrics',
    value: function updateMetrics(props) {
      var _this5 = this;

      console.warn('updateMetrics - called');
      props = props || this.props;

      var info = this.el.getBoundingClientRect();

      console.log(info);

      var isHorizontal = props.mode === 'horizontal';

      var state = null;

      if (isHorizontal) {
        state = {
          isHorizontal: true,
          containerSize: info.height,
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

      var stateChanged = this.state === null || Object.keys(state).some(function (key) {
        return _this5.state[key] !== state[key];
      });

      console.debug('State changed?', stateChanged, state);

      if (stateChanged) {
        this.metrics.setViewBreadth(state.containerSize);
        this.setState(state);
      }
    }
  }, {
    key: 'convertDimensionToString',
    value: function convertDimensionToString(dimension, context) {
      console.log(dimension, context);
      if (typeof dimension === 'string') {
        var regexMatch = null;
        if ((regexMatch = dimension.match(/([0-9]+)%/)) !== null) {
          console.warn('itemBreadth is percentage', regexMatch);
          return parseFloat(regexMatch[0]) / 100 * context;
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
  }, {
    key: 'childrenToRender',
    value: function childrenToRender() {
      var _this6 = this;

      if (this.state !== null) {
        return this.props.children.filter(function (child, i) {
          var item = _this6.metrics.getItem(i);
          return item && item.depthStart < _this6.state.containerEnd && item.depthEnd > _this6.state.containerStart;
        });
      } else {
        return [];
      }
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
    key: 'render',
    value: function render() {
      console.debug('render', this);
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
  itemWidth: _react2.default.PropTypes.any,
  itemHeight: _react2.default.PropTypes.any,
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
  tolerance: 200,
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

exports.default = InfinityGrid;