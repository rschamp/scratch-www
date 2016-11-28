var classNames = require('classnames');
var FRCInput = require('formsy-react-components').Input;
var React = require('react');
var defaultValidationHOC = require('./validations.jsx').defaultValidationHOC;
var inputHOC = require('./input-hoc.jsx');

require('./input.scss');
require('./row.scss');

class Input extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            status: ''
        };
    }
    handleInvalid () {
        this.setState({
            status: 'fail'
        });
    }
    handleValid () {
        this.setState({
            status: 'pass'
        });
    }
    render () {
        var classes = classNames(
            this.state.status,
            this.props.className,
            {'no-label': (typeof this.props.label === 'undefined')}
        );
        return (
            <FRCInput
                {... this.props}
                className="input"
                rowClassName={classes}
                onInvalid={this.handleInvalid}
                onValid={this.handleValid}
            />
        );
    }
}
Input.propTypes = {
    className: React.PropTypes.string,
    label: React.PropTypes.node
};
module.exports = inputHOC(defaultValidationHOC(Input));
