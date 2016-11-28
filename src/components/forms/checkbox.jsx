var classNames = require('classnames');
var FRCCheckbox = require('formsy-react-components').Checkbox;
var React = require('react');
var defaultValidationHOC = require('./validations.jsx').defaultValidationHOC;
var inputHOC = require('./input-hoc.jsx');

require('./row.scss');
require('./checkbox.scss');

var Checkbox = function (props) {
    var classes = classNames(
        'checkbox-row',
        props.className
    );
    return (
        <FRCCheckbox
            rowClassName={classes}
            {... props}
        />
    );
};
Checkbox.propTypes = {
    className: React.PropTypes.string
};
module.exports = inputHOC(defaultValidationHOC(Checkbox));
