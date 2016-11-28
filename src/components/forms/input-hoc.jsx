var React = require('react');

module.exports = function InputComponentMixin (Component) {
    var InputComponent = function (props) {
        return (
            <Component
                help={props.required ? null : props.messages['general.notRequired']}
                {...props}
            />
        );
    };
    InputComponent.propTypes = {
        messages: React.PropTypes.string,
        required: React.PropTypes.bool
    };
    InputComponent.defaultProps = {
        messages: {
            'general.notRequired': 'Not Required'
        }
    };
    return InputComponent;
};
