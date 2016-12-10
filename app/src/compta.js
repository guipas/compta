class Compta extends React.Component {

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

module.exports = Compta;
