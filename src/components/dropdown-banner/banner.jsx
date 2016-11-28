var classNames = require('classnames');
var React = require('react');

require('./banner.scss');

/**
 * Container for messages displayed below the nav bar that can be dismissed
 * (See: email not confirmed banner)
 *
 * @param {object} props React props
 * @returns {React.Component} rendered component
 */
var Banner = function (props) {
    var classes = classNames(
        'banner',
        props.className
    );
    return (
        <div className={classes}>
            <div className="inner">
                {props.children}
                {props.onRequestDismiss ? [
                    <a
                        className="close"
                        href="#"
                        key="close"
                        onClick={props.onRequestDismiss}
                    >
                        x
                    </a>
                ] : []}
            </div>
        </div>
    );
};
Banner.propTypes = {
    children: React.PropTypes.node,
    className: React.PropTypes.string,
    onRequestDismiss: React.PropTypes.func
};
module.exports = Banner;
