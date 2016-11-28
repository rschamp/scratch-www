/* eslint-disable react/forbid-prop-types */
var defaults = require('lodash.defaultsdeep');
var libphonenumber = require('google-libphonenumber');
var phoneNumberUtil = libphonenumber.PhoneNumberUtil.getInstance();
var React = require('react');

module.exports = {};

module.exports.validations = {
    notEquals: function (values, value, neq) {
        return value !== neq;
    },
    notEqualsField: function (values, value, field) {
        return value !== values[field];
    },
    isPhone: function (values, value) {
        if (typeof value === 'undefined') return true;
        if (value && value.national_number === '+') return true;
        try {
            var parsed = phoneNumberUtil.parse(value.national_number, value.country_code.iso2);
            return phoneNumberUtil.isValidNumber(parsed);
        } catch (err) {
            return false;
        }
    }
};
module.exports.validations.notEqualsUsername = module.exports.validations.notEquals;

module.exports.validationHOCFactory = function (defaultValidationErrors) {
    return function (Component) {
        var ValidatedComponent = function (props) {
            var validationErrors = defaults(
                {},
                defaultValidationErrors,
                props.validationErrors
            );
            return (
                <Component
                    {...props}
                    validationErrors={validationErrors}
                />
            );
        };
        ValidatedComponent.propTypes = {
            validationErrors: React.PropTypes.object
        };
        return ValidatedComponent;
    };
};

module.exports.defaultValidationHOC = module.exports.validationHOCFactory({
    isDefaultRequiredValue: 'This field is required'
});
