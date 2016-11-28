var classNames = require('classnames');
var FRCTextarea = require('formsy-react-components').Textarea;
var React = require('react');
var defaultValidationHOC = require('./validations.jsx').defaultValidationHOC;
var inputHOC = require('./input-hoc.jsx');

require('./row.scss');
require('./textarea.scss');

var TextArea = function (props) {
    var classes = classNames(
        'textarea-row',
        props.className
    );
    return (
        <FRCTextarea
            {... props}
            className="textarea"
            rowClassName={classes}
        />
    );
};
TextArea.propTypes = {
    className: React.PropTypes.string
};
module.exports = inputHOC(defaultValidationHOC(TextArea));
