// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu, dialog, ipcMain, shell} = require('electron')
const fs = require('fs-extra');
const path = require('path')
const isDev = require('electron-is-dev');

let mainWindow;

// Open the enclosing data folder
ipcMain.on('open_data_folder', (event, arg) => {
  shell.openItem('./src/data/'.concat(arg))
})

// Export route
ipcMain.on('export_route', (event, route) => {
  const path = dialog.showSaveDialogSync(mainWindow, {
    defaultPath: "Route.json",
    properties: ['createDirectory']
  });
  if (!path) return;

  fs.writeJson(path, route, err => {
    if (err) return console.error(err);
  })
})

function createWindow() {
  // Insert blank data file
  const data = new Uint8Array(Buffer.from('\{"sensors": [\]\}'));
  fs.writeFile('./src/data/sensors.json', data, (err) => {
    if (err) throw err;
  });

  mainWindow = new BrowserWindow({
    width: 1500, 
    height: 1000,
    webPreferences: {
      nodeIntegration: true,
      preload: __dirname + '/preload.js'
    }
  });

  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
  if (isDev) {
    // Open the DevTools.
    //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    // mainWindow.webContents.openDevTools();
  }

  const isMac = process.platform === 'darwin'

  const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        {
          label: 'Import Data',
          accelerator: 'CmdOrCtrl+O',
          click() {
            loadData();
          }
        }
      ]
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startspeaking' },
              { role: 'stopspeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron')
            await shell.openExternal('https://electronjs.org')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

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

function loadData() {
  // Opens file dialog
  const selections = dialog.showOpenDialogSync(mainWindow, {
    properties: ['openDirectory']
  });

  // If no folder
  if (!selections) return;
  // Can only pick one folder
  const folder = selections[0];
  const sensorJsonPath = folder.concat('/sensors.json');
  fs.copy(sensorJsonPath, './src/data/sensors.json');
}