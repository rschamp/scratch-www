var React = require('react');
var classNames = require('classnames');

require('./button.scss');

var Button = function (props) {
    var classes = classNames(
        'button',
        props.className
    );
    return (
        <button
            {... props}
            className={classes}
        >
            {props.children}
        </button>
    );
};
Button.propTypes = {
    children: React.PropTypes.node,
    className: React.PropTypes.string
};
module.exports = Button;
