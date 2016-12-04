const React = require('react');
const ReactDOM = require('react-dom');
const compta = require('./app/compta2');
const Book = compta.SingleEntryBook;
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const remote = require('electron').remote;
const dialog = remote.dialog;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const app = remote.app;

var Dialogs = require('dialogs');
var dialogs = Dialogs();

const ReactBootstrap = require('react-bootstrap');
const Row = ReactBootstrap.Row;
const Grid = ReactBootstrap.Grid;
const Col = ReactBootstrap.Col;
const Glyphicon = ReactBootstrap.Glyphicon;
const ButtonToolbar = ReactBootstrap.ButtonToolbar;
const Button = ReactBootstrap.Button;
const OverlayTrigger = ReactBootstrap.OverlayTrigger;
const Tooltip = ReactBootstrap.Tooltip;

const DatePicker = require(`react-datepicker`);

let mainBook = new Book();

const debug = true;
function say(something) {
  if (debug) console.log(something);
}

const BookEntries = require('./app/dist/book-entries');
const Balance = require('./app/dist/balance');

class App extends React.Component {

  constructor(props) {
    say('-- React App construction');
    super(props)
    // const book = new Book();
    const startDate = moment();
    startDate.startOf(`year`);
    const endDate = moment();

    const book = props.book;
    this.state = {
      book,
      startDate,
      endDate,
    };

    this.handleBalanceClickBack   = this.handleBalanceClickBack.bind(this);
    this.balance                  = this.balance.bind(this);
    this.renderNav                = this.renderNav.bind(this);
    this.handleChangeStart        = this.handleChangeStart.bind(this);
    this.handleChangeEnd          = this.handleChangeEnd.bind(this);
    this.handleChangeItemCategory = this.handleChangeItemCategory.bind(this);
  }

  componentWillReceiveProps(newProps) {
    say('-- React App will receive props...');
    this.setState({ book : newProps.book });
  }

  componentDidMount() {
    say('-- React App mounted');
  }

  balance() {
    const balance = this.state.book.balanceCategories(this.state.startDate, this.state.endDate);
    this.setState({balance});
  }

  handleBalanceClickBack() {
    this.setState({ balance : null });
  }

  handleChangeStart(date) {
    this.setState({
      startDate: date,
      balance : this.state.book.balance(date, this.state.endDate)
    });
  }
  handleChangeEnd(date) {
    this.setState({
      endDate: date,
      balance : this.state.book.balance(this.state.startDate, date)
    });
  }

  handleChangeItemCategory(entryId, newCategory) {
    const book = this.state.book;
    book.changeEntryCategory(entryId, newCategory);
    this.setState({ book });
  }

  renderNav() {
    return (
      <Grid>
        <Row className="main-nav">
          <Col className="nav-date">
            Période du
            <DatePicker
              dateFormat="DD/MM/YYYY"
              selected={this.state.startDate}
              selectsStart    startDate={this.state.startDate}
              endDate={this.state.endDate}
              onChange={this.handleChangeStart} />
            au
            <DatePicker
              dateFormat="DD/MM/YYYY"
              selected={this.state.endDate}
              selectsEnd    startDate={this.state.startDate}
              endDate={this.state.endDate}
              onChange={this.handleChangeEnd} />
          </Col>
        </Row>
      </Grid>
    )
  }

  render() {

    let balance = '';
    let entries = '';

    if (this.state.book && !this.state.balance) {
      entries = React.createElement(BookEntries, {
        startDate            : this.state.startDate,
        endDate              : this.state.endDate,
        onClickBalance       : this.balance,
        book                 : this.state.book,
        onChangeItemCategory : this.handleChangeItemCategory,
      });
    }
    if (this.state.balance) {
      balance = React.createElement(Balance, {
        startDate   : this.state.startDate,
        endDate     : this.state.endDate,
        onClickBack : this.handleBalanceClickBack,
        balance     : this.state.balance,
        book        : this.state.book,
      });
    }

    // return React.createElement(`div`, null, this.renderNav(), balance, entries, React.createElement(AppMenu));
    return (
      <div>
        {this.renderNav()}
        {balance}
        {entries}
      </div>
    )
  }
}

const utils = {};

utils.setAppMenu = function setAppMenu() {
  this.template = [
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
      // label: app.getName(),
      label: 'Compta',
      submenu: [
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
    // Edit menu.
    this.template[1].submenu.push(
      {
        type: 'separator'
      },
      {
        label: 'Speech',
        submenu: [
          {
            role: 'startspeaking'
          },
          {
            role: 'stopspeaking'
          }
        ]
      }
    )
    // Window menu.
    this.template[3].submenu = [
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
      book: null,
      balance: null,
      currentFileName : false,
    }

    utils.setAppMenu.bind(this)();
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
    ReactDOM.render(<App book={this.state.book} />, document.getElementById('app'));
    say(`### done rendering`);
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
    const config = fs.readFileSync(path.join(__dirname, `compta-config.json`), `utf8`);
    say(config);
    if (config) {
      try { this.config = JSON.parse(config) }
      catch (e) {
        say(e);
        this.config = {};
      }
    }
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
desktopApp.renderApp();


// app.on('will-quit', this.saveConfig);
const currentWindow = remote.getCurrentWindow();
currentWindow.on(`close`, () => {
  // desktopApp.saveConfig();
  // currentWindow = null;
});
