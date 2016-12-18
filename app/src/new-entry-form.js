
class NewEntryForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dateFormat : props.dateFormat || 'YYYY-MM-DD',
      selectedDate : moment(),
      label : "",
      amount : "0",

    }

    this.handleChangeStart = this.handleChangeStart.bind(this);
    this.addEntry = this.addEntry.bind(this);
    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.handleLabelChange = this.handleLabelChange.bind(this);
  }

  renderList() {
    return this.props.categories.map(category => {

    })
  }

  handleChangeStart(selectedDate) {
    this.setState({
      selectedDate
    });
  }

  addEntry() {
    console.log('new entry form add entry');
    if (this.props.onValidate) {
      const label = this.state.label;
      const amount = parseFloat(this.state.amount);
      const date = this.state.selectedDate;
      this.props.onValidate(label, amount, date);
    }
  }

  handleAmountChange(e) {
    this.setState({
      amount : e.target.value,
    });
  }

  handleLabelChange(e) {
    this.setState({
      label : e.target.value,
    });
  }

  render() {
    return (
      <Form inline>
        <FormGroup controlId="newEntryLabel">
          <ControlLabel>Label</ControlLabel>
          {' '}
          <FormControl type="text" placeholder="Label" value={this.state.label} onChange={this.handleLabelChange}  />
        </FormGroup>
        <FormGroup controlId="newEntryAmount">
          <ControlLabel>Amount</ControlLabel>
          {' '}
          <FormControl type="text" placeholder="0" value={this.state.amount} onChange={this.handleAmountChange} />
        </FormGroup>
        <FormGroup controlId="newEntryDate">
          <ControlLabel>Date</ControlLabel>
          {' '}
          <div>
            <DatePicker
            inline
            selected={this.state.selectedDate}
            dateFormat={this.state.dateFormat}
            onChange={this.handleChangeStart} />
          </div>
        </FormGroup>
        <Button onClick={this.addEntry}>
          Add entry
        </Button>

      </Form>
    );
  }
}


module.exports = NewEntryForm;
