const electron = require('electron');
const url = require('url');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1024, height: 768 });
  const startURL = isDev ? 'http://localhost:3000' : url.format({
    pathname: path.join(__dirname, '/client/index.html'),
    protocol: 'file:',
    slashes: true
  });

  mainWindow.loadURL(startURL);

  if (isDev) {
    // Open the DevTools.
    //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    //mainWindow.webContents.openDevTools();
  } else {
    // const { fork } = require('child_process');
    // fork(__dirname + '/server/src/index.js');
    require(__dirname + '/server/src/index.js');
  }

  mainWindow.on('closed', () => mainWindow = null);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});