import React from 'react';
import ReactDOM from 'react-dom';
import consoleFactory from 'console-factory';
import Metrics from './Metrics';

const console = consoleFactory('ThreadedImg', 3);

const ref = new WeakMap;

function workerFn() {
  self.onmessage = function (e) {
    const url = e.data;
    const onload = () => {
        self.postMessage(xhr.response);
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
console.log(workerSrc);

const workerUrl = URL.createObjectURL(new Blob([workerSrc], { type: "text/javascript" }));

class ThreadedImg extends React.Component {
  constructor(props, context) {
    console.warn('constructed');
    super(props, context);
    this.state = { loaded: true, blob: null };

    const worker = new Worker(workerUrl);
    worker.postMessage(props.src);

    worker.onmessage = (e) => {
      console.log('worker resp', e.data);
      let blob = null;
      if (e.data) {
        blob = URL.createObjectURL(e.data);
      }
      this.setState({ loaded: true, blob });
    };
  }

  render() {
    const props = Object.assign({}, this.props);

    if (this.state.loaded) {
      if (this.state.blob !== null) {
        console.log('using blob');
        props.src = this.state.blob;
      }
      return <img {...props} data-loading={false}/>
    } else {
      delete props.src;
      return <img {...props} data-loading={true} />
    }
  }
}

export default ThreadedImg;