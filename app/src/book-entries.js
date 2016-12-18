class BookEntries extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      entries : this.sortByDate(props.book.entries, -1),
      dateSortDirection : -1,
      categories : this.sortCategories(props.book.getCategories()),
      filteredCategory : ``,
      dateFormat : props.dateFormat || 'YYYY-MM-DD',
    };

    this.renderList              = this.renderList.bind(this);
    this.onClickBalance          = this.onClickBalance.bind(this);
    this.renderListHeader        = this.renderListHeader.bind(this);
    this.sortByDate              = this.sortByDate.bind(this);
    this.sortEntriesByDate       = this.sortEntriesByDate.bind(this);
    this.renderCategoriesOptions = this.renderCategoriesOptions.bind(this);
    this.changeCategory          = this.changeCategory.bind(this);
    this.filterCategory          = this.filterCategory.bind(this);
    this.renderFilterCategory    = this.renderFilterCategory.bind(this);
    this.sortCategories          = this.sortCategories.bind(this);
  }

  sortCategories(categories) {
    return categories.sort((a,b) => {
      if(a.toLowerCase() < b.toLowerCase()) return -1;
      if(a.toLowerCase() > b.toLowerCase()) return 1;
      return 0;
    });
  }

  componentWillReceiveProps(nextProps) {
    // say('-- React App bookEntries receive new props');
    let categories = nextProps.book.getCategories();
    categories = this.sortCategories(categories);
    this.setState({
      entries : this.sortByDate(nextProps.book.entries, this.state.dateSortDirection),
      categories,
    });
  }

  renderCategoriesOptions(addNew = true) {
    const options = this.state.categories.map((category,i) => {
      return (<option key={i} value={category}>{category}</option>);
    });
    if (addNew) options.push(<option key="addnew" value="addNewCategory">Create...</option>);
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
    say('-- React App rendering entry list');
    if (!this.state || !this.state.entries) return null;
    return this.state.entries.map((entry, i) => {
      if (this.props.startDate && this.props.endDate && !moment(entry.date).isBetween(this.props.startDate, this.props.endDate)) return;
      if (this.state.filteredCategory !== `` &&  entry.category.indexOf(this.state.filteredCategory) !== 0) return;
      // if (this.state.filteredCategory !== `` && this.state.filteredCategory !== entry.category) return;
      const tooltip = (<Tooltip className="tooltip" id="entry-tooltip-{i}">{entry.label}</Tooltip>);

      return (
        <Row>
          <Col xs={6} className="entry-date">
            {moment(entry.date).format(this.state.dateFormat)}
            <div className="entry-name">
              <OverlayTrigger placement="bottom" overlay={tooltip}>
                <span>{entry.label.slice(0,28)} {entry.label.length > 28 ? `...` : ``}</span>
              </OverlayTrigger>
            </div>
          </Col>
          <Col xs={4} className="entry-category">
            <select value={entry.category} onChange={this.changeCategory.bind(this, entry.id)}>
             {this.renderCategoriesOptions()}
            </select>
          </Col>
          <Col xs={2} className="entry-amount">
            {entry.amount.toFixed(2)}
          </Col>
        </Row>
      );
    })
  }

  sortByDate(entries, direction) {
    return entries.sort((a,b) => {
      const x = moment(a.date);
      const y = moment(b.date);
      const compare = (x.valueOf() - y.valueOf()) * direction;
      return compare;
    })
  }

  sortEntriesByDate() {
    this.setState({
      entries : this.sortByDate(this.state.entries, this.state.dateSortDirection * -1),
      dateSortDirection : this.state.dateSortDirection * -1,
    });
  }


  renderListHeader() {
    return (
      <Row className="list-header">
        <Col xs={6} className="entry-date" onClick={this.sortEntriesByDate}>Date</Col>
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
    options.unshift((<option key="all" value="">All</option>));
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

module.exports = BookEntries;
