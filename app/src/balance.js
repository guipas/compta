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

module.exports = Balance;
