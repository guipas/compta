const Modal = require('react-modal');


class Compta extends React.Component {

  constructor(props) {
    say('-- React App construction');
    super(props)
    // const book = new Book();
    const startDate = moment();
    startDate.startOf(`year`);
    const endDate = moment().endOf("Day");
    const dateFormat = props.dateFormat || 'YYYY-MM-DD';

    const book = props.book;
    this.state = {
      book,
      startDate,
      endDate,
      dateFormat,
    };

    this.handleBalanceClickBack   = this.handleBalanceClickBack.bind(this);
    this.balance                  = this.balance.bind(this);
    this.renderNav                = this.renderNav.bind(this);
    this.handleChangeStart        = this.handleChangeStart.bind(this);
    this.handleChangeEnd          = this.handleChangeEnd.bind(this);
    this.handleChangeItemCategory = this.handleChangeItemCategory.bind(this);
    this.handleAddEntry           = this.handleAddEntry.bind(this);
  }

  componentWillReceiveProps(newProps) {
    say('-- React App will receive props...');
    console.log(newProps.book);
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
      balance : this.state.balance ? this.state.book.balance(date, this.state.endDate) : null,
    });
  }
  handleChangeEnd(date) {
    this.setState({
      endDate: date.endOf('Day'),
      balance : this.state.balance ? this.state.book.balance(this.state.startDate, date) : null,
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
            Period : from
            <DatePicker
              dateFormat={this.state.dateFormat}
              selected={this.state.startDate}
              selectsStart    startDate={this.state.startDate}
              endDate={this.state.endDate}
              onChange={this.handleChangeStart} />
            to
            <DatePicker
              dateFormat={this.state.dateFormat}
              selected={this.state.endDate}
              selectsEnd    startDate={this.state.startDate}
              endDate={this.state.endDate}
              onChange={this.handleChangeEnd} />
          </Col>
        </Row>
      </Grid>
    )
  }

  handleAddEntry(label, amount, date) {
    if (this.props.onAddEntry) {
      this.props.onAddEntry(label, amount, date);
    }
  }

  render() {
    say('-- React App render');
    let balance = '';
    let entries = '';

    if (this.state.book && !this.state.balance) {
      entries = React.createElement(BookEntries, {
        startDate            : this.state.startDate,
        endDate              : this.state.endDate,
        onClickBalance       : this.balance,
        book                 : this.state.book,
        onChangeItemCategory : this.handleChangeItemCategory,
        dateFormat           : this.state.dateFormat,
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
        <Modal
          isOpen={this.props.newEntryModalOpened}
          contentLabel="Add new entry"
          onRequestClose={this.props.requestCloseNewEntryModal}
          shouldCloseOnOverlayClick={true}
        >
          <NewEntryForm dateFormat={this.state.dateFormat} onValidate={this.handleAddEntry}/>
        </Modal>
      </div>
    )
  }
}

module.exports = Compta;
