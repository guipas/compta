var rd3 = require('rd3');
var PieChart = rd3.PieChart

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
