const React          = require('react');
const ReactDOM       = require('react-dom');
const compta         = require('./app/compta2');
const Book           = compta.SingleEntryBook;
const fs             = require('fs');
const path           = require('path');
const moment         = require('moment');
const remote         = require('electron').remote;
const dialog         = remote.dialog;
const Menu           = remote.Menu;
const MenuItem       = remote.MenuItem;
const app            = remote.app;
const dialogs        = require('dialogs')();
// var Dialogs       = require('dialogs');
// var dialogs       = Dialogs();
const ReactBootstrap = require('react-bootstrap');
const Row            = ReactBootstrap.Row;
const Grid           = ReactBootstrap.Grid;
const Col            = ReactBootstrap.Col;
const Glyphicon      = ReactBootstrap.Glyphicon;
const ButtonToolbar  = ReactBootstrap.ButtonToolbar;
const Button         = ReactBootstrap.Button;
const OverlayTrigger = ReactBootstrap.OverlayTrigger;
const Tooltip        = ReactBootstrap.Tooltip;
const Form           = ReactBootstrap.Form;
const FormGroup      = ReactBootstrap.FormGroup;
const ControlLabel   = ReactBootstrap.ControlLabel;
const FormControl    =   ReactBootstrap.FormControl;

const DatePicker     = require(`react-datepicker`);
const BookEntries    = require('./app/dist/book-entries');
const Balance        = require('./app/dist/balance');
const Compta         = require('./app/dist/compta.js');
const NewEntryForm         = require('./app/dist/new-entry-form.js');
// let mainBook      = new Book();

const debug = true;
function say(something) {
  if (debug) console.log(something);
}



const setAppMenu = function setAppMenu() {
  this.template = [
    {
      label: 'File',
      submenu: [
        {
          label : 'New',
          click : () => this.newBook(),
        },
        {
          label : 'Open',
          click : () => this.openBook(),
        },
        {
          label : 'Import From ING',
          click : () => this.parseFromIng(),
        },
        {
          label : 'Save',
          click : () => this.save(),
          accelerator: 'CmdOrCtrl+S',
        },
        {
          label : 'Save as...',
          click : () => this.saveAs(),
        },
        {
          type: 'separator'
        },
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          role: 'undo'
        },
        {
          role: 'redo'
        },
        {
          type: 'separator'
        },
        {
          role: 'cut'
        },
        {
          role: 'copy'
        },
        {
          role: 'paste'
        },
        {
          role: 'pasteandmatchstyle'
        },
        {
          role: 'delete'
        },
        {
          role: 'selectall'
        }
      ]
    },
    {
        label : 'Accounting',
        submenu : [
          {
            label : 'Add entry',
            click : () => this.showAddEntryPrompt(),
          },
          {
            label : 'Balance',
            click : () => this.balance(),
          },
          {
            label : 'Import entries',
            click : () => this.importEntries(),
          }
        ]
      },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click (item, focusedWindow) {
            if (focusedWindow) focusedWindow.reload()
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click (item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools()
          }
        },
        {
          type: 'separator'
        },
        {
          role: 'resetzoom'
        },
        {
          role: 'zoomin'
        },
        {
          role: 'zoomout'
        },
        {
          type: 'separator'
        },
        {
          role: 'togglefullscreen'
        }
      ]
    },
    {
      role: 'window',
      submenu: [
        {
          role: 'minimize'
        },
        {
          role: 'close'
        }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click () { require('electron').shell.openExternal('http://electron.atom.io') }
        }
      ]
    }
  ]

  if (process.platform === 'darwin') {
    this.template.unshift({
      label: 'Compta',
      submenu: [

        {
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          role: 'hide'
        },
        {
          role: 'hideothers'
        },
        {
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
      ]
    })
    // Window menu.
    this.template[5].submenu = [
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
      },
      {
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
      },
      {
        label: 'Zoom',
        role: 'zoom'
      },
      {
        type: 'separator'
      },
      {
        label: 'Bring All to Front',
        role: 'front'
      }
    ]
  }
  this.menu = Menu.buildFromTemplate(this.template);
  Menu.setApplicationMenu(this.menu);
}




class DesktopApp {
  constructor() {
    this.state = {
      book                : null,
      balance             : null,
      currentFileName     : false,
      newEntryModalOpened : false,
    }

    setAppMenu.bind(this)();

    this.handleAddEntry = this.handleAddEntry.bind(this);
  }

  refreshTitle() {
    var fileName = this.state.currentFileName;
    if (!fileName) fileName = 'Compta';
    document.querySelector('title').innerHTML = `Compta - ${path.basename(fileName)}`;
  }

  setState(newState) {
    say(`### DA setState`);
    Object.assign(this.state, newState);

    this.renderApp();
  }

  renderApp() {
    say(`### Rendering React App...`);
    const dateFormat = this.config.dateFormat || 'YYYY-MM-DD';
    ReactDOM.render(
      <Compta
        book={this.state.book}
        dateFormat={dateFormat}
        newEntryModalOpened={this.state.newEntryModalOpened}
        requestCloseNewEntryModal={this.hideAddEntryPrompt.bind(this)}
        onAddEntry={this.handleAddEntry}
      />
      , document.getElementById('app'));
    say(`### done rendering`);
  }

  handleAddEntry(label, amount, date) {
    console.log(label);
    console.log(amount);
    console.log(date.toDate());
    const book = this.state.book;
    book.addLine(label, date.toISOString(), amount, 'unknown');
    console.log(book);
    this.setState({
      book,
      newEntryModalOpened : false,
    })
  }

  newBook() {
    this.setState({
      book : new Book(),
      balance : false,
      currentFileName : null,
    })
    this.refreshTitle();
  }

  showAddEntryPrompt() {
    this.setState({
      newEntryModalOpened : true,
    })
  }

  hideAddEntryPrompt() {
    this.setState({
      newEntryModalOpened : false,
    })
  }

  openBook(file) {
    say(`### Opening Book ${file}`);
    if (!file) {
      dialog.showOpenDialog(fileNames => {
        if (!fileNames){
          say("No files selected");
          return;
        }
        const fileName = fileNames.pop();
        const book = new Book();
        say(`Loading ${fileName}`);
        book.load(fs.readFileSync(fileName, `utf8`));
        say(`Loaded`);
        this.setState({
          book,
          balance : false,
          currentFileName : fileName,
        });
        this.refreshTitle();
        this.saveConfig();
      });
    } else {
      if (!fs.existsSync(file)) {
        say(`Given File does not exists, aborting...`);
        return;
      }
      const book = new Book();
      say(`Loading ${file}`);
      book.load(fs.readFileSync(file, `utf8`));
      say(`Loaded`);
      this.setState({
        book,
        balance : false,
        currentFileName : file,
      });
      this.refreshTitle();
      this.saveConfig();
    }
    say(`### End opening book`);
  }

  parseFromIng(file) {
    let fileName = '';
    if (!file) {
      dialog.showOpenDialog(fileNames => {
        fileName = fileNames.pop();
        say(fileName);
        if (fileName === undefined){
          say("Unable to open file");
          return;
        }

        // mainBook = compta.parseING(fileName);
        const content  = fs.readFileSync(fileName, `utf8`);
        const mainBook = compta.importers.ing_csv(content);
        this.setState({book : mainBook, balance : null, currentFileName : false,});
        //ReactDOM.render(<App book={mainBook}/>, document.getElementById('app'));
        this.refreshTitle();
      });
    } else {
      fileName = file;
      const content  = fs.readFileSync(fileName, `utf8`);
      const mainBook = compta.importers.ing_csv(content);
      //ReactDOM.render(<App book={mainBook}/>, document.getElementById('app'));
      this.setState({book : mainBook, balance : null, currentFileName : false,});
      this.refreshTitle();
    }
  }

  saveConfig() {
    say(`### Saving config...`);
    if (this.state.currentFileName) this.config.lastOpenedFile = this.state.currentFileName;
    else this.config.lastOpenedFile = null;
    fs.writeFileSync(path.join(__dirname, `compta-config.json`), JSON.stringify(this.config));
    say(`### Config saved`);
  }

  loadConfig() {
    say(`### Loading configuration...`);
    let config = null;
    try { config = fs.readFileSync(path.join(__dirname, `compta-config.json`), `utf8`); }
    catch (e) {
      say(e);
      this.config = {};
    }

    say(config);
    if (config) {
      try { this.config = JSON.parse(config) }
      catch (e) {
        say(e);
        this.config = {};
      }
    } else { this.config = {} }

    if (this.config.lastOpenedFile) {
      say(`Opening Last File...`);
      this.openBook(this.config.lastOpenedFile);
    }
    say(`### Configuration loaded...`);
  }

  save(forceDialog = false) {
    say(`###Saving file...`);
    if (!forceDialog && this.state.currentFileName) {
      say(`saving automaticaly (no dialog), file name :`);
      say(this.state.currentFileName);
      const oldContent = fs.readFileSync(this.state.currentFileName, `utf8`);
      const time = Date.now();
      const oldFileName = path.basename(this.state.currentFileName, `.json`) + time.toString() + `.json`;
      const oldFilePath = path.join(__dirname, `history`, oldFileName);
      fs.writeFileSync(oldFilePath, oldContent);
      fs.writeFileSync(this.state.currentFileName, this.state.book.save());
      return;
    }
    dialog.showSaveDialog(fileName => {
      if (!fileName) {
        say(`No file name selected, aborting...`);
        return;
      }
      say('writing file...');
      fs.writeFileSync(fileName, this.state.book.save());
      this.setState({
        currentFileName : fileName,
      });
      this.refreshTitle();
    })
    say(`End saving file`);
  }

  saveAs() {
    this.save(true);
  }

  dumpBook() {
    mainBook.print();
  }

  importEntries() {
    dialog.showOpenDialog(fileNames => {
      if (!fileNames){
        say("Unable to open file");
        return;
      }
      const fileName = fileNames.pop();
      const importBook = new Book();
      importBook.load(fs.readFileSync(fileName, `utf8`));
      const book = this.state.book;
      book.mergeBook(importBook);
      this.setState({
        book,
        balance : false,
        currentFileName : false,
      });
      this.refreshTitle();
    });
  }

}

const desktopApp = new DesktopApp();
desktopApp.loadConfig();

// app.on('will-quit', this.saveConfig);
// const currentWindow = remote.getCurrentWindow();
// currentWindow.on(`close`, () => {
//   desktopApp.saveConfig();
// });
