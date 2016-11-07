var connect = require('react-redux').connect;
var defaults = require('lodash.defaultsdeep');
var React = require('react');
var render = require('../../lib/render.jsx');

var api = require('../../lib/api');
var sessionActions = require('../../redux/session.js');

var Deck = require('../../components/deck/deck.jsx');
var Progression = require('../../components/progression/progression.jsx');
var Steps = require('../../components/registration/steps.jsx');

require('./teacherregistration.scss');


var TeacherRegistration = React.createClass({
    type: 'TeacherRegistration',
    getInitialState: function () {
        return {
            formData: {},
            registrationError: null,
            step: 0,
            waiting: false
        };
    },
    advanceStep: function (formData) {
        formData = formData || {};
        this.setState({
            step: this.state.step + 1,
            formData: defaults({}, formData, this.state.formData)
        });
    },
    register: function (formData) {
        this.setState({waiting: true});
        api({
            host: '',
            uri: '/classes/register_educator/',
            method: 'post',
            useCsrf: true,
            formData: {
                username: this.state.formData.user.username,
                email: formData.user.email,
                password: this.state.formData.user.password,
                birth_month: this.state.formData.user.birth.month,
                birth_year: this.state.formData.user.birth.year,
                gender: (
                    this.state.formData.user.gender === 'other' ?
                    this.state.formData.user.genderOther :
                    this.state.formData.user.gender
                ),
                country: this.state.formData.user.country,
                is_robot: this.state.formData.user.isRobot,
                first_name: this.state.formData.user.name.first,
                last_name: this.state.formData.user.name.last,
                phone_number: this.state.formData.phone.national_number,
                organization_name: this.state.formData.organization.name,
                organization_title: this.state.formData.organization.title,
                organization_type: this.state.formData.organization.type,
                organization_other: this.state.formData.organization.other,
                organization_url: this.state.formData.organization.url,
                address_country: this.state.formData.address.country,
                address_line1: this.state.formData.address.line1,
                address_line2: this.state.formData.address.line2,
                address_city: this.state.formData.address.city,
                address_state: this.state.formData.address.state,
                address_zip: this.state.formData.address.zip,
                how_use_scratch: this.state.formData.useScratch
            }
        }, function (err, res) {
            this.setState({waiting: false});
            if (err) return this.setState({registrationError: err});
            if (res[0].success) {
                this.props.dispatch(sessionActions.refreshSession());
                return this.advanceStep(formData);
            }
            this.setState({registrationError: res[0].msg});
        }.bind(this));

    },
    render: function () {
        var permissions = this.props.session.permissions || {};
        return (
            <Deck className="teacher-registration">
                {this.state.registrationError ?
                    <Steps.RegistrationError>
                        {this.state.registrationError}
                    </Steps.RegistrationError>
                :
                    <Progression {... this.state}>
                        <Steps.UsernameStep onNextStep={this.advanceStep}
                            waiting={this.state.waiting}
                        />
                        <Steps.DemographicsStep onNextStep={this.advanceStep}
                            waiting={this.state.waiting}
                        />
                        <Steps.NameStep onNextStep={this.advanceStep}
                            waiting={this.state.waiting}
                        />
                        <Steps.PhoneNumberStep onNextStep={this.advanceStep}
                            waiting={this.state.waiting}
                            defaultCountry={
                                                   this.state.formData.user && this.state.formData.user.country
                                               }
                        />
                        <Steps.OrganizationStep onNextStep={this.advanceStep}
                            waiting={this.state.waiting}
                        />
                        <Steps.AddressStep onNextStep={this.advanceStep}
                            waiting={this.state.waiting}
                            defaultCountry={
                                               this.state.formData.user && this.state.formData.user.country
                                           }
                        />
                        <Steps.UseScratchStep onNextStep={this.advanceStep}
                            waiting={this.state.waiting}
                        />
                        <Steps.EmailStep onNextStep={this.register}
                            waiting={this.state.waiting}
                        />
                        <Steps.TeacherApprovalStep email={this.state.formData.user && this.state.formData.user.email}
                            confirmed={permissions.social}
                            invited={permissions.educator_invitee}
                            educator={permissions.educator}
                        />
                    </Progression>
                }
            </Deck>
        );
    }
});

var mapStateToProps = function (state) {
    return {
        session: state.session.session
    };
};

var ConnectedTeacherRegistration = connect(mapStateToProps)(TeacherRegistration);

render(<ConnectedTeacherRegistration />, document.getElementById('app'));
