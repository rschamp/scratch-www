var classNames = require('classnames');
var FRCCheckboxGroup = require('formsy-react-components').CheckboxGroup;
var React = require('react');
var defaultValidationHOC = require('./validations.jsx').defaultValidationHOC;
var inputHOC = require('./input-hoc.jsx');

require('./row.scss');
require('./checkbox-group.scss');

var CheckboxGroup = function (props) {
    var classes = classNames(
        'checkbox-group',
        props.className
    );
    return (
        <div className={classes}>
            <FRCCheckboxGroup
                {... props}
                className={classes}
            />
        </div>
    );
};
CheckboxGroup.propTypes = {
    className: React.PropTypes.string
};
module.exports = inputHOC(defaultValidationHOC(CheckboxGroup));
