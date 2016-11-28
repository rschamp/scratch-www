var classNames = require('classnames');
var React = require('react');

require('./box.scss');

var Box = function (props) {
    var classes = classNames(
        'box',
        props.className
    );
    return (
        <div className={classes}>
            <div className="box-header">
                <h4>{props.title}</h4>
                <h5>{props.subtitle}</h5>
                <p>
                    <a
                        href={props.moreHref}
                        {...props.moreProps}
                    >
                        {props.moreTitle}
                    </a>
                </p>
            </div>

            <div className="box-content">
                {props.children}
            </div>
        </div>
    );
};
Box.propTypes = {
    children: React.PropTypes.node,
    className: React.PropTypes.string,
    moreHref: React.PropTypes.string,
    moreProps: React.PropTypes.object, // eslint-disable-line react/forbid-prop-types
    moreTitle: React.PropTypes.string,
    subtitle: React.PropTypes.string,
    title: React.PropTypes.string.isRequired
};
module.exports = Box;
