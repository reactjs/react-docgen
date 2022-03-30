import 'process';
import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import App from './components/App';
import 'codemirror/lib/codemirror.css';
import './react-docgen.less';

const container = document.getElementById('root');
const root = ReactDOMClient.createRoot(container);

root.render(<App />);
