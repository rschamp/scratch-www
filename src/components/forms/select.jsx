/* eslint-disable react/forbid-prop-types */
var classNames = require('classnames');
var defaults = require('lodash.defaultsdeep');
var FRCSelect = require('formsy-react-components').Select;
var React = require('react');
var defaultValidationHOC = require('./validations.jsx').defaultValidationHOC;
var inputHOC = require('./input-hoc.jsx');

require('./row.scss');
require('./select.scss');

var Select = function (props) {
    var classes = classNames(
        'select',
        props.className
    );
    var selectProps = props;
    if (props.required && !props.value) {
        selectProps = defaults({}, props, {value: props.options[0].value});
    }
    return (
        <div className={classes}>
            <FRCSelect {... selectProps} />
        </div>
    );
};
Select.propTypes = {
    className: React.PropTypes.string,
    options: React.PropTypes.array,
    required: React.PropTypes.bool,
    value: React.PropTypes.any
};
module.exports = inputHOC(defaultValidationHOC(Select));
