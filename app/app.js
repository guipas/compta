const React = require('react');
const ReactDOM = require('react-dom');
const compta = require('./app/compta2');
const Book = compta.SingleEntryBook;
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const {dialog, Menu, MenuItem, app} = require('electron').remote;
var Chart = require('react-d3-core').Chart;
var Dialogs = require('dialogs');
var dialogs = Dialogs();
// require `react-d3-basic` for Line chart component.
var LineChart = require('react-d3-basic').LineChart;
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

// const ReactDates = require('react-dates');
// const DateRangePicker = ReactDates.DateRangePicker;
const DatePicker = require(`react-datepicker`);

let mainBook = new Book();


class BookEntries extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      entries : props.book.entries,
      dateSortDirection : 1,
      categories : [],
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
  }

  componentDidMount() {
  }

  componentWillReceiveProps(nextProps) {
    let categories = nextProps.book.getCategories();
    categories = categories.sort((a,b) => {
      if(a.toLowerCase() < b.toLowerCase()) return -1;
      if(a.toLowerCase() > b.toLowerCase()) return 1;
      return 0;
    });
    this.setState({
      entries : nextProps.book.entries,
      categories,
    });
  }

  renderCategoriesOptions(addNew = true) {
    const options = this.state.categories.map(category => {
      return (
        <option value={category}>
          {category}
        </option>)
    })
    if (addNew) options.push((<option value="addNewCategory">create...</option>));
    return options;
  }


  changeCategory(entryId, event) {
    // console.log(event.target);
    // console.log(event.target.value);
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
      if (this.state.filteredCategory !== `` && this.state.filteredCategory !== entry.category) return;
      const tooltip = (<Tooltip className="tooltip">{entry.label}</Tooltip>);
      return (
        <Row key={i}>
          <Col xs={6} className="entry-date">
            {moment(entry.date).format('DD/MM/YYYY')}
            <div className="entry-name">
              <OverlayTrigger placement="bottom" overlay={tooltip}>
                <span>{entry.label.slice(0,28)}{entry.label.length > 28 ? `...` : ``}</span>
              </OverlayTrigger>
            </div>
          </Col>
          <Col xs={4} className="entry-category" >
            <select value={entry.category} onChange={this.changeCategory.bind(this, entry.id)}>
              {this.renderCategoriesOptions()}
            </select>

          </Col>
          <Col xs={2} className="entry-amount">{entry.amount.toFixed(2)}</Col>
        </Row>
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
    console.log(event.target.value);
    this.setState({ filteredCategory : event.target.value })
  }

  renderFilterCategory() {
    const options = this.renderCategoriesOptions(false);
    options.unshift((<option value="">Tout</option>));
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
              <ButtonToolbar>
                <Button onClick={this.onClickBalance}><Glyphicon glyph="piggy-bank" /> Balance</Button>
                {this.renderFilterCategory()}
              </ButtonToolbar>
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

class Balance extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      total : props.balance.reduce((prev, curr) => prev + curr.amount, 0),
    }
    this.renderList = this.renderList.bind(this);
    this.onClickBack = this.onClickBack.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const total  = nextProps.balance.reduce((prev, curr) => prev + curr.amount, 0);
    this.setState({total});
  }

  renderList() {
    // const total  = this.props.balance.reduce((prev, curr) => prev + curr.amount, 0);
    // this.setState({total});
    let maxChars = 0;
    this.props.balance.forEach(line => {
      if (Math.abs(line.amount).toFixed(0).length > maxChars) maxChars = Math.abs(line.amount).toFixed(0).length
    });
    const balance = this.props.balance.sort((a,b) => b.amount - a.amount);
    return balance.map((line, i) => {
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
    return (
      <div>
        <Grid>
          <Row className="sub-nav">
            <Col xs={12}>
              <ButtonToolbar>
                <Button onClick={this.onClickBack}><Glyphicon glyph="menu-left" /> Back</Button>
              </ButtonToolbar>
            </Col>
          </Row>
        </Grid>
        <Grid id="book-entries">
          {this.renderList()}
          <Row className="balance total">
            <Col xs={6} className="category">Total</Col>
            <Col xs={6} className="amount">{this.state.total.toFixed(2)}</Col>
          </Row>
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
    console.log(this.props.balance);
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

    this.handleBalanceClickBack = this.handleBalanceClickBack.bind(this);
    this.parseFromIng = this.parseFromIng.bind(this);
    this.balance = this.balance.bind(this);
    this.renderNav = this.renderNav.bind(this);
    this.handleChangeStart = this.handleChangeStart.bind(this);
    this.handleChangeEnd = this.handleChangeEnd.bind(this);
    this.handleChangeItemCategory = this.handleChangeItemCategory.bind(this);
    this.openBook = this.openBook.bind(this);
    this.save = this.save.bind(this);
    this.saveAs = this.saveAs.bind(this);
    this.saveConfig = this.saveConfig.bind(this);
    this.loadConfig = this.loadConfig.bind(this);
    this.importEntries = this.importEntries.bind(this);

    this.config = {};

    app.on('will-quit', this.saveConfig);

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
        console.log(fileName);
        if (fileName === undefined){
          console.log("Unable to open file");
          return;
        }

        // mainBook = compta.parseING(fileName);
        const content  = fs.readFileSync(fileName, `utf8`);
        const mainBook = compta.importers.ing_csv(content);
        this.setState({book : mainBook, balance : null, currentFileName : fileName,});
        //ReactDOM.render(<App book={mainBook}/>, document.getElementById('app'));
      });
    } else {
      fileName = file;
      const content  = fs.readFileSync(fileName, `utf8`);
      const mainBook = compta.importers.ing_csv(content);
      //ReactDOM.render(<App book={mainBook}/>, document.getElementById('app'));
      this.setState({book : mainBook, balance : null, currentFileName : fileName,});
    }
  }

  openBook(file) {
    if (!file) {
      dialog.showOpenDialog(fileNames => {
        if (!fileNames){
          console.log("Unable to open file");
          return;
        }
        const fileName = fileNames.pop();
        const book = new Book();
        book.load(fs.readFileSync(fileName, `utf8`));
        this.setState({
          book,
          balance : false,
          currentFileName : fileName,
        });
        document.querySelector('title').innerHTML = `Compta - ${fileName}`;
      });
    } else {
      if (!fs.existsSync(file)) return;
      const book = new Book();
      book.load(fs.readFileSync(file, `utf8`));
      this.setState({
        book,
        balance : false,
        currentFileName : file,
      });
      document.querySelector('title').innerHTML = `Compta - ${file}`;
    }
  }

  saveConfig() {
    if (this.state.currentFileName) this.config.lastOpenedFile = this.state.currentFileName;
    fs.writeFileSync(path.join(__dirname, `compta-config.json`), JSON.stringify(this.config));
  }

  loadConfig() {
    const config = fs.readFileSync(path.join(__dirname, `compta-config.json`), `utf8`);
    if (config) {
      try { this.config = JSON.parse(config) }
      catch (e) {
        console.log(e);
        this.config = {};
      }
    }
    if (this.config.lastOpenedFile) {
      this.openBook(this.config.lastOpenedFile);
    }
  }

  save(forceDialog = false) {
    if (!forceDialog && this.state.currentFileName) {
      const oldContent = fs.readFileSync(this.state.currentFileName, `utf8`);
      const time = Date.now();
      const oldFileName = path.basename(this.state.currentFileName, `.json`) + time.toString() + `.json`;
      const oldFilePath = path.join(__dirname, `history`, oldFileName);
      fs.writeFileSync(oldFilePath, oldContent);
      fs.writeFileSync(this.state.currentFileName, this.state.book.save());
      return;
    }
    dialog.showSaveDialog(fileName => {
      if (!fileName) return;
      fs.writeFileSync(fileName, this.state.book.save());
    })
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
        console.log("Unable to open file");
        return;
      }
      const fileName = fileNames.pop();
      const importBook = new Book();
      importBook.load(fs.readFileSync(fileName, `utf8`));
      const book = state.book;
      book.mergeBook(importBook);
      this.setState({
        book,
        balance : false,
        currentFileName : false,
      });
    });
  }

  balance() {
    const balance = this.state.book.balanceCategories(this.state.startDate, this.state.endDate);
    this.setState({balance});
    // this.state.book.balanceCategories();
    // console.log(__dirname);
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
            Période du <br/>
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

    if (this.state.book && !this.state.balance) entries = (<BookEntries startDate={this.state.startDate} endDate={this.state.endDate} onClickBalance={this.balance} book={this.state.book} onChangeItemCategory={this.handleChangeItemCategory}></BookEntries>);
    if (this.state.balance) balance = (<Balance startDate={this.state.startDate} endDate={this.state.endDate}  onClickBack={this.handleBalanceClickBack} balance={this.state.balance}></Balance>);
    // if (this.props.balance) balance = (<BalanceChart balance={this.props.balance}></BalanceChart>);

    return (
      <div>
        {this.renderNav()}
        {balance}
        {entries}
      </div>);
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
