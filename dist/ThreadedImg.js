'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

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

var console = (0, _consoleFactory2.default)('ThreadedImg', 3);

var ref = new WeakMap();

function workerFn() {
  self.onmessage = function (e) {
    var url = e.data;
    var onload = function onload() {
      self.postMessage(xhr.response);
      self.close();
    };

    var xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = xhr.onerror = onload;
    xhr.open('GET', url, true);
    xhr.send();
  };
}

var URL = window.URL || window.webkitURL;
var workerSrc = workerFn.toString();
workerSrc = workerSrc.substr(workerSrc.indexOf('{') + 1);
workerSrc = workerSrc.substr(0, workerSrc.lastIndexOf('}'));
console.log(workerSrc);

var workerUrl = URL.createObjectURL(new Blob([workerSrc], { type: "text/javascript" }));

var ThreadedImg = function (_React$Component) {
  _inherits(ThreadedImg, _React$Component);

  function ThreadedImg(props, context) {
    _classCallCheck(this, ThreadedImg);

    console.warn('constructed');

    var _this = _possibleConstructorReturn(this, (ThreadedImg.__proto__ || Object.getPrototypeOf(ThreadedImg)).call(this, props, context));

    _this.state = { loaded: true, blob: null };

    var worker = new Worker(workerUrl);
    worker.postMessage(props.src);

    worker.onmessage = function (e) {
      console.log('worker resp', e.data);
      var blob = null;
      if (e.data) {
        blob = URL.createObjectURL(e.data);
      }
      _this.setState({ loaded: true, blob: blob });
    };
    return _this;
  }

  _createClass(ThreadedImg, [{
    key: 'render',
    value: function render() {
      var props = Object.assign({}, this.props);

      if (this.state.loaded) {
        if (this.state.blob !== null) {
          console.log('using blob');
          props.src = this.state.blob;
        }
        return _react2.default.createElement('img', _extends({}, props, { 'data-loading': false }));
      } else {
        delete props.src;
        return _react2.default.createElement('img', _extends({}, props, { 'data-loading': true }));
      }
    }
  }]);

  return ThreadedImg;
}(_react2.default.Component);

exports.default = ThreadedImg;