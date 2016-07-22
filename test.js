import React from 'react';
import { render } from 'react-dom';
import { renderToString } from 'react-dom/server';
require('es6-promise').polyfill();
require('isomorphic-fetch');

import InfinityGrid from './src/InfinityGrid';
// import ThreadedImg from './src/ThreadedImg';

/*function workerFn() {
  self.onmessage = function (e) {
    const url = e.data;
    const onload = () => {
      self.postMessage(true);
      self.close();
    };

    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = xhr.onerror = onload;
    xhr.open('GET', url, true);
    xhr.send();
  };
}

const URL = window.URL || window.webkitURL;
let workerSrc = workerFn.toString();
workerSrc = workerSrc.substr(workerSrc.indexOf('{') + 1);
workerSrc = workerSrc.substr(0, workerSrc.lastIndexOf('}'));
//console.log(workerSrc);

const workerUrl = URL.createObjectURL(new Blob([workerSrc], { type: "text/javascript" }));

function preload(url) {
  const worker = new Worker(workerUrl);
  worker.postMessage(url);
}
*/

const headers = { 'Authorization': 'Client-ID 72040b1621ff486' };

function imgur(str, page = 0) {
  return `https://api.imgur.com/3/gallery/hot/viral/${page}`
}

let columns = 4;
let i = 0;
const minWidth = 250;

function getColumns(viewWidth) {
  return viewWidth / minWidth >>> 0 || 1;
}

function width(viewWidth) {
  return viewWidth / getColumns(viewWidth);
}

function renderChildren(iOffset = 0) {
  if (iOffset > 50) {
    return;
  }

  fetch(imgur`${i++}`, { headers })
    .then(resp => resp.json())
    .then(resp => resp.data || [])
    .then(data => {
      const filteredData = data.filter(img => !!img.height)
        .filter(img => img.link.indexOf('gif') === -1);

      children = children.concat.apply(children, filteredData);

      return children;
    })
    .then(data => data.length && cb(
      data.filter(img => !!img.height)
        .map((img, i) => {
          const ratio = (img.height || img.cover_height) / (img.width || img.cover_width);

          function height(viewWidth) {
            return viewWidth * ratio / getColumns(viewWidth);
          }

          const thumbnailSuffix = getThumbnailSuffix(ratio);

          return <div key={i} itemWidth={width} itemHeight={height} id={i}>
            <figure>
              <a href={`//imgur.com/gallery/${img.id}`}>
                <img
                  src={img.link.replace(/\.(jpg|png)$/, `${thumbnailSuffix}.$1`)}
                  style={({ width: '100%' })}
                  /*onLoad={function (e) {
                    e.target.parentNode.parentNode.className = 'loaded'
                  }}*/
                />
                <h3>{img.title}</h3>
              </a>
            </figure>
          </div>;
        })
    ));
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

let children = [];

function cb(renderedChildren) {
  /* */
  if (typeof window === 'undefined') {
    /* SERVER */
    console.log(renderToString(<InfinityGrid
      tolerance={400}
      callback={() => renderChildren(Math.ceil(children.length / 60))}
      /* scrollTarget='parent' */
      widthKey='itemWidth'
      heightKey='itemHeight'
    >
      {renderedChildren}
    </InfinityGrid>));
  } else {
    /* BROWSER */
    render(
      /*<div style={({
       width: '100%',
       height: '100%',
       overflow: 'auto',
       position: 'absolute',
       top: 0,
       left: 0,
       })}>*/
      <InfinityGrid
        tolerance={400}
        callback={() => renderChildren(Math.ceil(children.length / 60))}
        /* scrollTarget='parent' */
        widthKey='itemWidth'
        heightKey='itemHeight'
      >
        {renderedChildren}
      </InfinityGrid>
      /*</div>*/,
      document.getElementById('app')
    );
    /* */
  }
}

renderChildren();