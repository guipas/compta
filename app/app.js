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

// const {dialog, Menu, MenuItem, app} = require('electron').remote;
var Chart = require('react-d3-core').Chart;
var Dialogs = require('dialogs');
var dialogs = Dialogs();
// require `react-d3-basic` for Line chart component.
// var LineChart = require('react-d3-basic').LineChart;
var rd3 = require('rd3');
var PieChart = rd3.PieChart

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


class BookEntries extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      entries : props.book.entries,
      dateSortDirection : 1,
      categories : this.sortCategories(props.book.getCategories()),
      filteredCategory : ``,
    };

    this.renderList = this.renderList.bind(this);
    this.onClickBalance = this.onClickBalance.bind(this);
    this.renderListHeader = this.renderListHeader.bind(this);
    this.sortByDate = this.sortByDate.bind(this);
    this.renderCategoriesOptions = this.renderCategoriesOptions.bind(this);
    this.changeCategory = this.changeCategory.bind(this);
    this.filterCategory = this.filterCategory.bind(this);
    this.renderFilterCategory = this.renderFilterCategory.bind(this);
    this.sortCategories = this.sortCategories.bind(this);
  }

  componentDidMount() {
    // console.log(`Book entries mounted`);

  }

  sortCategories(categories) {
    return categories.sort((a,b) => {
      if(a.toLowerCase() < b.toLowerCase()) return -1;
      if(a.toLowerCase() > b.toLowerCase()) return 1;
      return 0;
    });
  }

  componentWillReceiveProps(nextProps) {
    // console.log(nextProps);
    let categories = nextProps.book.getCategories();
    categories = this.sortCategories(categories);
    this.setState({
      entries : nextProps.book.entries,
      categories,
    });
  }

  renderCategoriesOptions(addNew = true) {
    const options = this.state.categories.map((category,i) => {
      return React.createElement(`option`, { key : i, value : category }, category);
    });
    if (addNew) options.push(React.createElement(`option`, { key : `addnew`, value : `addNewCategory`}, `Create...`));
    return options;
  }


  changeCategory(entryId, event) {
    let newCategory = event.target.value;
    if (newCategory === `addNewCategory`) {
      dialogs.prompt(`Name of the new category : `, (newCategory) => {
        if (!newCategory) return;
        if (this.props.onChangeItemCategory)
          this.props.onChangeItemCategory(entryId, newCategory);
      });
    } else {
      if (this.props.onChangeItemCategory)
        this.props.onChangeItemCategory(entryId, newCategory);
    }
  }

  renderList() {
    if (!this.state || !this.state.entries) return null;
    return this.state.entries.map((entry, i) => {
      if (this.props.startDate && this.props.endDate && !moment(entry.date).isBetween(this.props.startDate, this.props.endDate)) return;
      if (this.state.filteredCategory !== `` &&  entry.category.indexOf(this.state.filteredCategory) !== 0) return;
      // if (this.state.filteredCategory !== `` && this.state.filteredCategory !== entry.category) return;
      // const tooltip = (<Tooltip className="tooltip" id="entry-tooltip-{i}">{entry.label}</Tooltip>);
      const tooltip = React.createElement(Tooltip, { className : `tooltip`, id : `entry-tooltip-${i}`}, entry.label);
      const entryDate = React.createElement(
        Col,
        { xs : 6, className : `entry-date` },
        moment(entry.date).format('DD/MM/YYYY'),
        React.createElement(
          `div`,
          { className : `entry-name` },
          React.createElement(
            OverlayTrigger,
            { placement : `bottom`, overlay : tooltip },
            React.createElement(`span`, null, entry.label.slice(0,28), entry.label.length > 28 ? `...` : ``),
          )
        )
      );
      const entryCategory = React.createElement(
        Col,
        { xs : 4, className : `entry-category`},
        React.createElement(
          `select`,
          { value : entry.category, onChange : this.changeCategory.bind(this, entry.id) },
          this.renderCategoriesOptions(),
        )
      );
      const entryAmount = React.createElement(
        Col,
        { xs : 2, className : `entry-amount` },
        entry.amount.toFixed(2),
      )
      return React.createElement(
        Row,
        null,
        entryDate,
        entryCategory,
        entryAmount,
      );
    })
  }

  sortByDate() {
    this.setState({
      entries : this.state.entries.sort((a,b) => {
        const x = moment(a.date);
        const y = moment(b.date);
        const compare = (x.valueOf() - y.valueOf()) * this.state.dateSortDirection;
        return compare;
      }),
      dateSortDirection : this.state.dateSortDirection * -1,
    })
  }

  renderListHeader() {
    return (
      <Row className="list-header">
        <Col xs={6} className="entry-date" onClick={this.sortByDate}>Date</Col>
        <Col xs={4} className="entry-category" >Category</Col>
        <Col xs={2} className="entry-amount">Amount</Col>
      </Row>
    )
  }

  filterCategory(event) {
    // console.log(event.target.value);
    this.setState({ filteredCategory : event.target.value })
  }

  renderFilterCategory() {
    const options = this.renderCategoriesOptions(false);
    options.unshift((<option key="all" value="">Tout</option>));
    return (
      <select onChange={this.filterCategory}>
        {options}
      </select>
    )
  }

  onClickBalance() {
    if (this.props.onClickBalance) this.props.onClickBalance();
  }

  render() {
    const list = this.renderList();
    return (
      <div>
        <Grid>
          <Row className="sub-nav">
            <Col xs={12}>
                <a onClick={this.onClickBalance}><Glyphicon glyph="piggy-bank" /> Balance</a>
                &nbsp;|&nbsp;
                <span>Categories : </span>{this.renderFilterCategory()}
            </Col>
          </Row>
        </Grid>
        <Grid id="book-entries">
          {this.renderListHeader()}
          {list}
        </Grid>
      </div>
    );
  }
}

class AppMenu extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return React.createElement(`div`, { id : `menu` });
  }
}

class AppMenuIcon extends React.Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    if (this.props.onClick) this.props.onClick();
  }

  render() {
    return React.createElement(`div`, { id : `menu-icon`, onClick : this.handleClick });
  }

}

class Balance extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      total : this.computeTotal(props.balance),
      categories : this.sortCategories(props.book.getCategories()),
      filteredCategory : ``,
    }
    this.renderList = this.renderList.bind(this);
    this.onClickBack = this.onClickBack.bind(this);
    this.sortCategories = this.sortCategories.bind(this);
    this.renderCategoriesOptions = this.renderCategoriesOptions.bind(this);
    this.renderFilterCategory = this.renderFilterCategory.bind(this);
    this.filterCategory = this.filterCategory.bind(this);
  }

  computeTotal(balance) {
    return balance.reduce((prev, curr) => {
      if (curr.level === 0) return prev + curr.amount;
      return prev;
    }, 0)
  }

  sortCategories(categories) {
    return categories.sort((a,b) => {
      if(a.toLowerCase() < b.toLowerCase()) return -1;
      if(a.toLowerCase() > b.toLowerCase()) return 1;
      return 0;
    });
  }

  componentWillReceiveProps(nextProps) {
    const total  = this.computeTotal(nextProps.balance);
    // const total  = nextProps.balance.reduce((prev, curr) => prev + curr.amount, 0);
    const categories = this.sortCategories(nextProps.book.getCategories());

    this.setState({total, categories});
  }

  renderCategoriesOptions() {
    const options = this.state.categories.map((category,i) => {
      return React.createElement(`option`, { key : i, value : category }, category);
    });
    return options;
  }

  filterCategory(event) {
    this.setState({ filteredCategory : event.target.value })
  }

  renderFilterCategory() {
    const options = this.renderCategoriesOptions(false);
    options.unshift((<option key="all" value="">Tout</option>));
    return (
      <select onChange={this.filterCategory}>
        {options}
      </select>
    )
  }

  renderList() {
    // const total  = this.props.balance.reduce((prev, curr) => prev + curr.amount, 0);
    // this.setState({total});
    let maxChars = 0;
    let balance = this.props.balance;
    if (this.state.filteredCategory) balance = this.props.balance.sort((a,b) => {
      if(a.category.toLowerCase() < b.category.toLowerCase()) return -1;
      if(a.category.toLowerCase() > b.category.toLowerCase()) return 1;
      return 0;
    })
    else balance = this.props.balance.sort((a,b) => b.amount - a.amount);
    this.props.balance.forEach(line => {
      if (Math.abs(line.amount).toFixed(0).length > maxChars) maxChars = Math.abs(line.amount).toFixed(0).length
    });
    return balance.map((line, i) => {
      if (line.level !== 0 && !this.state.filteredCategory || this.state.filteredCategory && line.category.indexOf(this.state.filteredCategory) !== 0) return;
      const classNames = `balance level-${line.level}`;
      const blanks = new Array(maxChars - Math.abs(line.amount).toFixed(0).length);
      blanks.fill(<span>&nbsp;</span>);
      const ratioBar = line.ratioGain ? (  <div className="ratio-bar gain" style={{width : Math.floor(line.ratioGain * 100) + `%`}}></div> ) : (<div className="ratio-bar loss" style={{width : Math.floor(line.ratioLoss * 100) + `%`}}></div>);
      return (
        <Row key={i} className={classNames}>
          <Col xs={6} className="category">{line.category}</Col>
          <Col xs={6} className="amount">
            {blanks}{ line.amount >= 0 ? "+" : "-" }{Math.abs(line.amount).toFixed(2)} ({line.ratioGain.toFixed(2)} / {line.ratioLoss.toFixed(2)})
            {ratioBar}
          </Col>
        </Row>
      )
    })
  }

  onClickBack() {
    if (this.props.onClickBack) this.props.onClickBack();
  }

  render() {
    let totalLine = '';
    if (!this.state.filteredCategory) {
      totalLine = (
        <Row className="balance total">
          <Col xs={6} className="category">Total</Col>
          <Col xs={6} className="amount">{this.state.total.toFixed(2)}</Col>
        </Row>
      );
    }
    return (
      <div>
        <Grid>
          <Row className="sub-nav">
            <Col xs={12}>
                <a onClick={this.onClickBack}><Glyphicon glyph="menu-left" /> Back</a>
                &nbsp;|&nbsp;
                Categorie : {this.renderFilterCategory()}
            </Col>
          </Row>
        </Grid>
        <Grid id="book-entries">
          {this.renderList()}
          {totalLine}
        </Grid>
      </div>
    )
  }
}

class BalanceChart extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    // const pieData = this.props.balance;
    // console.log(this.props.balance);
    var pieData = [{label: "Margarita", value: 20.0}, {label: "John", value: 55.0}, {label: "Tim", value: 25.0 }];
    return  (
    	<PieChart
      data={this.props.balance}
      width={450}
      height={400}
      radius={110}
      innerRadius={20}
      sectorBorderColor="white"
      title="Pie Chart" />
    )
  }
}



class App extends React.Component {

  constructor(props) {
    super(props)
    // const book = new Book();
    const startDate = moment();
    startDate.startOf(`year`);
    const endDate = moment();

    const book = props.book;
    this.state = {
      book,
      fileName : 'test.json',
      startDate,
      endDate,
      currentFileName : null,

    };

    utils.setAppMenu.bind(this)();

    this.handleBalanceClickBack   = this.handleBalanceClickBack.bind(this);
    this.parseFromIng             = this.parseFromIng.bind(this);
    this.balance                  = this.balance.bind(this);
    this.renderNav                = this.renderNav.bind(this);
    this.handleChangeStart        = this.handleChangeStart.bind(this);
    this.handleChangeEnd          = this.handleChangeEnd.bind(this);
    this.handleChangeItemCategory = this.handleChangeItemCategory.bind(this);
    this.openBook                 = this.openBook.bind(this);
    this.save                     = this.save.bind(this);
    this.saveAs                   = this.saveAs.bind(this);
    this.saveConfig               = this.saveConfig.bind(this);
    this.loadConfig               = this.loadConfig.bind(this);
    this.importEntries            = this.importEntries.bind(this);
    this.refresTitle              = this.refresTitle.bind(this);

    this.config = {};

    // app.on('will-quit', this.saveConfig);
    const currentWindow = remote.getCurrentWindow();
    currentWindow.on(`close`, () => {
      this.saveConfig();
      // currentWindow = null;
    });

  }

  componentDidMount() {
    // this.parseFromIng('/Users/guillaume/perso_projects/compta/data/201601.csv');
    this.loadConfig();
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
        this.refresTitle();
      });
    } else {
      fileName = file;
      const content  = fs.readFileSync(fileName, `utf8`);
      const mainBook = compta.importers.ing_csv(content);
      //ReactDOM.render(<App book={mainBook}/>, document.getElementById('app'));
      this.setState({book : mainBook, balance : null, currentFileName : false,});
      this.refresTitle();
    }
  }

  refresTitle() {
    var fileName = this.state.currentFileName;
    if (!fileName) fileName = 'Compta';
    document.querySelector('title').innerHTML = `Compta - ${path.basename(fileName)}`;
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
        this.refresTitle();
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
      this.refresTitle();
    }
    say(`### End opening book`);
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
      this.refresTitle();
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
      this.refresTitle();
    });
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

    return React.createElement(`div`, null, this.renderNav(), balance, entries, React.createElement(AppMenu));
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

// parseFromIng();
// mainBook = parseFromIng('/Users/guillaume/perso_projects/compta/data/201601.csv');
// app = React.createElement(App, {book : mainBook});
ReactDOM.render(<App book={mainBook} />, document.getElementById('app'));
// ReactDOM.render(app, document.getElementById('app'));
