var React = require('react');
var classNames = require('classnames');

require('./dropdown.scss');

// @TODO Upgrade react-onclickoutside and use the HOC here with a stateless function
var Dropdown = React.createClass({ // eslint-disable-line react/prefer-es6-class
    propTypes: {
        children: React.PropTypes.node,
        className: React.PropTypes.string,
        isOpen: React.PropTypes.bool,
        onRequestClose: React.PropTypes.func
    },
    mixins: [
        require('react-onclickoutside')
    ],
    getDefaultProps: function () {
        return {
            as: 'div',
            isOpen: false
        };
    },
    handleClickOutside: function () {
        if (this.props.isOpen) {
            this.props.onRequestClose();
        }
    },
    render: function () {
        var classes = classNames(
            'dropdown',
            this.props.className,
            {open: this.props.isOpen}
        );
        return (
            <this.props.as className={classes}>
                {this.props.children}
            </this.props.as>
        );
    }
});
module.exports = Dropdown;
