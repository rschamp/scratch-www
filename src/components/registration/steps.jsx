var React = require('react');

var api = require('../../lib/api');
var countryData = require('../../lib/country-data');
var intl = require('../../lib/intl.jsx');
var log = require('../../lib/log');
var smartyStreets = require('../../lib/smarty-streets');

var Avatar = require('../../components/avatar/avatar.jsx');
var Button = require('../../components/forms/button.jsx');
var Card = require('../../components/card/card.jsx');
var CharCount = require('../../components/forms/charcount.jsx');
var Checkbox = require('../../components/forms/checkbox.jsx');
var CheckboxGroup = require('../../components/forms/checkbox-group.jsx');
var Form = require('../../components/forms/form.jsx');
var GeneralError = require('../../components/forms/general-error.jsx');
var Input = require('../../components/forms/input.jsx');
var PhoneInput = require('../../components/forms/phone-input.jsx');
var RadioGroup = require('../../components/forms/radio-group.jsx');
var Select = require('../../components/forms/select.jsx');
var Slide = require('../../components/slide/slide.jsx');
var Spinner = require('../../components/spinner/spinner.jsx');
var StepNavigation = require('../../components/stepnavigation/stepnavigation.jsx');
var TextArea = require('../../components/forms/textarea.jsx');
var Tooltip = require('../../components/tooltip/tooltip.jsx');

require('./steps.scss');

var DEFAULT_COUNTRY = 'us';

/**
 * Return a list of options to give to frc select
 * @param  {Object} intl           react-intl, used to localize strings
 * @param  {String} defaultCountry optional string of default country to put at top of list
 * @return {Object}                ordered set of county options formatted for frc select
 */
var getCountryOptions = function (intl, defaultCountry) {
    var options = countryData.countryOptions.concat({
        label: intl.formatMessage({id: 'registration.selectCountry'}),
        disabled: true,
        selected: true
    });
    if (typeof defaultCountry !== 'undefined') {
        return options.sort(function (a, b) {
            if (a.disabled) return -1;
            if (b.disabled) return 1;
            if (a.value === defaultCountry) return -1;
            if (b.value === defaultCountry) return 1;
            return 0;
        });
    }
    return options;
};

var NextStepButton = React.createClass({
    getDefaultProps: function () {
        return {
            waiting: false,
            text: 'Next Step'
        };
    },
    render: function () {
        return (
            <Button type="submit" disabled={this.props.waiting} className="card-button" {... this.props}>
                {this.props.waiting ?
                    <Spinner /> :
                    this.props.text
                }
            </Button>
        );
    }
});

module.exports = {
    UsernameStep: intl.injectIntl(React.createClass({
        getDefaultProps: function () {
            return {
                showPassword: false,
                waiting: false
            };
        },
        getInitialState: function () {
            return {
                showPassword: this.props.showPassword,
                waiting: false,
                validUsername: ''
            };
        },
        onChangeShowPassword: function (field, value) {
            this.setState({showPassword: value});
        },
        validateUsername: function (username, callback) {
            callback = callback || function () {};
            if (!username) {
                this.refs.form.refs.formsy.updateInputsWithError({
                    'user.username': formatMessage({id: 'teacherRegistration.validationRequired'})
                });
                return callback(false);
            }

            api({
                host: '',
                uri: '/accounts/check_username/' + username + '/'
            }, function (err, body, res) {
                var formatMessage = this.props.intl.formatMessage;
                if (err || res.statusCode !== 200) {
                    err = err || formatMessage({id: 'general.error'});
                    this.refs.form.refs.formsy.updateInputsWithError({all: err});
                    return callback(false);
                }
                body = body[0];

                switch (body.msg) {
                case 'valid username':
                    this.setState({
                        validUsername: 'pass'
                    });
                    return callback(true);
                case 'username exists':
                    this.refs.form.refs.formsy.updateInputsWithError({
                        'user.username': formatMessage({id: 'registration.validationUsernameExists'})
                    });
                    return callback(false);
                case 'bad username':
                    this.refs.form.refs.formsy.updateInputsWithError({
                        'user.username': formatMessage({id: 'registration.validationUsernameVulgar'})
                    });
                    return callback(false);
                case 'invalid username':
                default:
                    this.refs.form.refs.formsy.updateInputsWithError({
                        'user.username': formatMessage({id: 'registration.validationUsernameInvalid'})
                    });
                    return callback(false);
                }
            }.bind(this));
        },
        onUsernameBlur: function (event) {
            this.validateUsername(event.currentTarget.value);
        },
        onValidSubmit: function (formData) {
            this.setState({waiting: true});
            this.validateUsername(formData.user.username, function (isValid) {
                this.setState({waiting: false});
                if (isValid) return this.props.onNextStep(formData);
            }.bind(this));
        },
        render: function () {
            var formatMessage = this.props.intl.formatMessage;
            return (
                <Slide className="registration-step username-step">
                    <h2>
                        {this.props.title ? (
                            this.props.title
                        ) : (
                            <intl.FormattedMessage id="registration.usernameStepTitle" />
                        )}
                    </h2>
                    <p className="description">
                        {this.props.description ? (
                            this.props.description
                        ) : (
                            <intl.FormattedMessage id="registration.usernameStepDescription" />
                        )}
                        {this.props.tooltip ? (
                            <Tooltip title={'?'}
                                tipContent={this.props.tooltip}
                            />
                        ) : (
                            null
                        )}
                    </p>
                    <Card>
                        <Form onValidSubmit={this.onValidSubmit} ref="form">
                            <div>
                                <div className="username-label">
                                    <b>{formatMessage({id: 'registration.createUsername'})}</b>
                                    {this.props.usernameHelp ? (
                                        <p className="help-text">{this.props.usernameHelp}</p>
                                    ) : (
                                        null
                                    )}
                                </div>
                                <Input className={this.state.validUsername}
                                    type="text"
                                    name="user.username"
                                    onBlur={this.onUsernameBlur}
                                    validations={{
                                        matchRegexp: /^[\w-]*$/,
                                        minLength: 3,
                                        maxLength: 20
                                    }}
                                    validationErrors={{
                                        matchRegexp: formatMessage({
                                            id: 'registration.validationUsernameRegexp'
                                        }),
                                        minLength: formatMessage({
                                            id: 'registration.validationUsernameMinLength'
                                        }),
                                        maxLength: formatMessage({
                                            id: 'registration.validationUsernameMaxLength'
                                        })
                                    }}
                                    required
                                />
                            </div>
                            <Input label={formatMessage({id: 'general.password'})}
                                type={this.state.showPassword ? 'text' : 'password'}
                                name="user.password"
                                validations={{
                                    minLength: 6,
                                    notEquals: 'password',
                                    notEqualsField: 'user.username'
                                }}
                                validationErrors={{
                                    minLength: formatMessage({
                                        id: 'registration.validationPasswordLength'
                                    }),
                                    notEquals: formatMessage({
                                        id: 'registration.validationPasswordNotEquals'
                                    }),
                                    notEqualsField: formatMessage({
                                        id: 'registration.validationPasswordNotUsername'
                                    })
                                }}
                                required
                            />
                            <Checkbox label={formatMessage({id: 'registration.showPassword'})}
                                value={this.state.showPassword}
                                onChange={this.onChangeShowPassword}
                                help={null}
                                name="showPassword"
                            />
                            <GeneralError name="all" />
                            <NextStepButton waiting={this.props.waiting || this.state.waiting}
                                text={<intl.FormattedMessage id="registration.nextStep" />}
                            />
                        </Form>
                    </Card>
                    <StepNavigation steps={this.props.totalSteps - 1} active={this.props.activeStep} />
                </Slide>
            );
        }
    })),
    ChoosePasswordStep: intl.injectIntl(React.createClass({
        getDefaultProps: function () {
            return {
                username: null,
                showPassword: false,
                waiting: false
            };
        },
        getInitialState: function () {
            return {
                showPassword: this.props.showPassword
            };
        },
        onChangeShowPassword: function (field, value) {
            this.setState({showPassword: value});
        },
        render: function () {
            var formatMessage = this.props.intl.formatMessage;
            return (
                <Slide className="registration-step choose-password-step">
                    <h2>{formatMessage({id: 'registration.choosePasswordStepTitle'})}</h2>
                    <p className="description">
                        <intl.FormattedMessage id="registration.choosePasswordStepDescription" />
                        <Tooltip title={'?'}
                            tipContent={formatMessage({id: 'registration.choosePasswordStepTooltip'})}
                        />
                    </p>

                    <Card>
                        <Form onValidSubmit={this.props.onNextStep}>
                            <Input label={formatMessage({id: 'registration.newPassword'})}
                                type={this.state.showPassword ? 'text' : 'password'}
                                name="user.password"
                                validations={{
                                    minLength: 6,
                                    notEquals: 'password',
                                    notEqualsUsername: this.props.username
                                }}
                                validationErrors={{
                                    minLength: formatMessage({
                                        id: 'registration.validationPasswordLength'
                                    }),
                                    notEquals: formatMessage({
                                        id: 'registration.validationPasswordNotEquals'
                                    }),
                                    notEqualsUsername: formatMessage({
                                        id: 'registration.validationPasswordNotUsername'
                                    })
                                }}
                                required
                            />
                            <Checkbox label={formatMessage({id: 'registration.showPassword'})}
                                value={this.state.showPassword}
                                onChange={this.onChangeShowPassword}
                                help={null}
                                name="showPassword"
                            />
                            <NextStepButton waiting={this.props.waiting || this.state.waiting}
                                text={<intl.FormattedMessage id="registration.nextStep" />}
                            />
                        </Form>
                    </Card>
                    <StepNavigation steps={this.props.totalSteps - 1} active={this.props.activeStep} />
                </Slide>
            );
        }
    })),
    DemographicsStep: intl.injectIntl(React.createClass({
        getDefaultProps: function () {
            return {
                waiting: false,
                description: null
            };
        },
        getInitialState: function () {
            return {otherDisabled: true};
        },
        getMonthOptions: function () {
            return [
                'January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December'
            ].map(function (label, id) {
                return {
                    value: id + 1,
                    label: this.props.intl.formatMessage({id: 'general.month' + label})};
            }.bind(this));
        },
        getYearOptions: function () {
            return Array.apply(null, Array(100)).map(function (v, id) {
                var year = 2016 - id;
                return {value: year, label: year};
            });
        },
        onChooseGender: function (name, gender) {
            this.setState({otherDisabled: gender !== 'other'});
        },
        render: function () {
            var formatMessage = this.props.intl.formatMessage;
            return (
                <Slide className="registration-step demographics-step">
                    <h2>
                        <intl.FormattedMessage id="registration.personalStepTitle" />
                    </h2>
                    <p className="description">
                        {this.props.description ?
                            this.props.description
                        :
                            <intl.FormattedMessage id="registration.personalStepDescription" />
                        }
                        <Tooltip title={'?'}
                            tipContent={formatMessage({id: 'registration.nameStepTooltip'})}
                        />
                    </p>
                    <Card>
                        <Form onValidSubmit={this.props.onNextStep}>
                            <Select label={formatMessage({id: 'general.birthMonth'})}
                                name="user.birth.month"
                                options={this.getMonthOptions()}
                                required
                            />
                            <Select label={formatMessage({id: 'general.birthYear'})}
                                name="user.birth.year"
                                options={this.getYearOptions()} required
                            />
                            <RadioGroup label={formatMessage({id: 'general.gender'})}
                                name="user.gender"
                                onChange={this.onChooseGender}
                                options={[
                                            {value: 'female', label: formatMessage({id: 'general.female'})},
                                            {value: 'male', label: formatMessage({id: 'general.male'})},
                                            {value: 'other', label: ''}
                                ]}
                                required
                            />
                            <div className="gender-input">
                                <Input name="user.genderOther"
                                    type="text"
                                    validations={{
                                        maxLength: 25
                                    }}
                                    validationErrors={{
                                        maxLength: formatMessage({
                                            id: 'registration.validationMaxLength'
                                        })
                                    }}
                                    disabled={this.state.otherDisabled}
                                    required={!this.state.otherDisabled}
                                    help={null}
                                />
                            </div>
                            <Select label={formatMessage({id: 'general.country'})}
                                name="user.country"
                                options={getCountryOptions(this.props.intl, DEFAULT_COUNTRY)}
                                required
                            />
                            <Checkbox className="demographics-checkbox-is-robot"
                                label="I'm a robot!"
                                name="user.isRobot"
                            />
                            <NextStepButton waiting={this.props.waiting}
                                text={<intl.FormattedMessage id="registration.nextStep" />}
                            />
                        </Form>
                    </Card>
                    <StepNavigation steps={this.props.totalSteps - 1} active={this.props.activeStep} />
                </Slide>
            );
        }
    })),
    NameStep: intl.injectIntl(React.createClass({
        getDefaultProps: function () {
            return {
                waiting: false
            };
        },
        render: function () {
            var formatMessage = this.props.intl.formatMessage;
            return (
                <Slide className="registration-step name-step">
                    <h2>
                        <intl.FormattedHTMLMessage id="teacherRegistration.nameStepTitle" />
                    </h2>
                    <p className="description">
                        <intl.FormattedMessage id="teacherRegistration.nameStepDescription" />
                        <Tooltip title={'?'}
                            tipContent={formatMessage({id: 'registration.nameStepTooltip'})}
                        />
                    </p>
                    <Card>
                        <Form onValidSubmit={this.props.onNextStep}>
                            <Input label={formatMessage({id: 'teacherRegistration.firstName'})}
                                type="text"
                                name="user.name.first"
                                validations={{
                                    maxLength: 50
                                }}
                                validationErrors={{
                                    maxLength: formatMessage({
                                        id: 'registration.validationMaxLength'
                                    })
                                }}
                                required
                            />
                            <Input label={formatMessage({id: 'teacherRegistration.lastName'})}
                                type="text"
                                name="user.name.last"
                                validations={{
                                    maxLength: 50
                                }}
                                validationErrors={{
                                    maxLength: formatMessage({
                                        id: 'registration.validationMaxLength'
                                    })
                                }}
                                required
                            />
                            <NextStepButton waiting={this.props.waiting}
                                text={<intl.FormattedMessage id="registration.nextStep" />}
                            />
                        </Form>
                    </Card>
                    <StepNavigation steps={this.props.totalSteps - 1} active={this.props.activeStep} />
                </Slide>
            );
        }
    })),
    PhoneNumberStep: intl.injectIntl(React.createClass({
        getDefaultProps: function () {
            return {
                defaultCountry: DEFAULT_COUNTRY,
                waiting: false
            };
        },
        onValidSubmit: function (formData, reset, invalidate) {
            if (!formData.phone || formData.phone.national_number === '+') {
                return invalidate({
                    phone: this.props.intl.formatMessage({id: 'teacherRegistration.validationPhoneNumber'})
                });
            }
            return this.props.onNextStep(formData);
        },
        render: function () {
            var formatMessage = this.props.intl.formatMessage;
            return (
                <Slide className="registration-step phone-step">
                    <h2>
                        <intl.FormattedMessage id="teacherRegistration.phoneStepTitle" />
                    </h2>
                    <p className="description">
                        <intl.FormattedMessage id="teacherRegistration.phoneStepDescription" />
                        <Tooltip title={'?'}
                            tipContent={formatMessage({id: 'registration.nameStepTooltip'})}
                        />
                    </p>
                    <Card>
                        <Form onValidSubmit={this.onValidSubmit}>
                            <PhoneInput label={formatMessage({id: 'teacherRegistration.phoneNumber'})}
                                name="phone"
                                defaultCountry={this.props.defaultCountry}
                                required
                            />
                            <Checkbox label={formatMessage({id: 'teacherRegistration.phoneConsent'})}
                                name="phoneConsent"
                                required="isFalse"
                                validationErrors={{
                                    isFalse: formatMessage({id: 'teacherRegistration.validationPhoneConsent'})
                                }}
                            />
                            <NextStepButton waiting={this.props.waiting}
                                text={<intl.FormattedMessage id="registration.nextStep" />}
                            />
                        </Form>
                    </Card>
                    <StepNavigation steps={this.props.totalSteps - 1} active={this.props.activeStep} />
                </Slide>
            );
        }
    })),
    OrganizationStep: intl.injectIntl(React.createClass({
        getInitialState: function () {
            return {
                otherDisabled: true
            };
        },
        getDefaultProps: function () {
            return {
                waiting: false
            };
        },
        organizationL10nStems: [
            'orgChoiceElementarySchool',
            'orgChoiceMiddleSchool',
            'orgChoiceHighSchool',
            'orgChoiceUniversity',
            'orgChoiceAfterschool',
            'orgChoiceMuseum',
            'orgChoiceLibrary',
            'orgChoiceCamp',
            'orgChoiceOther'
        ],
        getOrganizationOptions: function () {
            return this.organizationL10nStems.map(function (choice, id) {
                return {
                    value: id,
                    label: this.props.intl.formatMessage({
                        id: 'teacherRegistration.' + choice
                    })
                };
            }.bind(this));
        },
        onChooseOrganization: function (name, values) {
            this.setState({otherDisabled: values.indexOf(this.organizationL10nStems.indexOf('orgChoiceOther')) === -1});
        },
        render: function () {
            var formatMessage = this.props.intl.formatMessage;
            return (
                <Slide className="registration-step organization-step">
                    <h2>
                        <intl.FormattedMessage id="teacherRegistration.orgStepTitle" />
                    </h2>
                    <p className="description">
                        <intl.FormattedMessage id="teacherRegistration.orgStepDescription" />
                        <Tooltip title={'?'}
                            tipContent={formatMessage({id: 'registration.nameStepTooltip'})}
                        />
                    </p>
                    <Card>
                        <Form onValidSubmit={this.props.onNextStep}>
                            <Input label={formatMessage({id: 'teacherRegistration.organization'})}
                                type="text"
                                name="organization.name"
                                validations={{
                                    maxLength: 50
                                }}
                                validationErrors={{
                                    maxLength: formatMessage({
                                        id: 'registration.validationMaxLength'
                                    })
                                }}
                                required
                            />
                            <Input label={formatMessage({id: 'teacherRegistration.orgTitle'})}
                                type="text"
                                name="organization.title"
                                validations={{
                                    maxLength: 50
                                }}
                                validationErrors={{
                                    maxLength: formatMessage({
                                        id: 'registration.validationMaxLength'
                                    })
                                }}
                                required
                            />
                            <div className="organization-type">
                                <b><intl.FormattedMessage id="teacherRegistration.orgType" /></b>
                                <p className="help-text">
                                    <intl.FormattedMessage id="teacherRegistration.checkAll" />
                                </p>
                                <CheckboxGroup name="organization.type"
                                    value={[]}
                                    options={this.getOrganizationOptions()}
                                    onChange={this.onChooseOrganization}
                                    validations={{
                                        minLength: 1
                                    }}
                                    validationErrors={{
                                        minLength: formatMessage({
                                            id: 'teacherRegistration.validationRequired'
                                        })
                                    }}
                                    required
                                />
                            </div>
                            <div className="other-input">
                                <Input name="organization.other"
                                    type="text"
                                    validations={{
                                        maxLength: 50
                                    }}
                                    validationErrors={{
                                        maxLength: formatMessage({
                                            id: 'registration.validationMaxLength'
                                        })
                                    }}
                                    disabled={this.state.otherDisabled}
                                    required={!this.state.otherDisabled}
                                    help={null}
                                    placeholder={formatMessage({id: 'general.other'})}
                                />
                            </div>
                            <div className="url-input">
                                <b><intl.FormattedMessage id="general.website" /></b>
                                <p className="help-text">
                                    <intl.FormattedMessage id="teacherRegistration.notRequired" />
                                </p>
                                <Input type="url"
                                    name="organization.url"
                                    validations={{
                                        maxLength: 200
                                    }}
                                    validationErrors={{
                                        maxLength: formatMessage({
                                            id: 'registration.validationMaxLength'
                                        })
                                    }}
                                    required="isFalse"
                                    placeholder={'http://'}
                                />
                            </div>
                            <NextStepButton waiting={this.props.waiting}
                                text={<intl.FormattedMessage id="registration.nextStep" />}
                            />
                        </Form>
                    </Card>
                    <StepNavigation steps={this.props.totalSteps - 1} active={this.props.activeStep} />
                </Slide>
            );
        }
    })),
    AddressStep: intl.injectIntl(React.createClass({
        getDefaultProps: function () {
            return {
                defaultCountry: DEFAULT_COUNTRY,
                waiting: false
            };
        },
        getInitialState: function () {
            return {
                countryChoice: this.props.defaultCountry,
                waiting: false
            };
        },
        onChangeCountry: function (field, choice) {
            this.setState({countryChoice: choice});
        },
        onValidSubmit: function (formData, reset, invalidate) {
            if (formData.address.country !== 'us') {
                return this.props.onNextStep(formData);
            }
            this.setState({waiting: true});
            var address = {
                street: formData.address.line1,
                secondary: formData.address.line2 || '',
                city: formData.address.city,
                state: formData.address.state,
                zipcode: formData.address.zip
            };
            smartyStreets(address, function (err, res) {
                this.setState({waiting: false});
                if (err) {
                    // We don't want to prevent registration because
                    // address validation isn't working. Log it and
                    // move on.
                    log.error(err);
                    return this.props.onNextStep(formData);
                }
                if (res && res.length > 0) {
                    return this.props.onNextStep(formData);
                } else {
                    return invalidate({
                        all: this.props.intl.formatMessage({id: 'teacherRegistration.addressValidationError'})
                    });
                }
            }.bind(this));
        },
        render: function () {
            var formatMessage = this.props.intl.formatMessage;
            var stateOptions = countryData.subdivisionOptions[this.state.countryChoice];
            stateOptions = [{}].concat(stateOptions);
            return (
                <Slide className="registration-step address-step">
                    <h2>
                        <intl.FormattedMessage id="teacherRegistration.addressStepTitle" />
                    </h2>
                    <p className="description">
                        <intl.FormattedMessage id="teacherRegistration.addressStepDescription" />
                        <Tooltip title={'?'}
                            tipContent={formatMessage({id: 'registration.nameStepTooltip'})}
                        />
                    </p>
                    <Card>
                        <Form onValidSubmit={this.onValidSubmit}>
                            <Select label={formatMessage({id: 'general.country'})}
                                name="address.country"
                                options={getCountryOptions(this.props.intl)}
                                value={this.props.defaultCountry}
                                onChange={this.onChangeCountry}
                                required
                            />
                            <Input label={formatMessage({id: 'teacherRegistration.addressLine1'})}
                                type="text"
                                name="address.line1"
                                validations={{
                                    maxLength: 100
                                }}
                                validationErrors={{
                                    maxLength: formatMessage({
                                        id: 'registration.validationMaxLength'
                                    })
                                }}
                                required
                            />
                            <Input label={formatMessage({id: 'teacherRegistration.addressLine2'})}
                                type="text"
                                name="address.line2"
                                validations={{
                                    maxLength: 100
                                }}
                                validationErrors={{
                                    maxLength: formatMessage({
                                        id: 'registration.validationMaxLength'
                                    })
                                }}
                                required="isFalse"
                            />
                            <Input label={formatMessage({id: 'teacherRegistration.city'})}
                                type="text"
                                name="address.city"
                                validations={{
                                    maxLength: 50
                                }}
                                validationErrors={{
                                    maxLength: formatMessage({
                                        id: 'registration.validationMaxLength'
                                    })
                                }}
                                required
                            />
                            {stateOptions.length > 2 ?
                                <Select label={formatMessage({id: 'teacherRegistration.stateProvince'})}
                                    name="address.state"
                                    options={stateOptions}
                                    required
                                /> :
                                []
                            }
                            <b className="row-label">
                                <intl.FormattedMessage id="teacherRegistration.zipCode" />
                            </b>
                            {this.state.countryChoice !== 'us' ?
                                <p className="help-text">
                                    <intl.FormattedMessage id="teacherRegistration.notRequired" />
                                </p> : []
                            }
                            <Input type="text"
                                name="address.zip"
                                validations={{
                                    maxLength: 10
                                }}
                                validationErrors={{
                                    maxLength: formatMessage({
                                        id: 'registration.validationMaxLength'
                                    })
                                }}
                                required={(this.state.countryChoice === 'us') ? true : 'isFalse'}
                            />
                            <GeneralError name="all" />
                            <NextStepButton waiting={this.props.waiting || this.state.waiting}
                                text={<intl.FormattedMessage id="registration.nextStep" />}
                            />
                        </Form>
                    </Card>
                    <StepNavigation steps={this.props.totalSteps - 1} active={this.props.activeStep} />
                </Slide>
            );
        }
    })),
    UseScratchStep: intl.injectIntl(React.createClass({
        getDefaultProps: function () {
            return {
                waiting: false,
                maxCharacters: 300
            };
        },
        getInitialState: function () {
            return {
                characterCount: 0
            };
        },
        handleTyping: function (name, value) {
            this.setState({
                characterCount: value.length
            });
        },
        render: function () {
            var formatMessage = this.props.intl.formatMessage;
            var textAreaClass = (this.state.characterCount > this.props.maxCharacters) ? 'fail' : '';
            
            return (
                <Slide className="registration-step usescratch-step">
                    <h2>
                        <intl.FormattedMessage id="teacherRegistration.useScratchStepTitle" />
                    </h2>
                    <p className="description">
                        <intl.FormattedMessage id="teacherRegistration.useScratchStepDescription" />
                        <Tooltip title={'?'}
                            tipContent={formatMessage({id: 'registration.nameStepTooltip'})}
                        />
                    </p>
                    <Card>
                        <Form onValidSubmit={this.props.onNextStep}>
                            <TextArea label={formatMessage({id: 'teacherRegistration.howUseScratch'})}
                                name="useScratch"
                                className={textAreaClass}
                                onChange={this.handleTyping}
                                validations={{
                                    maxLength: this.props.maxCharacters
                                }}
                                validationErrors={{
                                    maxLength: formatMessage({
                                        id: 'teacherRegistration.useScratchMaxLength'
                                    })
                                }}
                                required
                            />
                            <CharCount maxCharacters={this.props.maxCharacters}
                                currentCharacters={this.state.characterCount}
                            />
                            <NextStepButton waiting={this.props.waiting}
                                text={<intl.FormattedMessage id="registration.nextStep" />}
                            />
                        </Form>
                    </Card>
                    <StepNavigation steps={this.props.totalSteps - 1} active={this.props.activeStep} />
                </Slide>
            );
        }
    })),
    EmailStep: intl.injectIntl(React.createClass({
        getDefaultProps: function () {
            return {
                waiting: false
            };
        },
        getInitialState: function () {
            return {
                waiting: false
            };
        },
        onValidSubmit: function (formData, reset, invalidate) {
            this.setState({waiting: true});
            api({
                host: '',
                uri: '/accounts/check_email/',
                params: {email: formData.user.email}
            }, function (err, res) {
                this.setState({waiting: false});
                if (err) return invalidate({all: err});
                res = res[0];
                switch (res.msg) {
                case 'valid email':
                    return this.props.onNextStep(formData);
                default:
                    return invalidate({'user.email': res.msg});
                }
            }.bind(this));
        },
        render: function () {
            var formatMessage = this.props.intl.formatMessage;
            return (
                <Slide className="registration-step email-step">
                    <h2>
                        <intl.FormattedMessage id="teacherRegistration.emailStepTitle" />
                    </h2>
                    <p className="description">
                        <intl.FormattedMessage id="teacherRegistration.emailStepDescription" />
                        <Tooltip title={'?'}
                            tipContent={formatMessage({id: 'registration.nameStepTooltip'})}
                        />
                    </p>
                    <Card>
                        <Form onValidSubmit={this.onValidSubmit}>
                            <Input label={formatMessage({id: 'general.emailAddress'})}
                                type="text"
                                name="user.email"
                                validations="isEmail"
                                validationError={formatMessage({id: 'general.validationEmail'})}
                                required
                            />
                            <Input label={formatMessage({id: 'general.confirmEmail'})}
                                type="text"
                                name="confirmEmail"
                                validations="equalsField:user.email"
                                validationErrors={{
                                    equalsField: formatMessage({id: 'general.validationEmailMatch'})
                                }}
                                required
                            />
                            <GeneralError name="all" />
                            <NextStepButton waiting={this.props.waiting}
                                text={<intl.FormattedMessage id="registration.nextStep" />}
                            />
                        </Form>
                    </Card>
                    <StepNavigation steps={this.props.totalSteps - 1} active={this.props.activeStep} />
                </Slide>
            );
        }
    })),
    TeacherApprovalStep: intl.injectIntl(React.createClass({
        getDefaultProps: function () {
            return {
                email: null,
                invited: false,
                confirmed: false
            };
        },
        render: function () {
            return (
                <Slide className="registration-step last-step">
                    <h2>
                        <intl.FormattedMessage id="registration.lastStepTitle" />
                    </h2>
                    <p className="description">
                        <intl.FormattedMessage id="registration.lastStepDescription" />
                    </p>
                    {this.props.confirmed || !this.props.email ?
                        []
                        :
                        (<Card className="confirm">
                            <h4><intl.FormattedMessage id="registration.confirmYourEmail" /></h4>
                            <p>
                                <intl.FormattedMessage id="registration.confirmYourEmailDescription" /><br />
                                <strong>{this.props.email}</strong>
                            </p>
                        </Card>)
                    }
                    {this.props.invited ?
                        <Card className="wait">
                            <h4><intl.FormattedMessage id="registration.waitForApproval" /></h4>
                            <p>
                                <intl.FormattedMessage id="registration.waitForApprovalDescription" />
                            </p>
                        </Card>
                        :
                        []
                    }
                    <Card className="resources">
                        <h4><intl.FormattedMessage id="registration.checkOutResources" /></h4>
                        <p>
                            <intl.FormattedHTMLMessage id="registration.checkOutResourcesDescription" />
                        </p>
                    </Card>
                </Slide>
            );
        }
    })),
    ClassInviteNewStudentStep: intl.injectIntl(React.createClass({
        getDefaultProps: function () {
            return {
                waiting: false
            };
        },
        onNextStep: function () {
            this.props.onNextStep();
        },
        render: function () {
            var formatMessage = this.props.intl.formatMessage;
            return (
                <Slide className="registration-step class-invite-step">
                    {this.props.waiting ? [
                        <Spinner />
                    ] : [
                        <Avatar className="invite-avatar"
                            src={this.props.classroom.educator.profile.images['50x50']}
                        />,
                        <h2>{this.props.classroom.educator.username}</h2>,
                        <p className="description">
                            {formatMessage({id: 'registration.classroomInviteNewStudentStepDescription'})}
                        </p>,
                        <Card>
                            <div className="contents">
                                <h3>{this.props.classroom.title}</h3>
                                <img className="class-image" src={this.props.classroom.images['250x150']} />
                            </div>
                            <NextStepButton onClick={this.onNextStep}
                                waiting={this.props.waiting}
                                text={formatMessage({id: 'general.getStarted'})}
                            />
                        </Card>,
                        <StepNavigation steps={this.props.totalSteps - 1} active={this.props.activeStep} />
                    ]}
                </Slide>
            );
        }
    })),
    ClassInviteExistingStudentStep: intl.injectIntl(React.createClass({
        getDefaultProps: function () {
            return {
                classroom: null,
                onHandleLogOut: function () {},
                studentUsername: null,
                waiting: false
            };
        },
        onNextStep: function () {
            this.props.onNextStep();
        },
        render: function () {
            var formatMessage = this.props.intl.formatMessage;
            return (
                <Slide className="registration-step class-invite-step">
                    {this.props.waiting ? [
                        <Spinner />
                    ] : [
                        <h2>{this.props.studentUsername}</h2>,
                        <p className="description">
                            {formatMessage({id: 'registration.classroomInviteExistingStudentStepDescription'})}
                        </p>,
                        <Card>
                            <div className="contents">
                                <h3>{this.props.classroom.title}</h3>
                                <img className="class-image" src={this.props.classroom.images['250x150']} />
                                <p>{formatMessage({id: 'registration.invitedBy'})}</p>
                                <p><strong>{this.props.classroom.educator.username}</strong></p>
                            </div>
                            <NextStepButton onClick={this.onNextStep}
                                waiting={this.props.waiting}
                                text={formatMessage({id: 'general.getStarted'})}
                            />
                        </Card>,
                        <p><a onClick={this.props.onHandleLogOut}>{formatMessage({id: 'registration.notYou'})}</a></p>,
                        <StepNavigation steps={this.props.totalSteps - 1} active={this.props.activeStep} />
                    ]}
                </Slide>
            );
        }
    })),
    ClassWelcomeStep: intl.injectIntl(React.createClass({
        getDefaultProps: function () {
            return {
                waiting: false
            };
        },
        onNextStep: function () {
            this.props.onNextStep();
        },
        render: function () {
            var formatMessage = this.props.intl.formatMessage;
            return (
                <Slide className="registration-step class-welcome-step">
                    {this.props.waiting ? [
                        <Spinner />
                    ] : [
                        <h2>{formatMessage({id: 'registration.welcomeStepTitle'})}</h2>,
                        <p className="description">{formatMessage({id: 'registration.welcomeStepDescription'})}</p>,
                        <Card>
                            {this.props.classroom ? (
                                <div className="contents">
                                    <h3>{this.props.classroom.title}</h3>
                                    <img className="class-image" src={this.props.classroom.images['250x150']} />
                                    <p>{formatMessage({id: 'registration.welcomeStepPrompt'})}</p>
                                </div>
                            ) : (
                                null
                            )}
                            <NextStepButton onClick={this.onNextStep}
                                waiting={this.props.waiting}
                                text={formatMessage({id: 'registration.goToClass'})}
                            />
                        </Card>
                    ]}
                </Slide>
            );
        }
    })),
    RegistrationError: intl.injectIntl(React.createClass({
        render: function () {
            return (
                <Slide className="registration-step error-step">
                    <h2>Something went wrong</h2>
                    <Card>
                        <h4>There was an error while processing your registration</h4>
                        <p>
                            {this.props.children}
                        </p>
                    </Card>
                </Slide>
            );
        }
    }))
};
