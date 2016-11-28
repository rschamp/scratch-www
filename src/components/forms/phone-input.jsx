var allCountries = require('react-telephone-input/lib/country_data').allCountries;
var classNames = require('classnames');
var ComponentMixin = require('formsy-react-components').ComponentMixin;
var FormsyMixin = require('formsy-react').Mixin;
var React = require('react');
var ReactPhoneInput = require('react-telephone-input/lib/withStyles');
var Row = require('formsy-react-components').Row;

var defaultValidationHOC = require('./validations.jsx').defaultValidationHOC;
var inputHOC = require('./input-hoc.jsx');
var intl = require('../../lib/intl.jsx');
var validationHOCFactory = require('./validations.jsx').validationHOCFactory;

var allIso2 = allCountries.map(function (country) {
    return country.iso2;
});

require('./row.scss');
require('./phone-input.scss');

// @todo Switch to Formsy HOC and Component HOC (if possible) and then update
// to ES6-style class
var PhoneInput = React.createClass({ // eslint-disable-line react/prefer-es6-class
    displayName: 'PhoneInput',
    propTypes: {
        className: React.PropTypes.string,
        disabled: React.PropTypes.bool,
        defaultCountry: React.PropTypes.string,
        name: React.PropTypes.string,
        onChange: React.PropTypes.func
    },
    mixins: [
        FormsyMixin,
        ComponentMixin
    ],
    getDefaultProps: function () {
        return {
            validations: {
                isPhone: true
            },
            flagsImagePath: '/images/flags.png',
            defaultCountry: 'us'
        };
    },
    handleChangeInput: function (number, country) {
        var value = {national_number: number, country_code: country};
        this.setValue(value);
        this.props.onChange(this.props.name, value);
    },
    render: function () {
        var defaultCountry = PhoneInput.getDefaultProps().defaultCountry;
        if (allIso2.indexOf(this.props.defaultCountry.toLowerCase()) !== -1) {
            defaultCountry = this.props.defaultCountry.toLowerCase();
        }
        return (
            <Row
                {... this.getRowProperties()}
                htmlFor={this.getId()}
                rowClassName={classNames('phone-input', this.props.className)}
            >
                <div className="input-group">
                    <ReactPhoneInput
                        className="form-control"
                        {... this.props}
                        defaultCountry={defaultCountry}
                        disabled={this.isFormDisabled() || this.props.disabled}
                        id={this.getId()}
                        label={null}
                        onChange={this.handleChangeInput}
                    />
                    {this.renderHelp()}
                    {this.renderErrorMessage()}
                </div>
            </Row>
        );
    }
});

var phoneValidationHOC = validationHOCFactory({
    isPhone: <intl.FormattedMessage id="teacherRegistration.validationPhoneNumber" />
});

module.exports = inputHOC(defaultValidationHOC(phoneValidationHOC(PhoneInput)));
