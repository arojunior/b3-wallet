import React from 'react';
import ReactDOM from 'react-dom';
import './assets/css/index.css';
import HomeContainer from './pages/home/home.container';
import HomeComponent from './pages/home/home.component';

ReactDOM.render(<HomeContainer Component={HomeComponent} />, document.getElementById(`root`));
