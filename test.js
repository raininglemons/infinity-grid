import React from 'react';
import { render } from 'react-dom';

import InfinityGrid from './src/InfinityGrid';

const props = [
  [200, 200],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
  [100, 100],
];

function renderChildren() {
  return props.map((child, i) => {
    return <div key={i} className='item' height={child[0]} width={child[1]}>
      <p>#{i}</p>
      <p>Height: {child[0]}</p>
      <p>Width: {child[1]}</p>
    </div>
  })
}

render(
  <InfinityGrid>
    {renderChildren()}
  </InfinityGrid>,
  document.getElementById('app')
);