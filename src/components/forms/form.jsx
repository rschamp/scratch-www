var classNames = require('classnames');
var Formsy = require('formsy-react');
var omit = require('lodash.omit');
var React = require('react');
var validations = require('./validations.jsx').validations;

for (var validation in validations) {
    Formsy.addValidationRule(validation, validations[validation]);
}

class Form extends React.Component {
    static propTypes = {
        children: React.PropTypes.node,
        className: React.PropTypes.string,
        onChange: React.PropTypes.func
    }
    static defaultProps = {
        noValidate: true,
        onChange: function () {}
    }
    constructor (props) {
        super(props);
        this.state = {
            allValues: {}
        };
    }
    handleChange (currentValues, isChanged) {
        this.setState({allValues: omit(currentValues, 'all')});
        this.props.onChange(currentValues, isChanged);
    }
    render () {
        var classes = classNames(
            'form',
            this.props.className
        );
        return (
            <Formsy.Form
                {... this.props}
                className={classes}
                ref="formsy"
                onChange={this.handleChange}
            >
                {React.Children.map(this.props.children, function (child) {
                    if (!child) return child;
                    if (child.props.name === 'all') return React.cloneElement(child, {value: this.state.allValues});
                    return child;
                }.bind(this))}
            </Formsy.Form>
        );
    }
}
module.exports = Form;
