var Formsy = require('formsy-react');
var React = require('react');

require('./general-error.scss');

/*
 * A special formsy-react component that only outputs
 * error messages. If you want to display errors that
 * don't apply to a specific field, insert one of these,
 * give it a name, and apply your validation error to
 * the name of the GeneralError component.
 */
var GeneralError = Formsy.HOC(function (props) {
    if (!props.showError()) return null;
    return (
        <p className="general-error">
            {props.getErrorMessage()}
        </p>
    );
});
module.exports = GeneralError;
