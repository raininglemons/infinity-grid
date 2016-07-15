import React from 'react';
import { render } from 'react-dom';

import InfinityGrid from './src/InfinityGrid2';

const props = [
  [300, 300],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [30, 300],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [100, 200],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [300, 300],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [30, 300],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [100, 200],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [300, 300],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [30, 300],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [100, 200],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [300, 300],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [30, 300],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [100, 200],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [300, 300],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [30, 300],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [100, 200],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [300, 300],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [30, 300],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [100, 200],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [300, 300],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [30, 300],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [100, 200],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [300, 300],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [30, 300],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [100, 200],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
  [150, 150],
];

function randomPixel (min, max) {
  return Math.round(Math.random() * (max - min)) + min;
}

const randomProps = new Array(2000)
  .fill(null)
  .map(_ => [randomPixel(50, 200), randomPixel(50, 200)]);

/*
function renderChildren() {
  return randomProps.concat(props).concat(props).concat(props).concat(props).concat(props).concat(props).concat(props)
    .concat(props).concat(props).concat(props).concat(props).concat(props).concat(props).concat(props).concat(props)
    .concat(props).concat(props).concat(props).concat(props).concat(props).concat(props).concat(props).concat(props)
    .map((child, i) => {
    return <div key={i} className='item' height={child[0]} width={child[1]}>
      <p>#{i}</p>
      <p>Height: {child[0]}</p>
      <p>Width: {child[1]}</p>
    </div>
  })
} */
function renderChildren() {
  function featured(width) {
    return width / 2;
  }

  function normal(width) {
    return width / 4;
  }

  return [false, false, true].concat(new Array(5000).fill(false)).map((isFeatured, i) => {
    return <div key={i} className='item' height={isFeatured ? featured : normal} width={isFeatured ? featured : normal}>
      <p>#{i}</p>
    </div>
  })
}

/*
render(
  <div>
    {renderChildren()}
  </div>,
  document.getElementById('app')
);
/* */

/*
render(
  <InfinityGrid tolerance={100}>
    {renderChildren()}
  </InfinityGrid>,
  document.getElementById('app')
);
/* */

/* */
render(
  <div>
    {new Array(10).fill(null).map((n, i) => {
      return <div className="horizontal-infinite-scroll" key={i}>
        <InfinityGrid
          tolerance={200}
          mode='horizontal'
          containerHeight={300}
          scrollTarget='parent'
        >
          {renderChildren()}
        </InfinityGrid>
      </div>;
    })}
    </div>,
document.getElementById('app')
);
/* */