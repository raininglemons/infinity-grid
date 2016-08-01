'use strict';

var _templateObject = _taggedTemplateLiteral(['', ''], ['', '']);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _server = require('react-dom/server');

var _InfinityGrid = require('./InfinityGrid');

var _InfinityGrid2 = _interopRequireDefault(_InfinityGrid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

require('es6-promise').polyfill();
require('isomorphic-fetch');

var headers = { 'Authorization': 'Client-ID 72040b1621ff486' };

function imgur(str) {
  var page = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

  return 'https://api.imgur.com/3/gallery/hot/viral/' + page;
}

var columns = 4;
var i = 0;
var minWidth = 250;

function getColumns(viewWidth) {
  return viewWidth / minWidth >>> 0 || 1;
}

function width(viewWidth) {
  return viewWidth / getColumns(viewWidth);
}

function renderChildren() {
  var iOffset = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

  if (iOffset > 50) {
    return;
  }

  fetch(imgur(_templateObject, i++), { headers: headers }).then(function (resp) {
    return resp.json();
  }).then(function (resp) {
    return resp.data || [];
  }).then(function (data) {
    var filteredData = data.filter(function (img) {
      return !!img.height;
    }).filter(function (img) {
      return img.link.indexOf('gif') === -1;
    });

    children = children.concat.apply(children, filteredData);

    return children;
  }).then(function (data) {
    return data.length && cb(data.filter(function (img) {
      return !!img.height;
    }).map(function (img, i) {
      var ratio = (img.height || img.cover_height) / (img.width || img.cover_width);

      function height(viewWidth) {
        return viewWidth * ratio / getColumns(viewWidth);
      }

      var thumbnailSuffix = getThumbnailSuffix(ratio);

      return _react2.default.createElement(
        'div',
        { key: i, itemWidth: width, itemHeight: height, id: i },
        _react2.default.createElement(
          'figure',
          null,
          _react2.default.createElement(
            'a',
            { href: '//imgur.com/gallery/' + img.id },
            _react2.default.createElement('img', {
              src: img.link.replace(/\.(jpg|png)$/, thumbnailSuffix + '.$1'),
              style: { width: '100%' }
              /*onLoad={function (e) {
                e.target.parentNode.parentNode.className = 'loaded'
              }}*/
            }),
            _react2.default.createElement(
              'h3',
              null,
              img.title
            )
          )
        )
      );
    }));
  }).catch(function (e) {
    return console.error(e);
  });
}

function getThumbnailSuffix(ratio) {
  // return 'b';
  if (ratio <= 1) {
    return 't';
  } else if (ratio <= 2) {
    return 'm';
  } else if (ratio <= 4) {
    return 'l';
  } else if (ratio <= 6.4) {
    return 'h';
  }
  return '';
}

var children = [];

function cb(renderedChildren) {
  /* */
  if (typeof window === 'undefined') {
    /* SERVER */
    console.log((0, _server.renderToString)(_react2.default.createElement(
      _InfinityGrid2.default,
      {
        tolerance: 400,
        callback: function callback() {
          return renderChildren(Math.ceil(children.length / 60));
        }
        /* scrollTarget='parent' */
        , widthKey: 'itemWidth',
        heightKey: 'itemHeight'
      },
      renderedChildren
    )));
  } else {
    /* BROWSER */
    (0, _reactDom.render)(
    /*<div style={({
     width: '100%',
     height: '100%',
     overflow: 'auto',
     position: 'absolute',
     top: 0,
     left: 0,
     })}>*/
    _react2.default.createElement(
      _InfinityGrid2.default,
      {
        tolerance: 400,
        callback: function callback() {
          return renderChildren(Math.ceil(children.length / 60));
        }
        /* scrollTarget='parent' */
        , widthKey: 'itemWidth',
        heightKey: 'itemHeight'
      },
      renderedChildren
    )
    /*</div>*/
    , document.getElementById('app'));
    /* */
  }
}

renderChildren();