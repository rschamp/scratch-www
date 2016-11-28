var classNames = require('classnames');
var FRCRadioGroup = require('formsy-react-components').RadioGroup;
var React = require('react');
var defaultValidationHOC = require('./validations.jsx').defaultValidationHOC;
var inputHOC = require('./input-hoc.jsx');

require('./row.scss');
require('./radio-group.scss');

var RadioGroup = function (props) {
    var classes = classNames(
        'radio-group',
        props.className
    );
    return (
        <FRCRadioGroup
            {... props}
            className={classes}
        />
    );
};
RadioGroup.propTypes = {
    className: React.PropTypes.string
};
module.exports = inputHOC(defaultValidationHOC(RadioGroup));
