'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _consoleFactory = require('console-factory');

var _consoleFactory2 = _interopRequireDefault(_consoleFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var console = (0, _consoleFactory2.default)('InfinityScroller', 0);

var InfinityScroller = function (_React$Component) {
  _inherits(InfinityScroller, _React$Component);

  function InfinityScroller(props, context) {
    _classCallCheck(this, InfinityScroller);

    console.warn('constructed');

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(InfinityScroller).call(this, props, context));

    _this.state = null;
    _this.window = null;
    return _this;
  }

  _createClass(InfinityScroller, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      console.log('nextProps', nextProps);
      this.updateMetrics(nextProps);
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
      this.boundUpdateMetrics = function () {
        return _this2.updateMetrics(_this2.props);
      };
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

      if (this.state !== null) {
        var _ret = function () {
          /* Work out first child that's visible */
          var _state = _this3.state;
          var first = _state.first;
          var last = _state.last;

          console.debug('first', first);
          console.debug('last', last);

          console.log('children to display', first, last);

          if (_this3.props.component) {
            return {
              v: _this3.props.children.slice(first, last + 1).map(function (child, i) {
                return _react2.default.createElement(_this3.props.component, Object.assign(child, { style: _this3.getItemStyle(i + first) }));
              })
            };
          } else {
            return {
              v: _this3.props.children.slice(first, last + 1).map(function (child, i) {
                return _react2.default.cloneElement(child, { style: _this3.getItemStyle(i + first) });
              })
            };
          }
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      } else {
        /* First load, return nothing, as we don't have the required metrics */
        return [];
      }
    }
  }, {
    key: 'getItemStyle',
    value: function getItemStyle(i) {
      var style = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: this.props.itemWidth,
        height: this.props.itemHeight
      };
      var column = void 0;
      var row = void 0;

      switch (this.props.mode) {
        case 'horizontal':
          column = i / this.state.groupedItems >>> 0;
          row = i % this.state.groupedItems;
          break;

        default:
          row = i / this.state.groupedItems >>> 0;
          column = i % this.state.groupedItems;
      }

      var top = row * this.props.itemHeight;
      var left = column * this.props.itemWidth;

      console.debug('Position #' + i + ': row: ' + row + ', column: ' + column + ', top: ' + top + 'px, left: ' + left + 'px');

      var transform = 'translateX(' + left + 'px) translateY(' + top + 'px)';
      style.transform = transform;
      return style;
    }
  }, {
    key: 'updateMetrics',
    value: function updateMetrics(props) {
      var _this4 = this;

      console.debug('updateMetrics - called');
      props = props || this.props;

      var visibleChildren = {};

      if (props.children.length === 0) {
        visibleChildren = {
          first: null,
          last: null,
          height: null,
          width: null
        };
      } else {
        //const el = ReactDOM.findDOMNode(this);
        var info = this.el.getBoundingClientRect();

        console.log('info', info);

        var isHorizontal = props.mode === 'horizontal';

        /*
         Convert any percentages or strings to numbers
         */
        //const itemWidth = this.convertDimensionToString(props.itemHeight, info.height);
        //const itemHeight = this.convertDimensionToString(props.itemWidth, info.width);

        var metrics = {
          containerSize: isHorizontal ? info.height : info.width,
          containerOffset: isHorizontal ? info.left : info.top,
          viewSize: isHorizontal ? window.innerWidth : window.innerHeight,
          groupedItems: (isHorizontal ? info.height / props.itemHeight : info.width / props.itemWidth) >>> 0,
          itemBreadth: isHorizontal ? this.convertDimensionToString(props.itemHeight, info.height) : this.convertDimensionToString(props.itemWidth, info.width),
          itemDepth: isHorizontal ? props.itemWidth : props.itemHeight
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

      var stateChanged = this.state === null;

      if (!stateChanged) {
        var keysToCompare = ['first', 'last', 'groupedItems', 'containerSize', 'itemWidth', 'itemHeight'];

        stateChanged = keysToCompare.some(function (key) {
          return visibleChildren[key] !== _this4.state[key];
        });
      }

      if (stateChanged) {
        this.setState(visibleChildren);
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
    key: 'getWrapperStyle',
    value: function getWrapperStyle() {
      var style = { position: 'relative' };

      if (this.state !== null) {
        if (this.props.mode === 'horizontal') {
          style.width = this.state.containerSize;
          if (this.props.containerHeight) {
            style.height = this.props.containerHeight + 'px';
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
  }, {
    key: 'visibleChildren',
    value: function visibleChildren(metrics, props) {
      var items = {
        first: null,
        last: null,
        containerSize: null,
        groupedItems: null
      };

      var lastChild = props.children.length - 1;

      /*
       Work out width of container to contain all items
       */
      items.containerSize = Math.ceil(props.children.length / metrics.groupedItems) * metrics.itemDepth;

      /*
       Work out which column is the first visible one
       */
      var visibleUnitStart = -metrics.containerOffset - props.tolerance - metrics.itemDepth;

      var firstUnitInView = 0;
      if (visibleUnitStart < 0) {
        items.first = 0;
      } else {
        firstUnitInView = visibleUnitStart / metrics.itemDepth >>> 0;
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
      var visibleUnitEnd = visibleUnitStart + metrics.viewSize;
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

  return InfinityScroller;
}(_react2.default.Component);

InfinityScroller.propTypes = {
  mode: _react2.default.PropTypes.string,
  itemWidth: _react2.default.PropTypes.any,
  itemHeight: _react2.default.PropTypes.any,
  tolerance: _react2.default.PropTypes.number,
  children: _react2.default.PropTypes.array,
  scrollTarget: _react2.default.PropTypes.any,
  containerHeight: _react2.default.PropTypes.number,
  className: _react2.default.PropTypes.string,
  style: _react2.default.PropTypes.object
};

InfinityScroller.defaultProps = {
  mode: 'vertical',
  itemWidth: 150,
  itemHeight: 300,
  tolerance: 10,
  children: [],
  scrollTarget: window,
  className: 'infinity-scroller',
  style: {}
};

exports.default = InfinityScroller;