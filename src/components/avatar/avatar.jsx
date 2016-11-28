var React = require('react');
var classNames = require('classnames');

var Avatar = function (props) {
    var classes = classNames(
        'avatar',
        props.className
    );
    return (
        <img
            {... props}
            className={classes}
            src={props.src}
        />
    );
};
Avatar.propTypes = {
    className: React.PropTypes.string,
    src: React.PropTypes.string
};
Avatar.defaultProps = {
    src: '//cdn2.scratch.mit.edu/get_image/user/2584924_24x24.png?v=1438702210.96'
};
module.exports = Avatar;
